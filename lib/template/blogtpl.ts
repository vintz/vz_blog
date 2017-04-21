import {TemplateEngine} from './template';
import {IContext, BlogContextName, IRenderedText} from '../../interface/data';
import {DataAccess} from '../data/data';
import {PostParser} from '../parsing/parser';
import {I8N} from '../i8n/i8n';
import * as path from 'path';
import * as winston from 'winston';
var striptags = require('striptags')

export class BlogTplEngine extends TemplateEngine
{
    protected excerptLength: number;
    protected shortExcerptLength: number; 
    protected i8n: I8N;

    protected tplFiles:{[index: string]: string};
    protected mdTplFiles:{[index: string]: string};
    protected adminTplFiles:{[index: string]: string};
    protected authorTplFiles:{[index: string]: string};

    constructor(srcPath: string, defaultsrcPath: string, tplFoldername: string, blogFoldername: string, adminFoldername: string, authorFoldername: string,  markdwonFoldername: string, excerptLength: number,  shortExcerptLength: number, tplExtension: string, i8n: I8N, done: ()=>void)
    {
        super(tplExtension);

        this.excerptLength = excerptLength;
        this.shortExcerptLength = shortExcerptLength;
        this.i8n = i8n;
        
        this.tplFiles = {};
        this.mdTplFiles = {};
        this.adminTplFiles = {};
        this.authorTplFiles = {};

        this.addKeyWord('_template', this.useBaseTemplate);
        this.addKeyWord('_markdown', this.useMarkdownTemplate);
        this.addKeyWord('_admin', this.useAdminTemplate);
        this.addKeyWord('_author', this.useAuthorTemplate);
        this.addKeyWord('_excerpt', this.excerpt);
        this.addKeyWord('_shortexcerpt', this.shortExcerpt);
        this.addKeyWord('_translate', this.translate);
        this.addKeyWord('_date', this.formatDate);
        this.addKeyWord('_parse', this.parse);

        this.loadTemplates(srcPath, defaultsrcPath, this.tplFiles, path.join(tplFoldername, blogFoldername), ()=>
        {
            winston.info('base templates loaded');
            this.loadTemplates(srcPath, defaultsrcPath, this.mdTplFiles, path.join(tplFoldername, markdwonFoldername),()=>
            {
                winston.info('markdown templates loaded');
                this.loadTemplates(srcPath, defaultsrcPath, this.adminTplFiles, path.join(tplFoldername, adminFoldername),()=>
                {
                    winston.info('admin templates loaded');
                    this.loadTemplates(srcPath, defaultsrcPath, this.authorTplFiles, path.join(tplFoldername, authorFoldername),()=>
                    {
                        winston.info('author templates loaded');
                        done();
                    });
                });
            }); 
        });
    }

    protected postParser ()
    {
        return new PostParser(this);
    }

    private _excerpt = (text, render, excerptLength) =>
    {
        var result = render(text);
        result = this.postParser().Parse(result, true);
        result = striptags(result);
        if (result.length >= excerptLength + 3)
        {
            result = result.substr(0, excerptLength) + '...';
        }
        return result;
    }

    private shortExcerpt = () =>
    {
        return (text: string, render) =>
        {
          return  this._excerpt(text, render, this.shortExcerptLength);
        }
    }
    private excerpt = () =>
    {
        return (text: string, render) =>
        {
           return this._excerpt(text, render, this.excerptLength);
        }
    }

    private formatDate = () =>
    {
        return (text, render) =>
        {
            text = text + ' | date';
            return this.innerTranslate(text, render);
        }
    }

    private translate = () =>
    {
        return (text, render) =>
        {
            return this.innerTranslate(text, render);
        }
    }

    private innerTranslate = (text, render) =>
    {
        var result = '';
        var text = render(text);
        var splitted = text.split('|');
        result = this.i8n.Translate(splitted[0], splitted.length > 1? splitted[1].trim(): null);
        return result;
    }

    private parse = () =>
    {   
        return (text, render) =>
        {
            var parser = this.postParser();
            var result = parser.Parse(render(text));
            //this.context.Data.summary = parser.GetSummary();
            return result;
        }
    }

    private useBaseTemplate = () =>
    {
        return this.useTemplate(this.tplFiles);
    }

    private useMarkdownTemplate = () => 
    {
        return this.useTemplate(this.mdTplFiles);
    }
    
    private useAdminTemplate = () => 
    {
        return this.useTemplate(this.adminTplFiles, 'isadmin');
    }

    private useAuthorTemplate = () => 
    {
        return this.useTemplate(this.authorTplFiles, 'connected');
    }
    
    public HasMarkdown(markdownTag: string): boolean
    {
        return (markdownTag in this.mdTplFiles);
    }


    public RenderText(text): IRenderedText
    {
        
        var parser = this.postParser();
        var rendered = parser.Parse(text);
        var result = {
            text: rendered,
            summary: parser.GetSummary()
        };

        return result;
    }
}