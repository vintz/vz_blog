"use strict";
const errors_1 = require('../../interface/errors');
const manager_1 = require('./manager');
const fs = require('fs');
const path = require('path');
const DEFINITION_FILE_NAME = 'definition.json';
class PluginManager extends manager_1.Manager {
    constructor(path) {
        super(path, DEFINITION_FILE_NAME, errors_1.Errors.UnableToLoadPlugins);
        this.plugins = {};
    }
    addContent(directoryPath) {
        var definition = JSON.parse(fs.readFileSync(path.join(directoryPath, this.baseFileName), 'utf8'));
        const pluginClass = require(path.join(__dirname, '..', '..', directoryPath, definition.ClassFile));
        definition.Class = pluginClass;
        this.plugins[definition.Id] = definition;
    }
    purgeContent() {
        this.plugins = {};
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
