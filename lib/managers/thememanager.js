"use strict";
const errors_1 = require('../../interface/errors');
const manager_1 = require('./manager');
const fs = require('fs');
const path = require('path');
const THEME_FILE_NAME = 'theme.json';
class ThemeManager extends manager_1.Manager {
    constructor(path) {
        super(path, THEME_FILE_NAME, errors_1.Errors.UnableToLoadThemes);
        this.themes = [];
    }
    addContent(directoryPath) {
        var definition = JSON.parse(fs.readFileSync(path.join(directoryPath, this.baseFileName), 'utf8'));
        definition.Directory = directoryPath.replace(path.win32.sep, path.posix.sep);
        this.themes.push(definition);
    }
    purgeContent() {
        this.themes = [];
    }
    GetThemes(selected) {
        for (var key in this.themes) {
            var currentTheme = this.themes[key];
            if (currentTheme.Directory == selected) {
                currentTheme.Selected = true;
            }
            else {
                currentTheme.Selected = false;
            }
        }
        return this.themes;
    }
}
exports.ThemeManager = ThemeManager;
