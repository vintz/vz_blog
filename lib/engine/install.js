"use strict";
var bodyParser = require('body-parser');
var cookieParser = require('cookie-parser');
const errors_1 = require('../../interface/errors');
const plugin_1 = require('../../interface/plugin');
const config_1 = require('../../interface/config');
const pluginmanager_1 = require('../managers/pluginmanager');
const engine_1 = require('./engine');
class InstallerBlogEngine extends engine_1.BlogEngine {
    constructor(dataAccess, done) {
        super(dataAccess, done);
        this.showInstaller = (req, res, next) => {
            var context = {
                Name: 'installer',
                Data: {
                    context: 'installer',
                    connected: true,
                    isadmin: true,
                    langs: [
                        { key: 'FR', label: this.translate('FRENCH') },
                        { key: 'EN', label: this.translate('ENGLISH') },
                        { key: 'DE', label: this.translate('GERMAN') },
                        { key: 'IT', label: this.translate('ITALIAN') },
                    ],
                    dataPlugins: this.pluginManager.GetPlugins(plugin_1.PluginType.PostsDataAccess),
                    commentsPlugins: this.pluginManager.GetPlugins(plugin_1.PluginType.CommentsDataAccess),
                },
                Jwt: this.auth.GenerateInstallerToken()
            };
            var result = this.blogTpl.Render('{{#_admin}}default{{/_admin}}', context.Data);
            res.status(200).end(result);
        };
        this.saveAdminInfo = (req, res) => {
            res.setHeader('Access-Control-Allow-Origin', '*');
            if (req.body.account) {
                this.config.title = req.body.title;
                this.config.subTitle = req.body.motto;
                this.config.defaultLanguage = req.body.lang;
                this.dataAccess.SaveConfig(this.config);
                var salt = this.auth.GenerateSalt();
                var cryptedPassword = this.auth.Hash(salt + req.body.password);
                var user = {
                    login: req.body.account,
                    password: cryptedPassword,
                    salt: salt,
                    name: req.body.account,
                    description: '',
                    isadmin: true
                };
                this.dataAccess.SaveUser(user);
                this.saveDataPlugin(req);
                res.status(200).send('reload');
                this.dataAccess.ForceSave(() => { process.exit(1); });
            }
            else {
                res.status(500).json({ error: errors_1.Errors.CongfigError, text: this.translate(errors_1.Errors.ConfigError.Text) });
            }
        };
    }
    init(done) {
        this.plugins = null;
        this.logInfo('Installer mode activated');
        this.config = config_1.InitConfig();
        this.pluginManager = new pluginmanager_1.PluginManager(this.config.pluginsFolderPath);
        this.pluginManager.Init();
        this.parseParameters();
        this.router.get('/', this.showInstaller);
        this.router.post('/saveadmininfo', this.saveAdminInfo);
        done();
    }
    initializationFinished(done) {
        done();
    }
}
exports.InstallerBlogEngine = InstallerBlogEngine;
