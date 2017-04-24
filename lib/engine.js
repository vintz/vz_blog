"use strict";
const express = require('express');
const http = require('http');
const path = require('path');
const multer = require('multer');
const i8n_1 = require('./i8n/i8n');
var bodyParser = require('body-parser');
var cookieParser = require('cookie-parser');
const errors_1 = require('./../interface/errors');
const plugin_1 = require('../interface/plugin');
const lokidata_1 = require('./data/lokidata');
const blogtpl_1 = require('./template/blogtpl');
const data_1 = require('../interface/data');
const config_1 = require('../interface/config');
const parser_1 = require('./parsing/parser');
const auth_1 = require('./authentication/auth');
const pluginmanager_1 = require('./managers/pluginmanager');
const thememanager_1 = require('./managers/thememanager');
const winston = require('winston');
class BlogEngine {
    constructor(done) {
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
                },
                Jwt: this.auth.GenerateInstallerToken()
            };
            var result = this.blogTpl.Render('{{#_admin}}default{{/_admin}}', context.Data);
            res.status(200).end(result);
        };
        this.manageError = (err, res) => {
            var errorString = JSON.stringify(err);
            winston.error(errorString);
            res.status(500).end(errorString);
        };
        this.callPosts = (req, res, next) => {
            req.params.action = data_1.BlogContextName.Posts;
            this.call(req, res, next);
        };
        this.call = (req, res, next) => {
            var action = req.params.action.toLowerCase();
            if (action in this.actions) {
                this.actions[action](req, res, next);
            }
            else {
                next();
            }
        };
        this.generateAdminPage = (req, res, next) => {
            var context = this.getContext(req);
            if (!context.Data.connected) {
                context.Data.context = 'login';
                var result = this.blogTpl.Render('{{#_template}}default{{/_template}}', context.Data);
                res.status(401).end(result);
            }
            else {
                var user = this.auth.DecodeToken(context.Jwt);
                switch (context.Name) {
                    case data_1.AdminContextName.AdvancedConfig:
                        var conf = [];
                        for (var key in this.config) {
                            if ((key != '$loki' && key != 'id' && key != 'meta' && key != 'createDate' && typeof this.config[key] != 'object')) {
                                conf.push({ key: key, value: this.config[key] });
                            }
                        }
                        context.Data.config = conf;
                        this.sendDefaultTemplate(context, res);
                        break;
                    case data_1.AdminContextName.MainAdmin:
                        var dataPlugin = this.dataAccess.GetActivePlugin(plugin_1.PluginType.PostsDataAccess);
                        var dataPluginParameters = this.dataAccess.GetPluginParameters(plugin_1.PluginType.PostsDataAccess);
                        context.Data.langs = [
                            { key: 'FR', label: this.translate('FRENCH') },
                            { key: 'EN', label: this.translate('ENGLISH') },
                            { key: 'DE', label: this.translate('GERMAN') },
                            { key: 'IT', label: this.translate('ITALIAN') },
                        ];
                        context.Data.themes = this.themeManager.GetThemes(this.config.currentThemePath);
                        context.Data.dataPlugins = this.pluginManager.GetPlugins(plugin_1.PluginType.PostsDataAccess, dataPlugin, dataPluginParameters),
                            context.Data.config = this.config;
                        context.Data.sidenav = data_1.SidenavContextName.Config;
                        this.sendDefaultTemplate(context, res);
                        break;
                    case data_1.AdminContextName.AuthorPosts:
                        this.generatePosts(req, context, user, (err) => {
                            if (err) {
                                this.manageError(err, res);
                            }
                            else {
                                context.Data.sidenav = data_1.SidenavContextName.AuthorPosts;
                                this.sendDefaultTemplate(context, res);
                            }
                        });
                        break;
                    case data_1.AdminContextName.EditPost:
                        var postId = context.Data.query.id ? context.Data.query.id : context.Data.params;
                        if (postId) {
                            this.postDataAccess.GetPost(postId, (err, post) => {
                                if (err) {
                                    this.manageError(err, res);
                                }
                                else {
                                    context.Data.post = JSON.parse(JSON.stringify(post));
                                    context.Data.post.content = encodeURI(context.Data.post.content);
                                    context.Data.post.tags = context.Data.post.tags && Array.isArray(context.Data.post.tags) ? context.Data.post.tags.join() : '';
                                    context.Data.sidenav = data_1.SidenavContextName.EditPost;
                                    this.sendDefaultTemplate(context, res);
                                }
                            });
                        }
                        else {
                            var post = {
                                title: '',
                                content: '',
                                authorId: null,
                                publicationdate: Date.now(),
                                tags: [],
                                published: false
                            };
                            context.Data.post = post;
                            context.Data.sidenav = data_1.SidenavContextName.EditPost;
                            this.sendDefaultTemplate(context, res);
                        }
                        break;
                }
            }
        };
        this.generateBlogPage = (req, res, next) => {
            var context = this.getContext(req);
            switch (context.Name) {
                case data_1.BlogContextName.Posts:
                    this.generatePosts(req, context, null, (err) => {
                        if (err) {
                            this.manageError(err, res);
                        }
                        else {
                            this.sendDefaultTemplate(context, res);
                        }
                    });
                    break;
                case data_1.BlogContextName.Post:
                    var postId = context.Data.query.id ? context.Data.query.id : context.Data.params;
                    if (postId) {
                        this.postDataAccess.GetPost(postId, (err, post) => {
                            if (err) {
                                this.manageError(err, res);
                            }
                            else {
                                if (post) {
                                    context.Data.sidenav = data_1.SidenavContextName.Post;
                                    context.Data.post = post;
                                    var renderedMd = this.blogTpl.RenderText(context.Data.post.content);
                                    context.Data.post.content = renderedMd.text;
                                    context.Data.summary = renderedMd.summary;
                                }
                                else {
                                    context.Data.post = null;
                                }
                                this.sendDefaultTemplate(context, res);
                            }
                        }, true);
                    }
                    else {
                        this.generatePosts(req, context, null, (err) => {
                            if (err) {
                                this.manageError(err, res);
                            }
                            else {
                                this.sendDefaultTemplate(context, res);
                            }
                        });
                    }
                    break;
                case data_1.BlogContextName.User:
                    var userId = context.Data.query.id ? context.Data.query.id : context.Data.params;
                    context.Data.user = this.dataAccess.GetUser(userId);
                    this.sendDefaultTemplate(context, res);
                    break;
                case data_1.BlogContextName.Login:
                    this.sendDefaultTemplate(context, res);
                    break;
            }
        };
        this.uploadFile = (req, res, next) => {
            this.upload(req, res, (err) => {
                if (err) {
                    winston.error(JSON.stringify(err));
                    return res.status(500).json({ error: errors_1.Errors.FileUploadError.Code, text: this.translate(errors_1.Errors.FileUploadError.Text) });
                }
                res.status(200).json({ path: '/file/' + req.file.filename });
            });
        };
        this.servUploadedFile = (req, res, next) => {
            var pathInfo = req.params[0] ? req.params[0] : this.config.defaultWebServerFile;
            res.sendFile(pathInfo, { root: this.config.uploadFolder }, (err) => {
                if (err) {
                    res.sendFile(pathInfo, { root: path.join(this.config.defaultThemePath, this.publicFolder) }, (err) => {
                        if (err) {
                            res.status(404).sendFile('404.htm', { root: path.join(this.config.defaultThemePath, this.publicFolder) });
                        }
                    });
                }
            });
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
        this.getChallenges = (req, res) => {
            res.setHeader('Access-Control-Allow-Origin', '*');
            var response = this.dataAccess.FindUsers({ login: req.body.login });
            var challenges = this.auth.GetChallenges();
            var salt = null;
            if (response.length > 0) {
                var user = response[0];
                salt = user.salt;
            }
            if (!salt) {
                salt = this.auth.GenerateSalt();
            }
            var result = {
                salt: salt,
                challenges: challenges
            };
            res.json(result).status(200);
        };
        this.login = (req, res) => {
            res.setHeader('Access-Control-Allow-Origin', '*');
            var token = null;
            var userLogin = req.body.login;
            userLogin = userLogin.toLowerCase();
            var response = this.dataAccess.FindUsers({ login: userLogin });
            if (response.length > 0) {
                token = this.auth.Authenticate(response[0], req.body.password, req.body.key, req.body.clientSalt);
            }
            if (token) {
                res.status(200).json({ token: token });
            }
            else {
                res.status(401).send('Not logged');
            }
        };
        this.savePost = (req, res) => {
            res.setHeader('Access-Control-Allow-Origin', '*');
            var jwtInfo = this.getJwtInfo(req);
            var user = this.auth.DecodeToken(jwtInfo.jwt);
            if (jwtInfo.connected) {
                this.innerSavePost(req, user, (post) => {
                    this.postDataAccess.SavePost(post, (err, post) => {
                        if (err) {
                            this.manageError(err, res);
                        }
                        else {
                            res.status(200).json({ id: post.id, published: post.published, message: this.translate('POST_SAVED') });
                        }
                    });
                });
            }
            else {
                res.status(401).json({ error: errors_1.Errors.NotLogged, text: this.translate(errors_1.Errors.NotLogged.Text) });
            }
        };
        this.innerTogglePostPublished = (req, res, done) => {
            var post = null;
            if (req.body.id) {
                post = this.postDataAccess.GetPost(req.body.id, (err, post) => {
                    if (err) {
                        this.manageError(err, res);
                    }
                    else {
                        done(post);
                    }
                });
            }
        };
        this.togglePostPublished = (req, res) => {
            res.setHeader('Access-Control-Allow-Origin', '*');
            var jwtInfo = this.getJwtInfo(req);
            var user = this.auth.DecodeToken(jwtInfo.jwt);
            if (jwtInfo.connected) {
                this.innerTogglePostPublished(req, res, (post) => {
                    if (post) {
                        post.published = !post.published;
                        this.postDataAccess.SavePost(post, (err, post) => {
                            if (err) {
                                this.manageError(err, res);
                            }
                            else {
                                var message = post.published ? 'POST_PUBLISHED' : 'POST_UNPUBLISHED';
                                res.status(200).json({ id: post.id, published: post.published, message: this.translate(message) });
                            }
                        });
                    }
                    else {
                        res.status(401).json({ error: errors_1.Errors.PostNotFound, text: this.translate(errors_1.Errors.PostNotFound.Text) });
                    }
                });
            }
            else {
                res.status(401).json({ error: errors_1.Errors.NotLogged, text: this.translate(errors_1.Errors.NotLogged.Text) });
            }
        };
        this.deletePost = (req, res) => {
            res.setHeader('Access-Control-Allow-Origin', '*');
            var jwtInfo = this.getJwtInfo(req);
            var user = this.auth.DecodeToken(jwtInfo.jwt);
            if (jwtInfo.connected) {
                var post = null;
                if (req.body.id) {
                    this.postDataAccess.GetPost(req.body.id, (err, post) => {
                        if (err) {
                            this.manageError(err, res);
                        }
                        else if (post) {
                            this.postDataAccess.DeletePost(post, (err) => {
                                if (err) {
                                    this.manageError(err, res);
                                }
                                else {
                                    var context = {
                                        Name: data_1.AdminContextName.AuthorPosts,
                                        Jwt: jwtInfo.jwt,
                                        Data: {
                                            context: data_1.AdminContextName.AuthorPosts,
                                            connected: true,
                                            isadmin: jwtInfo.isadmin,
                                            offset: req.body.offset
                                        }
                                    };
                                    this.generatePosts(req, context, user, (err) => {
                                        if (err) {
                                            this.manageError(err, res);
                                        }
                                        else {
                                            var result = this.blogTpl.Render('{{#_author}}{{context}}{{/_author}}', context.Data);
                                            res.status(200).send(result);
                                        }
                                    });
                                }
                            });
                        }
                        else {
                            res.status(500).json({ error: errors_1.Errors.PostNotFound, text: this.translate(errors_1.Errors.PostNotFound.Text) });
                        }
                    });
                }
                else {
                    res.status(401).json({ error: errors_1.Errors.NotLogged, text: this.translate(errors_1.Errors.PostNotFound.Text) });
                }
            }
            else {
                res.status(401).json({ error: errors_1.Errors.NotLogged, text: this.translate(errors_1.Errors.NotLogged.Text) });
            }
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
        this.saveConfig = (req, res) => {
            res.setHeader('Access-Control-Allow-Origin', '*');
            var jwtInfo = this.getJwtInfo(req);
            var user = this.auth.DecodeToken(jwtInfo.jwt);
            if (jwtInfo.isadmin) {
                this.config.title = req.body.title;
                this.config.subTitle = req.body.motto;
                this.config.defaultLanguage = req.body.lang;
                this.config.currentThemePath = req.body.theme;
                this.dataAccess.SaveConfig(this.config);
                this.saveDataPlugin(req);
                res.status(200).json({ ok: true, message: this.translate('CONFIG_SAVED') });
                this.dataAccess.ForceSave(() => { process.exit(1); });
            }
            else {
                res.status(301).json({ ok: true, message: this.translate(errors_1.Errors.ConfigError.Text) });
            }
        };
        this.saveAdvancedConfig = (req, res) => {
            res.setHeader('Access-Control-Allow-Origin', '*');
            var jwtInfo = this.getJwtInfo(req);
            var user = this.auth.DecodeToken(jwtInfo.jwt);
            if (jwtInfo.isadmin) {
                if (req.body.config) {
                    var newConfig = req.body.config;
                    for (var key in newConfig) {
                        var currentConfig = newConfig[key];
                        this.config[currentConfig.name] = currentConfig.value;
                    }
                    this.dataAccess.SaveConfig(this.config);
                    res.status(200).json({ ok: true, message: this.translate('CONFIG_SAVED') });
                    this.dataAccess.ForceSave(() => { process.exit(1); });
                }
            }
            else {
                res.status(301).json({ ok: true, message: this.translate(errors_1.Errors.ConfigError.Text) });
            }
        };
        this.learningMode = false;
        this.dataAccess = new lokidata_1.LokiDataAccess();
        this.dataAccess.Init({ 'dbfile': 'db.json' }, (err) => {
            this.router = express.Router();
            if (this.dataAccess.CountUsers() <= 0) {
                this.plugins = null;
                winston.info('Installer mode activated');
                this.config = config_1.InitConfig();
                this.pluginManager = new pluginmanager_1.PluginManager(this.config.pluginsFolderPath);
                this.pluginManager.Init();
                this.parseParameters();
                this.router.get('/', this.showInstaller);
                this.router.get('/*', this.serveFile);
                this.router.post('/saveadmininfo', this.saveAdminInfo);
                //this.initDefaultPlugins();
                this.finishInitialization(done);
            }
            else {
                winston.info('Standard mode activated');
                this.config = this.dataAccess.LoadConfig();
                this.parseParameters();
                this.pluginManager = new pluginmanager_1.PluginManager(this.config.pluginsFolderPath);
                this.pluginManager.Init();
                this.themeManager = new thememanager_1.ThemeManager(this.config.themeFolderPath);
                this.themeManager.Init();
                var postDataPluginIdx = this.dataAccess.GetActivePlugin(plugin_1.PluginType.PostsDataAccess);
                if (postDataPluginIdx && postDataPluginIdx != '') {
                    var currentPostPlugin = this.pluginManager.GetPlugin(postDataPluginIdx);
                    this.postDataAccess = (new currentPostPlugin.Class['Plugin']());
                    var parameters = this.dataAccess.GetPluginParameters(plugin_1.PluginType.PostsDataAccess);
                    parameters['getuser'] = this.dataAccess.GetUser;
                    this.postDataAccess.Init(parameters, (err) => {
                        if (!err) {
                            this.finishStandardMode();
                            this.finishInitialization(done);
                        }
                        else {
                            winston.error(errors_1.Errors.UnableToStartPostDataAccess.Text);
                        }
                    });
                }
            }
        });
    }
    initDefaultPlugins() {
        this.dataAccess.SaveActivePlugin(plugin_1.PluginType.PostsDataAccess, '__');
    }
    finishStandardMode() {
        this.router.get('/', this.callPosts);
        this.router.get('/file/*', this.servUploadedFile);
        this.router.get('/:action', this.call);
        this.router.get('/:action/*', this.call);
        this.router.get('/*', this.serveFile);
        this.router.post('/getchallenges', this.getChallenges);
        this.router.post('/login', this.login);
        this.router.post('/savepost', this.savePost);
        this.router.post('/deletepost', this.deletePost);
        this.router.post('/togglePostPublished', this.togglePostPublished);
        this.router.post('/uploadfile', this.uploadFile);
        this.router.post('/saveadvancedconfig', this.saveAdvancedConfig);
        this.router.post('/saveconfig', this.saveConfig);
        this.actions = {};
        for (var key in data_1.BlogContextName) {
            this.actions[data_1.BlogContextName[key]] = this.generateBlogPage;
        }
        for (var key in data_1.AdminContextName) {
            this.actions[data_1.AdminContextName[key]] = this.generateAdminPage;
        }
        var storage = multer.diskStorage({
            destination: (req, file, callback) => {
                callback(null, this.config.uploadFolder);
            },
            filename: (req, file, callback) => {
                callback(null, Date.now() + '-' + file.originalname);
            }
        });
        this.upload = multer({ storage: storage }).single(this.config.uploadEntry);
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
            this.postParser = new parser_1.PostParser(this.blogTpl);
            httpServ.listen(this.config.port, () => {
                winston.info('Server started on port : ' + this.config.port);
                done();
            });
        });
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
    getContext(req) {
        var jwtInfo = this.getJwtInfo(req);
        var result = {
            Name: req.params.action,
            Jwt: jwtInfo.jwt,
            Data: {
                context: req.params.action.toLowerCase(),
                params: req.params[0],
                query: req.query,
                blogTitle: this.config.title,
                blogSubTitle: this.config.subTitle,
                menuButtons: this.validateMenuButtons(this.config.menuButtons, jwtInfo),
                connected: jwtInfo.connected,
                isadmin: jwtInfo.isadmin
            }
        };
        return result;
    }
    validateMenuButtons(buttons, jwtInfo) {
        var currentButtons = [];
        for (var idx in buttons) {
            var button = buttons[idx];
            var newButton = { buttonType: button.buttonType, visible: true, name: button.name, onclick: button.onclick, url: button.url, priority: button.priority };
            switch (button.buttonType) {
                case config_1.ButtonType.Admin:
                    newButton.visible = jwtInfo.isadmin;
                    break;
                case config_1.ButtonType.Author:
                    newButton.visible = jwtInfo.connected;
                    break;
                case config_1.ButtonType.NotLogged:
                    newButton.visible = !jwtInfo.connected;
                    break;
            }
            currentButtons.push(newButton);
        }
        currentButtons.sort((a, b) => {
            return a.priority - b.priority;
        });
        return currentButtons;
    }
    // TODO DEFINE MESSAGE TYPES
    addMessage(context, type, text) {
        context.Data.alerttype = type;
        context.Data.alertmessage = text;
    }
    sendDefaultTemplate(context, res) {
        var result = this.blogTpl.Render('{{#_template}}default{{/_template}}', context.Data);
        res.status(200).end(result);
    }
    generatePosts(req, context, user, done) {
        var nbr = parseInt(req.params[0]);
        var offset = nbr ? nbr : 0;
        var criterias = {};
        if (context.Name != data_1.AdminContextName.AuthorPosts) {
            criterias = {
                published: true,
                publicationdate: {
                    date: Date.now(),
                    criteria: data_1.DateCriteria.Before
                }
            };
        }
        else if (user) {
            criterias = { authorId: user.$loki };
        }
        this.postDataAccess.GetPosts(this.config.postPerPage, offset * this.config.postPerPage, (err, posts) => {
            if (err) {
                done(err);
            }
            else {
                context.Data.posts = posts;
                context.Data.sidenav = data_1.SidenavContextName.Posts;
                context.Data.offset = offset;
                context.Data.back = offset != 0;
                context.Data.previous = offset - 1;
                this.postDataAccess.CountPosts((err, count) => {
                    if (err) {
                        done(err);
                    }
                    else {
                        var max = count;
                        context.Data.more = max > this.config.postPerPage * (offset + 1);
                        if (context.Data.more) {
                            context.Data.next = offset + 1;
                        }
                        done(null);
                    }
                });
            }
        }, criterias);
    }
    innerSavePost(req, user, done) {
        if (req.body.id) {
            this.postDataAccess.GetPost(req.body.id, (err, post) => {
                post.content = req.body.content;
                post.title = req.body.title;
                post.tags = req.body.tags ? req.body.tags.split(/[\s,;]+/) : [];
                post.publicationdate = new Date(req.body.publicationDate).getTime();
                done(post);
            });
        }
        else {
            var post = null;
            post = {
                authorId: user.$loki,
                content: req.body.content,
                title: req.body.title,
                tags: req.body.tags ? req.body.tags.split(/[\s,;]+/) : [],
                publicationdate: new Date(req.body.publicationDate).getTime(),
                published: false
            };
            done(post);
        }
    }
    translate(src) {
        var result = this.i8n.Translate(src, null);
        return result;
    }
    getRouter() {
        return this.router;
    }
}
exports.BlogEngine = BlogEngine;
