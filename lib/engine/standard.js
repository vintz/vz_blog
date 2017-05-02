"use strict";
const multer = require('multer');
const path = require('path');
const engine_1 = require('./engine');
const pluginmanager_1 = require('../managers/pluginmanager');
const thememanager_1 = require('../managers/thememanager');
const config_1 = require('../../interface/config');
const plugin_1 = require('../../interface/plugin');
const data_1 = require('../../interface/data');
const errors_1 = require('../../interface/errors');
const DEFAULT = 'default';
const COMMENTS = 'comments';
class StandardBlogEngine extends engine_1.BlogEngine {
    constructor(dataAccess, done) {
        super(dataAccess, done);
        this.initAllPlugins = (pluginsToLoad, done) => {
            if (pluginsToLoad.length > 0) {
                console.log(pluginsToLoad);
                var currentPluginType = pluginsToLoad.shift();
                var pluginIdx = this.dataAccess.GetActivePlugin(currentPluginType);
                var error;
                if (pluginIdx && pluginIdx != '') {
                    var currentPlugin = this.pluginManager.GetPlugin(pluginIdx);
                    var currentPluginInstance = new currentPlugin.Class['Plugin']();
                    var parameters = this.dataAccess.GetPluginParameters(currentPluginType);
                    switch (currentPluginType) {
                        case plugin_1.PluginType.PostsDataAccess:
                            parameters['getuser'] = this.dataAccess.GetUser;
                            this.postDataAccess = currentPluginInstance;
                            error = errors_1.Errors.UnableToStartPostDataAccess;
                            break;
                        case plugin_1.PluginType.CommentsDataAccess:
                            parameters['getuser'] = this.dataAccess.GetUser;
                            parameters['savepost'] = this.postDataAccess.SavePost;
                            parameters['getpost'] = this.postDataAccess.GetPost;
                            this.commentDataAccess = currentPluginInstance;
                            error = errors_1.Errors.UnableToStartCommentDataAccess;
                            break;
                        case plugin_1.PluginType.PostParser:
                            this.postParser = currentPluginInstance;
                            error = errors_1.Errors.UnableToStartPostParser;
                            break;
                    }
                    currentPluginInstance.Init(parameters, (err) => {
                        if (!err) {
                            this.initAllPlugins(pluginsToLoad, done);
                        }
                        else {
                            this.logError(error.Text);
                        }
                    });
                }
                else {
                    this.initAllPlugins(pluginsToLoad, done);
                }
            }
            else {
                done();
            }
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
        /******** UPLOADED FILES MANAGEMENT ********/
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
        this.uploadFile = (req, res, next) => {
            this.upload(req, res, (err) => {
                if (err) {
                    this.logError(JSON.stringify(err));
                    return res.status(500).json({ error: errors_1.Errors.FileUploadError.Code, text: this.translate(errors_1.Errors.FileUploadError.Text) });
                }
                res.status(200).json({ path: '/file/' + req.file.filename });
            });
        };
        /******* LOGIN *********/
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
        /********* POST MANAGEMENT ********/
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
                                    this.generatePosts(req, res, context, user, () => {
                                        var result = this.blogTpl.Render('{{#_author}}{{context}}{{/_author}}', context.Data);
                                        res.status(200).send(result);
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
        /********* COMMENTS MANAGEMENT ************/
        this.saveComment = (req, res) => {
            res.setHeader('Access-Control-Allow-Origin', '*');
            var jwtInfo = this.getJwtInfo(req);
            var user = this.auth.DecodeToken(jwtInfo.jwt);
            var comment = {
                id: null,
                content: req.body.comment,
                date: Date.now(),
                authorId: jwtInfo.connected ? user.$loki : null,
                validated: this.config.commentsAutoValidated
            };
            var postId = req.body.postId;
            if (jwtInfo.connected || !this.config.onlyConnectedComment) {
                this.commentDataAccess.SaveComment(comment, postId, (err, comment) => {
                    if (err) {
                        this.manageError(err, res);
                    }
                    else {
                        res.status(200).json({ id: comment.id, message: this.translate('COMMENT_SAVED') });
                    }
                });
            }
            else {
                res.status(401).json({ error: errors_1.Errors.NotLogged, text: this.translate(errors_1.Errors.NotLogged.Text) });
            }
        };
        /********* CONFIG ********/
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
        /******* BLOG DISPLAY (STANDARD) ********/
        this.generateBlogPage = (req, res, next) => {
            var context = this.getContext(req);
            switch (context.Name) {
                case data_1.BlogContextName.Posts:
                    this.generatePosts(req, res, context, null, () => {
                        this.sendTemplate(context, res, DEFAULT);
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
                                    this.innerGetComments(res, postId, context, 0, true);
                                }
                                else {
                                    context.Data.post = null;
                                    this.sendTemplate(context, res, DEFAULT);
                                }
                            }
                        }, true);
                    }
                    else {
                        this.generatePosts(req, res, context, null, () => {
                            this.sendTemplate(context, res, DEFAULT);
                        });
                    }
                    break;
                case data_1.BlogContextName.User:
                    var userId = context.Data.query.id ? context.Data.query.id : context.Data.params;
                    context.Data.user = this.dataAccess.GetUser(userId);
                    this.sendTemplate(context, res, DEFAULT);
                    break;
                case data_1.BlogContextName.Login:
                    this.sendTemplate(context, res, DEFAULT);
                    break;
                case data_1.BlogContextName.Comments:
                    var offset = parseInt(context.Data.query.offset);
                    var currentPostId = parseInt(req.params[0]);
                    context.Data.post = {};
                    this.innerGetComments(res, currentPostId, context, offset, false);
                    break;
            }
        };
        /******* BLOG DISPLAY (ADMIN) ********/
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
                        this.sendTemplate(context, res, DEFAULT);
                        break;
                    case data_1.AdminContextName.MainAdmin:
                        var dataPlugin = this.dataAccess.GetActivePlugin(plugin_1.PluginType.PostsDataAccess);
                        var dataPluginParameters = this.dataAccess.GetPluginParameters(plugin_1.PluginType.PostsDataAccess);
                        var commentsPlugin = this.dataAccess.GetActivePlugin(plugin_1.PluginType.CommentsDataAccess);
                        var commentsPluginParameters = this.dataAccess.GetPluginParameters(plugin_1.PluginType.CommentsDataAccess);
                        var parserPlugin = this.dataAccess.GetActivePlugin(plugin_1.PluginType.PostParser);
                        var parsersPluginParameters = this.dataAccess.GetPluginParameters(plugin_1.PluginType.PostParser);
                        context.Data.langs = [
                            { key: 'FR', label: this.translate('FRENCH') },
                            { key: 'EN', label: this.translate('ENGLISH') },
                            { key: 'DE', label: this.translate('GERMAN') },
                            { key: 'IT', label: this.translate('ITALIAN') },
                        ];
                        context.Data.themes = this.themeManager.GetThemes(this.config.currentThemePath);
                        context.Data.dataPlugins = this.pluginManager.GetPlugins(plugin_1.PluginType.PostsDataAccess, dataPlugin, dataPluginParameters);
                        context.Data.commentsPlugins = this.pluginManager.GetPlugins(plugin_1.PluginType.CommentsDataAccess, commentsPlugin, commentsPluginParameters);
                        context.Data.parserPlugins = this.pluginManager.GetPlugins(plugin_1.PluginType.PostParser, parserPlugin, parsersPluginParameters);
                        context.Data.config = this.config;
                        context.Data.sidenav = data_1.SidenavContextName.Config;
                        this.sendTemplate(context, res, DEFAULT);
                        break;
                    case data_1.AdminContextName.AuthorPosts:
                        this.generatePosts(req, res, context, user, () => {
                            context.Data.sidenav = data_1.SidenavContextName.AuthorPosts;
                            this.sendTemplate(context, res, DEFAULT);
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
                                    this.sendTemplate(context, res, DEFAULT);
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
                            this.sendTemplate(context, res, DEFAULT);
                        }
                        break;
                }
            }
        };
    }
    init(done) {
        this.logInfo('Standard mode activated');
        this.config = this.dataAccess.LoadConfig();
        this.parseParameters();
        this.pluginManager = new pluginmanager_1.PluginManager(this.config.pluginsFolderPath);
        this.pluginManager.Init();
        this.themeManager = new thememanager_1.ThemeManager(this.config.themeFolderPath);
        this.themeManager.Init();
        var postDataPluginIdx = this.dataAccess.GetActivePlugin(plugin_1.PluginType.PostsDataAccess);
        var pluginToLoad = [];
        for (var key in plugin_1.PluginType) {
            if (typeof plugin_1.PluginType[key] == 'number') {
                pluginToLoad.push(plugin_1.PluginType[key]);
            }
        }
        this.initAllPlugins(pluginToLoad, () => {
            this.finishStandardMode(done);
        });
    }
    initializationFinished(done) {
        if (this.postParser) {
            this.postParser.SetTemplateEngine(this.blogTpl);
        }
        done();
    }
    finishStandardMode(done) {
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
        this.router.post('/savecomment', this.saveComment);
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
        done();
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
    innerGetComments(res, postId, context, offset, fullPageLoad) {
        var limit = 5;
        var finalOffset = offset * limit;
        this.commentDataAccess.GetComments(limit, finalOffset, postId, (err, comments) => {
            if (err) {
                this.manageError(err, res);
            }
            else {
                context.Data.post.previouscomments = (offset != 0);
                context.Data.post.comments = comments;
                this.commentDataAccess.CountComments((err, count) => {
                    context.Data.post.nextcomments = (finalOffset + limit < count);
                    if (fullPageLoad) {
                        this.sendTemplate(context, res, DEFAULT);
                    }
                    else {
                        this.sendTemplate(context, res, COMMENTS);
                    }
                }, postId);
            }
        });
    }
    generatePosts(req, res, context, user, done) {
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
                this.manageError(err, res);
            }
            else {
                context.Data.posts = posts;
                context.Data.sidenav = data_1.SidenavContextName.Posts;
                context.Data.offset = offset;
                context.Data.back = offset != 0;
                context.Data.previous = offset - 1;
                this.postDataAccess.CountPosts((err, count) => {
                    if (err) {
                        this.manageError(err, res);
                    }
                    else {
                        var max = count;
                        context.Data.more = max > this.config.postPerPage * (offset + 1);
                        if (context.Data.more) {
                            context.Data.next = offset + 1;
                        }
                        done();
                    }
                });
            }
        }, criterias);
    }
    sendTemplate(context, res, template) {
        var result = this.blogTpl.Render('{{#_template}}' + template + '{{/_template}}', context.Data);
        res.status(200).end(result);
    }
    /******* CONTEXT *********/
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
}
exports.StandardBlogEngine = StandardBlogEngine;
