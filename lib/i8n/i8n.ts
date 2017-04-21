var dateFormat = require('dateformat')
import * as fs from 'fs';
import * as path from 'path';

/*interface ILang
{
    name: string;
    values: {[id:string]: string};
}*/

const DateFormatName= 'DATE_FORMAT';
const ShortDateFormatName= 'SHORT_DATE_FORMAT';
const LongDateFormatName= 'LONG_DATE_FORMAT';
const DateI8N = 'DATE_I8N';
export class I8N
{
    protected langs:{[id:string]:{}};
    protected defaultLanguage
    protected loaded: boolean = false;
    protected learningMode: boolean;
    protected path: string;

    constructor(path: string, defaultLanguage: string, learningMode?: boolean)
    {
        this.defaultLanguage = defaultLanguage;
        this.learningMode = learningMode?learningMode:false;
        this.path = path;
        this.load(path);
    }

    protected load(currentPath: string)
    {
        this.langs = {};
        fs.readdir(currentPath, (err, files) =>
        {
            if (err)
            {
                // TODO MANAGE ERROR
            }
            else 
            {
                var count = files.length;
                for (var key in files)
                {
                    var file = files[key];
                    if (file.substr(file.length - 5, 5) == '.json')
                    {
                        fs.readFile(path.join(currentPath, file), 'utf8', (err, data)=>
                        {
                            count--;
                            if (err)
                            {
                                // TODO MANAGE ERROR
                            }
                            else 
                            {
                                this.langs[file.substr(0,file.length - 5)] = JSON.parse(data);
                            }
                            this.loaded = count == 0;
                        });
                    }
                    else 
                    {
                        count--;
                    }
                }
            }
        });
        return {};
        // TODO
    }

    public Translate(text: string, parameter: string): string
    {
        var result = '';
        if (parameter)
        {
            parameter = parameter.trim();
        }
        switch(parameter)
        {
            case 'date':
                result = this.dateConvert(text);
                break;

            default: 
                result = this.simpleTranslate(text, parameter);
                break;
        }
        return result;
    }

    protected dateConvert(text: string): string
    {
        var result = '';
        if (text && text.trim() != '')
        {
            var lang = this.defaultLanguage.toLowerCase();
            if (this.langs[lang] && this.langs[lang][DateI8N])
            {
                dateFormat.i8n = this.langs[lang][DateI8N];
            }
            
            var date = new Date(parseInt(text));
            var format = (this.langs[lang] && this.langs[lang][DateFormatName])?this.langs[lang][DateFormatName]: 'isoDate';
            result = dateFormat(date, format);
        }
        
        return result;
    }

    protected simpleTranslate(text: string,  parameter: string): string
    {
        var result = text.trim();
        var lang: string = this.defaultLanguage;
        if (parameter && parameter in this.langs)
        {
            lang = parameter;
        }
        lang = lang.toLowerCase();
        if (this.langs[lang] && this.langs[lang][result])
        {
            result = this.langs[lang][result];
        }
        else if (this.learningMode)
        {
            var tmpLang = this.defaultLanguage.toLowerCase();
            if (this.langs[tmpLang] && !this.langs[tmpLang][result])
            {
                this.langs[tmpLang][result] = result;
                this.save();
            }
            result = '*-* '+ result +' *-*';
        }
        return result;
    }

    protected save()
    {
        var text = JSON.stringify(this.langs[this.defaultLanguage.toLowerCase()],null,'   ');
        
        var file = this.defaultLanguage+'.json';
        fs.writeFile(path.join(this.path, file), text, (err)=>
        {
            if (err)
            {
                console.log(err);
            }
        });
    }

}