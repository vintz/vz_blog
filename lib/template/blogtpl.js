"use strict";
const template_1 = require('./template');
const parser_1 = require('../parsing/parser');
const path = require('path');
const winston = require('winston');
var striptags = require('striptags');
class BlogTplEngine extends template_1.TemplateEngine {
    constructor(srcPath, defaultsrcPath, tplFoldername, blogFoldername, adminFoldername, authorFoldername, markdwonFoldername, excerptLength, shortExcerptLength, tplExtension, i8n, done) {
        super(tplExtension);
        this._excerpt = (text, render, excerptLength) => {
            var result = render(text);
            result = this.postParser().Parse(result, true);
            result = striptags(result);
            if (result.length >= excerptLength + 3) {
                result = result.substr(0, excerptLength) + '...';
            }
            return result;
        };
        this.shortExcerpt = () => {
            return (text, render) => {
                return this._excerpt(text, render, this.shortExcerptLength);
            };
        };
        this.excerpt = () => {
            return (text, render) => {
                return this._excerpt(text, render, this.excerptLength);
            };
        };
        this.formatDate = () => {
            return (text, render) => {
                text = text + ' | date';
                return this.innerTranslate(text, render);
            };
        };
        this.translate = () => {
            return (text, render) => {
                return this.innerTranslate(text, render);
            };
        };
        this.innerTranslate = (text, render) => {
            var result = '';
            var text = render(text);
            var splitted = text.split('|');
            result = this.i8n.Translate(splitted[0], splitted.length > 1 ? splitted[1].trim() : null);
            return result;
        };
        this.parse = () => {
            return (text, render) => {
                var parser = this.postParser();
                var result = parser.Parse(render(text));
                //this.context.Data.summary = parser.GetSummary();
                return result;
            };
        };
        this.useBaseTemplate = () => {
            return this.useTemplate(this.tplFiles);
        };
        this.useMarkdownTemplate = () => {
            return this.useTemplate(this.mdTplFiles);
        };
        this.useAdminTemplate = () => {
            return this.useTemplate(this.adminTplFiles, 'isadmin');
        };
        this.useAuthorTemplate = () => {
            return this.useTemplate(this.authorTplFiles, 'connected');
        };
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
        this.loadTemplates(srcPath, defaultsrcPath, this.tplFiles, path.join(tplFoldername, blogFoldername), () => {
            winston.info('base templates loaded');
            this.loadTemplates(srcPath, defaultsrcPath, this.mdTplFiles, path.join(tplFoldername, markdwonFoldername), () => {
                winston.info('markdown templates loaded');
                this.loadTemplates(srcPath, defaultsrcPath, this.adminTplFiles, path.join(tplFoldername, adminFoldername), () => {
                    winston.info('admin templates loaded');
                    this.loadTemplates(srcPath, defaultsrcPath, this.authorTplFiles, path.join(tplFoldername, authorFoldername), () => {
                        winston.info('author templates loaded');
                        done();
                    });
                });
            });
        });
    }
    postParser() {
        return new parser_1.PostParser(this);
    }
    HasMarkdown(markdownTag) {
        return (markdownTag in this.mdTplFiles);
    }
    RenderText(text) {
        var parser = this.postParser();
        var rendered = parser.Parse(text);
        var result = {
            text: rendered,
            summary: parser.GetSummary()
        };
        return result;
    }
}
exports.BlogTplEngine = BlogTplEngine;
