"use strict";
const errors_1 = require('../../interface/errors');
const fs = require('fs');
const path = require('path');
const DEFINITION_FILE_NAME = 'definition.json';
class PluginManager {
    constructor(path) {
        this.path = path;
        this.plugins = {};
    }
    Init() {
        var files = fs.readdirSync(this.path);
        if (files && files.length <= 0) {
            return { error: errors_1.Errors.UnableToLoadPlugins, text: errors_1.ErrorsText.UnableToLoadPlugins };
        }
        else {
            for (var key in files) {
                var currentFile = path.join(this.path, files[key]);
                if (fs.lstatSync(currentFile).isDirectory()) {
                    this.addPlugin(currentFile);
                }
            }
            return null;
        }
    }
    addPlugin(directoryPath) {
        var definition = JSON.parse(fs.readFileSync(path.join(directoryPath, DEFINITION_FILE_NAME), 'utf8'));
        const pluginClass = require(path.join(__dirname, '..', '..', directoryPath, definition.ClassFile));
        definition.Class = pluginClass;
        this.plugins[definition.Id] = definition;
    }
    GetPlugin(id) {
        return this.plugins[id];
    }
    GetPlugins(type, activePlugin, activePluginParams) {
        var result = [];
        for (var key in this.plugins) {
            var current = this.plugins[key];
            if (current.Type == type) {
                if (current.Id == activePlugin) {
                    current.Selected = true;
                    for (var key2 in current.Parameters) {
                        var param = current.Parameters[key2];
                        if (param.Name in activePluginParams) {
                            param.DefaultValue = activePluginParams[param.Name];
                        }
                    }
                }
                result.push(current);
            }
        }
        return result;
    }
}
exports.PluginManager = PluginManager;
