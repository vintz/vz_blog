"use strict";
const express = require('express');
const http = require('http');
const path = require('path');
const i8n_1 = require('../i8n/i8n');
var bodyParser = require('body-parser');
var cookieParser = require('cookie-parser');
const plugin_1 = require('../../interface/plugin');
const blogtpl_1 = require('../template/blogtpl');
const auth_1 = require('../authentication/auth');
const winston = require('winston');
class BlogEngine {
    constructor(dataAccess, done) {
        this.publicFolder = 'public';
        this.parseParameters = () => {
            process.argv.forEach((val, index, array) => {
                if (val.indexOf('=') > 0) {
                    var splitted = val.split('=');
                    this.innerParseParameter(splitted[0], splitted[1]);
                }
                else if (val.toLowerCase() == '--help') {
                    console.log('node index.js [port=portnumber] [lang=lang] [learningmode=true]');
                    process.exit();
                }
            });
        };
        this.innerParseParameter = (param, value) => {
            switch (param.toLowerCase()) {
                case 'port':
                    this.config.port = value;
                    break;
                case 'lang':
                    this.config.defaultLanguage = value;
                    break;
                case 'learningmode':
                    this.learningMode = true;
                    break;
            }
        };
        this.serveFile = (req, res, next) => {
            var pathInfo = req.params[0] ? req.params[0] : this.config.defaultWebServerFile;
            res.sendFile(pathInfo, { root: path.join(this.config.currentThemePath, this.publicFolder) }, (err) => {
                if (err) {
                    res.sendFile(pathInfo, { root: path.join(this.config.defaultThemePath, this.publicFolder) }, (err) => {
                        if (err) {
                            res.status(404).sendFile('404.htm', { root: path.join(this.config.defaultThemePath, this.publicFolder) });
                        }
                    });
                }
            });
        };
        this.saveDataPlugin = (req) => {
            winston.info('Saving data plugin configuration');
            var dataPlugin = req.body.dataplugin;
            this.dataAccess.SaveActivePlugin(plugin_1.PluginType.PostsDataAccess, dataPlugin.active);
            var pluginParams = {};
            for (var key in dataPlugin.parameters) {
                var current = dataPlugin.parameters[key];
                pluginParams[current.name] = current.value;
            }
            this.dataAccess.SetPluginParameters(plugin_1.PluginType.PostsDataAccess, pluginParams);
            var commentPlugin = req.body.commentsplugin;
            this.dataAccess.SaveActivePlugin(plugin_1.PluginType.CommentsDataAccess, commentPlugin.active);
            var pluginParams = {};
            for (var key in commentPlugin.parameters) {
                var current = commentPlugin.parameters[key];
                pluginParams[current.name] = current.value;
            }
            this.dataAccess.SetPluginParameters(plugin_1.PluginType.CommentsDataAccess, pluginParams);
            var parserPlugin = req.body.parserplugin;
            this.dataAccess.SaveActivePlugin(plugin_1.PluginType.PostParser, parserPlugin.active);
            var pluginParams = {};
            for (var key in parserPlugin.parameters) {
                var current = parserPlugin.parameters[key];
                pluginParams[current.name] = current.value;
            }
            this.dataAccess.SetPluginParameters(plugin_1.PluginType.PostParser, pluginParams);
        };
        this.manageError = (err, res) => {
            var errorString = JSON.stringify(err);
            winston.error(errorString);
            res.status(500).end(errorString);
        };
        this.learningMode = false;
        this.dataAccess = dataAccess;
        this.dataAccess.Init({ 'dbfile': 'db.json' }, (err) => {
            this.router = express.Router();
            this.init(() => {
                this.router.get('/*', this.serveFile);
                this.finishInitialization(() => {
                    this.initializationFinished(() => {
                        done();
                    });
                });
            });
        });
    }
    finishInitialization(done) {
        winston.info('Starting webserver');
        var server = express();
        server.use(bodyParser.json());
        server.use(bodyParser.urlencoded({ extended: true }));
        server.use(cookieParser());
        server.use(function (req, res, next) {
            res.header("Access-Control-Allow-Origin", "*");
            res.header("Access-Control-Allow-Methods", "GET, POST");
            res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept, Authorization");
            if (req.method === 'OPTIONS') {
                res.sendStatus(200);
            }
            else {
                next();
            }
        });
        server.use('/', this.getRouter());
        winston.info('Router started');
        var httpServ = http.createServer(server);
        this.i8n = new i8n_1.I8N(this.config.i8nPath, this.config.defaultLanguage, this.learningMode);
        this.auth = new auth_1.Auth(this.config.challengeTimeToLive, this.config.challengeNbr, this.config.secretKey);
        this.blogTpl = new blogtpl_1.BlogTplEngine(this.config.currentThemePath, this.config.defaultThemePath, this.config.tplFoldername, this.config.blogFoldernname, this.config.adminFoldername, this.config.authorFoldername, this.config.markdownFoldername, this.config.excerptLength, this.config.shortExcerptLength, this.config.templateExtension, this.i8n, () => {
            httpServ.listen(this.config.port, () => {
                winston.info('Server started on port : ' + this.config.port);
                done();
            });
        });
    }
    translate(src) {
        var result = this.i8n.Translate(src, null);
        return result;
    }
    logInfo(message) {
        winston.info(message);
    }
    logError(message) {
        winston.error(message);
    }
    isConnected(token, done) {
        return this.auth.VerifyToken(token, done);
    }
    isAdmin(token, done) {
        var user = this.auth.DecodeToken(token);
        return user ? user.isadmin : false;
    }
    getJwtInfo(req) {
        var jwt = null;
        if (req.headers && req.headers.authorization) {
            jwt = req.headers.authorization;
        }
        else if (req.cookies && req.cookies.authorization) {
            jwt = req.cookies.authorization;
        }
        var connected = this.isConnected(jwt);
        var isadmin = (connected && this.isAdmin(jwt));
        return { jwt: jwt, connected: connected, isadmin: isadmin };
    }
    getRouter() {
        return this.router;
    }
}
exports.BlogEngine = BlogEngine;
