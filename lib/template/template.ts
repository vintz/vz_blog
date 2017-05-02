import * as mustache from 'mustache';
import * as fs from 'fs';
import * as path from 'path';
import * as winston from 'winston';
import {IRenderedText} from '../../interface/data';
import {PostParser} from '../parsing/parser';

export abstract class TemplateEngine
{
   
    protected count: number;
    protected fullTemplatesLoad: ()=>void
    protected keywords: {[index: string]: ()=>void} 
    protected tplExtension: string;
    protected postParser: PostParser;
    
    constructor(tplExtension)
    {
        this.keywords = {};
        this.tplExtension = tplExtension;
        
    }

    private loadTemplateSuccess = (err)=>
    {
        if (err)
        {
            winston.error(JSON.stringify(err));
        }
        
        this.count--;
        
        if (this.count <= 0)
        {
            this.fullTemplatesLoad();
        }
        
    }

    protected loadTemplates(srcPath, defaultsrcPath, fileArray, tplFolderName, done: ()=>void)
    {
        this.count = 0;
        this.fullTemplatesLoad = done;

        this.innerLoadTemplate(defaultsrcPath, fileArray, tplFolderName);
        this.innerLoadTemplate(srcPath, fileArray, tplFolderName);
    }

    private innerLoadTemplate(currentPath, fileArray, folderName)
    {
        fs.readdir(path.join(currentPath, folderName), (err, files)=>
        {
            if (err)
            {
                // TODO ERROR MANAGEMENT 
            }
            else 
            {
                this.count += files.length;
                for(var key in files)
                {
                    var file = files[key];
                    if(file.substr(file.length - 4, 4) == '.tpl')
                    {
                        this.loadTemplate(file.substr(0,file.length - 4), fileArray, path.join(currentPath, folderName, file), this.loadTemplateSuccess);
                    }
                    else
                    {
                        this.count--;
                    }
                }
            }
        });
    }

    private loadTemplate(filename, fileArray,  srcPath,done: (err)=>void)
    {
        fs.readFile(srcPath, 'utf8', (err, data)=>
        {
            if (err)
            {
                fileArray[filename] = '';
                done(err);
            }
            else 
            {
                fileArray[filename] = data;
                done(null);
            }
        });
    }

    public  abstract RenderText(text): IRenderedText;
    
    public Render(template, data)
    {
        var finalData = {};
        for (var key in this.keywords)
        {
            finalData[key] = this.keywords[key];
        }

        for(var key in data)
        {
            if (!(key in this.keywords))
            {
                finalData[key] = data[key];
            }
        }
        return mustache.render(template, finalData);
    }

    protected addKeyWord(key, fct)
    {
        if (!(key in this.keywords))
        {
            this.keywords[key] = fct;
        }
    }

    protected useTemplate =  (files, testField?: string) => 
    {
        return function(text, render)
        {
            var valid = true;
            if(testField)
            {
                valid = this[testField];
            }
            var text = render(text);
            if (valid && text in files)
            {
                var res = render(files[text]);
                return res;
            }
            else 
            {
                return '';
            }
        }
    }

    public SetPostParser(postParser: PostParser)
    {
        this.postParser = postParser;
    }
}