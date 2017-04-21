"use strict";
const mustache = require('mustache');
const fs = require('fs');
const path = require('path');
const winston = require('winston');
class TemplateEngine {
    constructor(tplExtension) {
        this.loadTemplateSuccess = (err) => {
            if (err) {
                winston.error(JSON.stringify(err));
            }
            this.count--;
            if (this.count <= 0) {
                this.fullTemplatesLoad();
            }
        };
        this.useTemplate = (files, testField) => {
            return function (text, render) {
                var valid = true;
                if (testField) {
                    valid = this[testField];
                }
                var text = render(text);
                if (valid && text in files) {
                    var res = render(files[text]);
                    return res;
                }
                else {
                    return '';
                }
            };
        };
        this.keywords = {};
        this.tplExtension = tplExtension;
    }
    loadTemplates(srcPath, defaultsrcPath, fileArray, tplFolderName, done) {
        this.count = 0;
        this.fullTemplatesLoad = done;
        this.innerLoadTemplate(defaultsrcPath, fileArray, tplFolderName);
        this.innerLoadTemplate(srcPath, fileArray, tplFolderName);
    }
    innerLoadTemplate(currentPath, fileArray, folderName) {
        fs.readdir(path.join(currentPath, folderName), (err, files) => {
            if (err) {
            }
            else {
                this.count += files.length;
                for (var key in files) {
                    var file = files[key];
                    if (file.substr(file.length - 4, 4) == '.tpl') {
                        this.loadTemplate(file.substr(0, file.length - 4), fileArray, path.join(currentPath, folderName, file), this.loadTemplateSuccess);
                    }
                    else {
                        this.count--;
                    }
                }
            }
        });
    }
    loadTemplate(filename, fileArray, srcPath, done) {
        fs.readFile(srcPath, 'utf8', (err, data) => {
            if (err) {
                fileArray[filename] = '';
                done(err);
            }
            else {
                fileArray[filename] = data;
                done(null);
            }
        });
    }
    Render(template, data) {
        var finalData = {};
        for (var key in this.keywords) {
            finalData[key] = this.keywords[key];
        }
        for (var key in data) {
            if (!(key in this.keywords)) {
                finalData[key] = data[key];
            }
        }
        return mustache.render(template, finalData);
    }
    addKeyWord(key, fct) {
        if (!(key in this.keywords)) {
            this.keywords[key] = fct;
        }
    }
}
exports.TemplateEngine = TemplateEngine;
