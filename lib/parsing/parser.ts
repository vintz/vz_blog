import * as md from 'marked';
import {BlogTplEngine} from '../template/blogtpl';
import {ISummaryElement} from '../../interface/data';

export class PostParser
{
    protected summary: ISummaryElement[];
    protected headingIdx: number;
    protected renderer;
    protected trimRenderer;
    protected templateEngine: BlogTplEngine;
    
    constructor(templateEngine: BlogTplEngine)
    {
        this.summary = [];
        this.renderer = new md.Renderer();
        this.trimRenderer = new md.Renderer();
        this.headingIdx = 0;
        
        this.templateEngine = templateEngine;
        this.initReplacer();

        md.setOptions({
            renderer: this.renderer,
            gfm: true,
            tables: true,
            breaks: false,
            pedantic: false,
            sanitize: false,
            smartLists: true,
            smartypants: false
        });
    }

    protected initReplacer()
    {
        if (this.templateEngine.HasMarkdown('heading'))
        {
            this.renderer.heading = this.headingReplace;
        }

        if (this.templateEngine.HasMarkdown('code'))
        {
            this.renderer.code = this.codeReplace;
        }

        if (this.templateEngine.HasMarkdown('blockquote'))
        {
            this.renderer.blockquote = this.blockquoteReplace;
        }

        if (this.templateEngine.HasMarkdown('hr'))
        {
            this.renderer.hr = this.hrReplace;
        }

        if (this.templateEngine.HasMarkdown('html'))
        {
            this.renderer.html = this.htmlReplace;
        }

        if (this.templateEngine.HasMarkdown('list'))
        {
            this.renderer.list = this.listReplace;
        }

        if (this.templateEngine.HasMarkdown('listitem'))
        {
            this.renderer.listitem = this.listitemReplace;
        }

        if (this.templateEngine.HasMarkdown('paragraph'))
        {
            this.renderer.paragraph = this.paragraphReplace;
        }

        if (this.templateEngine.HasMarkdown('table'))
        {
            this.renderer.table = this.tableReplace;
        }

        if (this.templateEngine.HasMarkdown('tablerow'))
        {
            this.renderer.tablerow = this.tablerowReplace;
        }

        if (this.templateEngine.HasMarkdown('tablecell'))
        {
            this.renderer.tablecell = this.tablecellReplace;
        }

            this.trimRenderer.heading = this.trimHeadingReplace;
            this.trimRenderer.code = this.trimCodeReplace;
            this.trimRenderer.blockquote = this.trimBlockquoteReplace;
            this.trimRenderer.hr = this.trimHrReplace;
            this.trimRenderer.html = this.trimHtmlReplace;
            this.trimRenderer.list = this.trimListReplace;
            this.trimRenderer.listitem = this.trimListitemReplace;
            this.trimRenderer.paragraph = this.trimParagraphReplace;
            this.trimRenderer.table = this.trimTableReplace;
            this.trimRenderer.tablerow = this.trimTablerowReplace;
            this.trimRenderer.tablecell = this.trimTablecellReplace;
    }

    protected replaceMarkdown = (tag: string,  data: {}) =>
    {
        var template = '{{#_markdown}}' + tag + '{{/_markdown}}';
        var result = this.templateEngine.Render(template, data);
        return result;
    }

    protected headingReplace = (text, level) => 
    {
            var escapedText = text.toLowerCase().replace(/[^\w]+/g, '-');
            this.headingIdx++;
            
            this.summary.push({id: escapedText, name: text, idx: this.headingIdx, level: level});
            
            var data =
            {
                level: level,
                escapedText: escapedText,
                text: text,
            }
            var tag = 'heading';
            if (this.templateEngine.HasMarkdown('h'+level))
            {
                tag = 'h' + level;
            }
            return this.replaceMarkdown(tag, data);
    }

    protected blockquoteReplace = (quote: string) =>
    {
        var data = {
            quote: quote
        }
        return this.replaceMarkdown('quote', data);
    }

    protected codeReplace = (code: string, language: string) =>
    {
        var data = {
            code: code,
            language: language
        }
        return this.replaceMarkdown('code', data);
    }   

    protected htmlReplace = (html: string) =>
    {
        var data = {
            html: html
        }
        return this.replaceMarkdown('html', data);
    }

    protected hrReplace = () =>
    {
        var data = {
        }
        return this.replaceMarkdown('hr', data);
    }
    
    protected listReplace = (body: string, ordered: boolean) =>
    {
        var data = {
            body: body,
            ordered: ordered
        }
        return this.replaceMarkdown('list', data);
    }
    
    protected listitemReplace = (text: string) =>
    {
        var data = {
            text: text,
           
        }
        return this.replaceMarkdown('listitem', data);
    }

    protected paragraphReplace = (text: string) =>
    {
        var data = {
            text: text,
           
        }
        return this.replaceMarkdown('paragraph', data);
    }

    protected tableReplace = (header: string, body: string) =>
    {
        var data = {
            header: header,
            body: body,
        }
        return this.replaceMarkdown('table', data);
    }

    protected tablerowReplace = (content: string) =>
    {
        var data = {
            content: content,
        }
        return this.replaceMarkdown('tablerow', data);
    }

    protected tablecellReplace = (content: string, flags: {}) =>
    {
        var data = {
            content: content,
            flags: flags
        }
        return this.replaceMarkdown('tablecell', data);
    }


    protected trimHeadingReplace = (text, level) => 
    {
            return text +' ';
    }

    protected trimBlockquoteReplace = (quote: string) =>
    {
        return quote +' ';
    }

    protected trimCodeReplace = (code: string, language: string) =>
    {
        return code +' ';
    }   

    protected trimHtmlReplace = (html: string) =>
    {
        return html +' ';
    }

    protected trimHrReplace = () =>
    {
        return ' ';
    }
    
    protected trimListReplace = (body: string, ordered: boolean) =>
    {
        return body +' ';
    }
    
    protected trimListitemReplace = (text: string) =>
    {
        return text +' ';
    }

    protected trimParagraphReplace = (text: string) =>
    {
        return text +' ';
    }

    protected trimTableReplace = (header: string, body: string) =>
    {
       return header +' ';
    }

    protected trimTablerowReplace = (content: string) =>
    {
        return content +' ';
    }

    protected trimTablecellReplace = (content: string, flags: {}) =>
    {
        return content +' ';
    }


    Parse(mdText: string, trimTags?: boolean)
    {
        this.summary = [];
        if (!trimTags)
        {
            var html = md(mdText);
            return html
        }
        else 
        {
            var result = md(mdText, {renderer: this.trimRenderer});
            return result;
        }
    }

    GetSummary(): ISummaryElement[]
    {
        return this.summary;
    }
}