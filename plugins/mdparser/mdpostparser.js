"use strict";
const md = require('marked');
const parser_1 = require('../../lib/parsing/parser');
class MDPostParser extends parser_1.PostParser {
    constructor() {
        super();
        this.replaceMarkdown = (tag, data) => {
            var template = '{{#_markdown}}' + tag + '{{/_markdown}}';
            var result = this.templateEngine.Render(template, data);
            return result;
        };
        this.headingReplace = (text, level) => {
            var escapedText = text.toLowerCase().replace(/[^\w]+/g, '-');
            this.headingIdx++;
            this.summary.push({ id: escapedText, name: text, idx: this.headingIdx, level: level });
            var data = {
                level: level,
                escapedText: escapedText,
                text: text,
            };
            var tag = 'heading';
            if (this.templateEngine.HasMarkdown('h' + level)) {
                tag = 'h' + level;
            }
            return this.replaceMarkdown(tag, data);
        };
        this.blockquoteReplace = (quote) => {
            var data = {
                quote: quote
            };
            return this.replaceMarkdown('quote', data);
        };
        this.codeReplace = (code, language) => {
            var data = {
                code: code,
                language: language
            };
            return this.replaceMarkdown('code', data);
        };
        this.htmlReplace = (html) => {
            var data = {
                html: html
            };
            return this.replaceMarkdown('html', data);
        };
        this.hrReplace = () => {
            var data = {};
            return this.replaceMarkdown('hr', data);
        };
        this.listReplace = (body, ordered) => {
            var data = {
                body: body,
                ordered: ordered
            };
            return this.replaceMarkdown('list', data);
        };
        this.listitemReplace = (text) => {
            var data = {
                text: text,
            };
            return this.replaceMarkdown('listitem', data);
        };
        this.paragraphReplace = (text) => {
            var data = {
                text: text,
            };
            return this.replaceMarkdown('paragraph', data);
        };
        this.tableReplace = (header, body) => {
            var data = {
                header: header,
                body: body,
            };
            return this.replaceMarkdown('table', data);
        };
        this.tablerowReplace = (content) => {
            var data = {
                content: content,
            };
            return this.replaceMarkdown('tablerow', data);
        };
        this.tablecellReplace = (content, flags) => {
            var data = {
                content: content,
                flags: flags
            };
            return this.replaceMarkdown('tablecell', data);
        };
        this.trimHeadingReplace = (text, level) => {
            return text + ' ';
        };
        this.trimBlockquoteReplace = (quote) => {
            return quote + ' ';
        };
        this.trimCodeReplace = (code, language) => {
            return code + ' ';
        };
        this.trimHtmlReplace = (html) => {
            return html + ' ';
        };
        this.trimHrReplace = () => {
            return ' ';
        };
        this.trimListReplace = (body, ordered) => {
            return body + ' ';
        };
        this.trimListitemReplace = (text) => {
            return text + ' ';
        };
        this.trimParagraphReplace = (text) => {
            return text + ' ';
        };
        this.trimTableReplace = (header, body) => {
            return header + ' ';
        };
        this.trimTablerowReplace = (content) => {
            return content + ' ';
        };
        this.trimTablecellReplace = (content, flags) => {
            return content + ' ';
        };
    }
    Init(parameters, done) {
        this.templateEngine = parameters['templateengine'];
        this.summary = [];
        this.renderer = new md.Renderer();
        this.trimRenderer = new md.Renderer();
        this.headingIdx = 0;
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
        done(null);
    }
    SetTemplateEngine(templateEngine) {
        this.templateEngine = templateEngine;
        this.templateEngine.SetPostParser(this);
        this.initReplacer();
    }
    initReplacer() {
        if (this.templateEngine.HasMarkdown('heading')) {
            this.renderer.heading = this.headingReplace;
        }
        if (this.templateEngine.HasMarkdown('code')) {
            this.renderer.code = this.codeReplace;
        }
        if (this.templateEngine.HasMarkdown('blockquote')) {
            this.renderer.blockquote = this.blockquoteReplace;
        }
        if (this.templateEngine.HasMarkdown('hr')) {
            this.renderer.hr = this.hrReplace;
        }
        if (this.templateEngine.HasMarkdown('html')) {
            this.renderer.html = this.htmlReplace;
        }
        if (this.templateEngine.HasMarkdown('list')) {
            this.renderer.list = this.listReplace;
        }
        if (this.templateEngine.HasMarkdown('listitem')) {
            this.renderer.listitem = this.listitemReplace;
        }
        if (this.templateEngine.HasMarkdown('paragraph')) {
            this.renderer.paragraph = this.paragraphReplace;
        }
        if (this.templateEngine.HasMarkdown('table')) {
            this.renderer.table = this.tableReplace;
        }
        if (this.templateEngine.HasMarkdown('tablerow')) {
            this.renderer.tablerow = this.tablerowReplace;
        }
        if (this.templateEngine.HasMarkdown('tablecell')) {
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
    Parse(mdText, trimTags) {
        this.summary = [];
        if (!trimTags) {
            var html = md(mdText);
            return html;
        }
        else {
            var result = md(mdText, { renderer: this.trimRenderer });
            return result;
        }
    }
    GetSummary() {
        return this.summary;
    }
}
exports.MDPostParser = MDPostParser;
exports.Plugin = MDPostParser;
