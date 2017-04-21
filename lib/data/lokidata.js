"use strict";
const loki = require('lokijs');
const config_1 = require('../../interface/config');
const fs = require('fs');
const UsersCollectionName = 'Users';
const ConfigCollectionName = 'Config';
const PluginCollectionName = 'Plugin';
const ActivePluginsCollectionName = 'ActivePlugins';
class LokiDataAccess {
    constructor() {
        this.GetUser = (id) => {
            var res = this.usersCollection.get(id);
            if (res) {
                res = JSON.parse(JSON.stringify(res));
            }
            return res;
        };
        this.SaveUser = (user) => {
            return this.saveData(user, this.usersCollection);
        };
        this.saveData = (data, collection) => {
            if (data.$loki) {
                data = collection.update(data);
            }
            else {
                data.createDate = Date.now();
                data = collection.insert(data);
                data.id = data.$loki;
            }
            return data;
        };
    }
    Init(parameters, done) {
        var dbFile = parameters['dbfile'];
        this.db = new loki(dbFile, { autoload: true, autosave: true, autoloadCallback: () => {
                fs.exists(dbFile, (exists) => {
                    if (exists) {
                        this.usersCollection = this.db.getCollection(UsersCollectionName);
                        this.configCollection = this.db.getCollection(ConfigCollectionName);
                        this.activePluginsCollection = this.db.getCollection(ActivePluginsCollectionName);
                    }
                    else {
                        this.usersCollection = this.db.addCollection(UsersCollectionName, { unique: ['login'], indices: ['login'] });
                        this.configCollection = this.db.addCollection(ConfigCollectionName, config_1.InitConfig());
                        this.activePluginsCollection = this.db.addCollection(ActivePluginsCollectionName);
                    }
                    done(null);
                });
            } });
    }
    ForceSave(done) {
        this.db.saveDatabase((err) => {
            done();
        });
    }
    CountUsers() {
        var res = this.usersCollection.count();
        return res;
    }
    FindUsers(query) {
        var res = this.usersCollection.chain().find(query).data();
        return res;
    }
    SaveConfig(config) {
        this.saveData(config, this.configCollection);
    }
    LoadConfig() {
        var configs = this.configCollection.find();
        return configs.length > 0 ? configs[0] : null;
    }
    GetActivePlugin(type) {
        var result = this.activePluginsCollection.find({ "Type": type });
        if (result.length >= 1) {
            return result[0].Id;
        }
        else {
            return '';
        }
    }
    SaveActivePlugin(type, id) {
        var result = this.activePluginsCollection.find({ "Type": type });
        if (result.length >= 1) {
            var entry = result[0];
            entry.Id = id;
            this.activePluginsCollection.update(entry);
        }
        else {
            this.activePluginsCollection.insert({ Type: type, Id: id, Parameters: {} });
        }
    }
    SetPluginParameters(type, parameters) {
        var plugins = this.activePluginsCollection.find({ "Type": type });
        if (plugins && plugins.length > 0) {
            var entry = plugins[0];
            entry.Parameters = parameters;
            this.activePluginsCollection.update(entry);
        }
    }
    GetPluginParameters(type) {
        var plugins = this.activePluginsCollection.find({ "Type": type });
        if (plugins && plugins.length > 0) {
            var entry = plugins[0];
            if (entry) {
                return entry.Parameters;
            }
        }
    }
}
exports.LokiDataAccess = LokiDataAccess;
