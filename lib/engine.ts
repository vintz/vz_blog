import * as express from 'express';
import { Request, Response } from 'express';
import * as http from 'http';
import * as path from 'path';
import * as multer from 'multer';
import {I8N} from './i8n/i8n';
var bodyParser = require('body-parser');
var cookieParser = require('cookie-parser');
import {Errors} from './../interface/errors';
import {IPlugin, Pluggable, PluginType, IPluggable, IDefaultPlugin} from '../interface/plugin';
import {LokiDataAccess} from './data/lokidata';


import {BlogTplEngine} from './template/blogtpl';
import {IContext, BlogContextName, AdminContextName, SidenavContextName, IPost, IUser, DateCriteria} from '../interface/data';
import {IConfig, InitConfig, IMenuButton, ButtonType} from '../interface/config';
import {DataAccess, PostDataAccess} from './data/data';
import {PostParser} from './parsing/parser';
import {Auth} from './authentication/auth';
import {PluginManager} from './managers/pluginmanager';
import {ThemeManager} from './managers/thememanager';
import * as winston from 'winston';

interface IJwtInfo 
{
    jwt: string;
    connected: boolean; 
    isadmin: boolean
}
export class BlogEngine 
{
    protected blogTpl: BlogTplEngine;
    protected dataAccess: DataAccess;
    protected plugins: {[id:number]: IPlugin};
    protected postDataAccess: PostDataAccess;
    protected postParser: PostParser;
    protected router: express.Router;
    protected config: IConfig;
    protected actions: {[id: string]: (req: express.Request, res: express.Response, next)=>void};
    protected auth: Auth;
    protected publicFolder = 'public';
    protected upload;
    protected pluginManager: PluginManager;
    protected themeManager: ThemeManager;
    protected i8n: I8N;
    protected learningMode: boolean;

    constructor(done: ()=>void)
    {
        this.learningMode = false;
        this.dataAccess = new LokiDataAccess();
        this.dataAccess.Init({'dbfile': 'db.json'}, (err)=>
        {
            this.router = express.Router();

            if (this.dataAccess.CountUsers() <= 0)
            {
                this.plugins = null;
                winston.info('Installer mode activated');
                this.config = InitConfig();
                
                this.pluginManager = new PluginManager(this.config.pluginsFolderPath);
                this.pluginManager.Init();

                this.parseParameters();
                this.router.get('/', this.showInstaller);
                this.router.get('/*', this.serveFile);
                this.router.post('/saveadmininfo', this.saveAdminInfo);
                //this.initDefaultPlugins();
                
                this.finishInitialization(done);
            }
            else 
            {
                winston.info('Standard mode activated');
                this.config = this.dataAccess.LoadConfig();
                this.parseParameters();
                
                this.pluginManager = new PluginManager(this.config.pluginsFolderPath);
                this.pluginManager.Init();

                this.themeManager = new ThemeManager(this.config.themeFolderPath);
                this.themeManager.Init();

                var postDataPluginIdx = this.dataAccess.GetActivePlugin(PluginType.DataAccess);
                
                if (postDataPluginIdx && postDataPluginIdx != '')
                {
                    var currentPostPlugin = this.pluginManager.GetPlugin(postDataPluginIdx);
                    
                    this.postDataAccess = <PostDataAccess>(new currentPostPlugin.Class['Plugin']());
                    var parameters = this.dataAccess.GetPluginParameters(PluginType.DataAccess);
                    parameters['getuser'] = this.dataAccess.GetUser;
                    
                    this.postDataAccess.Init(parameters, (err)=>
                    {
                        if (!err)
                        {
                            this.finishStandardMode();
                            this.finishInitialization(done);
                        }
                        else 
                        {
                            winston.error(Errors.UnableToStartPostDataAccess.Text);
                        }
                    });
                }
            }
        });
    }

    protected initDefaultPlugins()
    {
       this.dataAccess.SaveActivePlugin(PluginType.DataAccess, '__');
    }
    
    protected finishStandardMode()
    {
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
        for (var key in BlogContextName)
        {
            this.actions[BlogContextName[key]] = this.generateBlogPage;    
        }
    
        for (var key in AdminContextName)
        {
            this.actions[AdminContextName[key]] = this.generateAdminPage;    
        }
    
        var storage =   multer.diskStorage({
            destination: (req, file, callback) => {
                callback(null, this.config.uploadFolder);
            },
            filename:  (req, file, callback) => {
                callback(null, Date.now() + '-' + file.originalname  );
            }
        });
        this.upload = multer({ storage : storage}).single(this.config.uploadEntry);
    }

    protected finishInitialization( done: ()=>void)
    {
        winston.info('Starting webserver');
        var server = express();
        server.use(bodyParser.json());
        server.use(bodyParser.urlencoded({ extended: true }));
        server.use(cookieParser());
        server.use(function(req, res, next){
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
        this.i8n = new I8N(this.config.i8nPath, this.config.defaultLanguage, this.learningMode);
        this.auth = new Auth(this.config.challengeTimeToLive, this.config.challengeNbr, this.config.secretKey);
        this.blogTpl = new BlogTplEngine(this.config.currentThemePath, this.config.defaultThemePath, this.config.tplFoldername, this.config.blogFoldernname, this.config.adminFoldername, this.config.authorFoldername, this.config.markdownFoldername, this.config.excerptLength, this.config.shortExcerptLength, this.config.templateExtension, this.i8n, ()=>
        {
            this.postParser = new PostParser(this.blogTpl);
            httpServ.listen(this.config.port,()=>
            {
                winston.info('Server started on port : ' + this.config.port);
                done();
            });
        });
    }

    protected parseParameters = () => 
    {
        process.argv.forEach((val, index, array) => {
            if (val.indexOf('=') > 0)
            {
                var splitted = val.split('=');
                this.innerParseParameter(splitted[0], splitted[1]);
            }
            else if(val.toLowerCase() == '--help') 
            {
                console.log('node index.js [port=portnumber] [lang=lang] [learningmode=true]');
                process.exit();
            }
        });
    }

    protected innerParseParameter = (param: string, value) =>
    {
        switch(param.toLowerCase())
        {
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
    }


    protected showInstaller = (req: express.Request, res: express.Response, next) => 
    {
        var context: IContext = {
            Name: 'installer',
            Data:
            {
                context: 'installer',
                connected : true, 
                isadmin: true,
                langs:  [// TODO REFACTOR LANGUAGE MENU
                    {key: 'FR', label:this.translate('FRENCH')},
                    {key: 'EN', label:this.translate('ENGLISH')},
                    {key: 'DE', label:this.translate('GERMAN')},
                    {key: 'IT', label:this.translate('ITALIAN')},
                ],
                dataPlugins: this.pluginManager.GetPlugins(PluginType.DataAccess),
            },
            Jwt: this.auth.GenerateInstallerToken()
            
            
        }
        var result = this.blogTpl.Render('{{#_admin}}default{{/_admin}}', context.Data);
        res.status(200).end(result);
    }

    protected callPosts = (req: express.Request, res: express.Response, next) => 
    {
        req.params.action = BlogContextName.Posts;
        this.call(req, res, next);
    }
    
    protected call = (req: express.Request, res: express.Response, next) => 
    {
        var action = req.params.action.toLowerCase();
        
        if (action in this.actions)
        {
            this.actions[action](req, res, next);
        }
        else 
        {
            next();
        }
    }

    protected isConnected(token: string, done?:(err, obj)=>void)
    {
       return this.auth.VerifyToken(token, done);
    }
    
    protected isAdmin(token: string, done?:(err, obj)=>void)
    {
       var user: IUser = this.auth.DecodeToken(token);
       return user?user.isadmin:false; 
    }

    protected getJwtInfo(req: Request)
    {
        var jwt = null;

        if (req.headers && req.headers.authorization)
        {
            jwt = req.headers.authorization;
        }
        else if (req.cookies && req.cookies.authorization) 
        {
            jwt = req.cookies.authorization;
        }
        var connected = this.isConnected(jwt);
        var isadmin = (connected &&  this.isAdmin(jwt));
        return {jwt: jwt, connected: connected, isadmin: isadmin};
    }
    
    protected getContext(req: Request): IContext
    {
        var jwtInfo = this.getJwtInfo(req);

        var result :IContext = 
        {
            Name:req.params.action, 
            Jwt: jwtInfo.jwt,
            Data: 
            {
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

    protected validateMenuButtons(buttons: IMenuButton[], jwtInfo: IJwtInfo): IMenuButton[]
    {
        var currentButtons = [];
        for (var idx in buttons)
        {
            var button = buttons[idx];
            var newButton: IMenuButton = {buttonType: button.buttonType, visible: true, name: button.name, onclick: button.onclick, url: button.url, priority: button.priority};

            switch(button.buttonType)
            {
                 case ButtonType.Admin:
                    newButton.visible = jwtInfo.isadmin;
                    break;
                 case ButtonType.Author:
                    newButton.visible = jwtInfo.connected;
                    break;
                 case ButtonType.NotLogged:
                    newButton.visible = !jwtInfo.connected;
                    break;
            }
            currentButtons.push(newButton);
        }

        currentButtons.sort((a:IMenuButton, b:IMenuButton):number=>
        {
            return a.priority - b.priority;
        })

        return currentButtons;
    }

    // TODO DEFINE MESSAGE TYPES
    protected addMessage(context: IContext, type: string, text: string )
    {
        context.Data.alerttype = type;
        context.Data.alertmessage = text;
    }

    protected generateAdminPage = (req: Request, res: Response, next) =>
    {
        var context: IContext = this.getContext(req);
        if (!context.Data.connected)
        {
            context.Data.context = 'login';
            var result = this.blogTpl.Render('{{#_template}}default{{/_template}}', context.Data);
            res.status(401).end(result);
        }
        else 
        {
            var user = this.auth.DecodeToken(context.Jwt);
            switch (context.Name)
            {   
                case AdminContextName.AdvancedConfig:
                    var conf = [];
                    for (var key in this.config)
                    {
                        if ((key != '$loki' && key != 'id' && key !=  'meta' && key != 'createDate' && typeof this.config[key] != 'object'))
                        {
                            conf.push({key: key, value: this.config[key]});
                        }
                    }
                    context.Data.config = conf;
                    this.sendDefaultTemplate(context, res);
                    break;

                case AdminContextName.MainAdmin:

                    var dataPlugin =  this.dataAccess.GetActivePlugin(PluginType.DataAccess);
                    var dataPluginParameters = this.dataAccess.GetPluginParameters(PluginType.DataAccess);
                    context.Data.langs = [
                        {key: 'FR', label: this.translate('FRENCH')},
                        {key: 'EN', label: this.translate('ENGLISH')},
                        {key: 'DE', label:this.translate('GERMAN')},
                        {key: 'IT', label:this.translate('ITALIAN')},
                    ];
                    context.Data.themes = this.themeManager.GetThemes(this.config.currentThemePath);
                    context.Data.dataPlugins = this.pluginManager.GetPlugins(PluginType.DataAccess, dataPlugin, dataPluginParameters),
                    context.Data.config = this.config;
                    context.Data.sidenav = SidenavContextName.Config;
                    this.sendDefaultTemplate(context, res);
                    break;
                    
                case AdminContextName.AuthorPosts: 
                    this.generatePosts(req, context, user, ()=>
                    {
                        context.Data.sidenav = SidenavContextName.AuthorPosts;
                        this.sendDefaultTemplate(context, res);
                    });
                    
                    break;

                case AdminContextName.EditPost:
                    var postId = context.Data.query.id?context.Data.query.id: context.Data.params;
                    if (postId)
                    {
                        this.postDataAccess.GetPost(postId, (err, post: IPost)=>
                        {
                            if (err)
                            {
                                // TODO MANAGE ERROR
                            }
                            else 
                            {
                                context.Data.post = JSON.parse(JSON.stringify(post)); 
                                context.Data.post.content = encodeURI(context.Data.post.content);
                                context.Data.post.tags = context.Data.post.tags && Array.isArray(context.Data.post.tags)? context.Data.post.tags.join(): '';
                                context.Data.sidenav = SidenavContextName.EditPost;
                                this.sendDefaultTemplate(context, res);
                            }
                        });
                        
                    }
                    else 
                    {
                        var post: IPost = {
                            title: '',
                            content: '',
                            authorId: null,
                            publicationdate: Date.now(),
                            tags: [],
                            published: false
                            
                        };
                        context.Data.post = post;
                        context.Data.sidenav = SidenavContextName.EditPost;
                    }
                    break;
            }
            
        }
    }

    protected sendDefaultTemplate(context:IContext, res: Response)
    {
        var result = this.blogTpl.Render('{{#_template}}default{{/_template}}', context.Data);
        res.status(200).end(result);
    }

    protected generateBlogPage = (req: Request, res: Response, next) =>
    {
        var context:IContext = this.getContext(req);

        switch (context.Name)
        {
            case BlogContextName.Posts:
                this.generatePosts(req, context, null, ()=>
                {
                    this.sendDefaultTemplate(context, res);
                });

                break;

            case BlogContextName.Post:
                var postId = context.Data.query.id?context.Data.query.id: context.Data.params;
                if (postId)
                {
                    context.Data.post = this.postDataAccess.GetPost(postId, (err, post: IPost) =>
                    {
                        if  (err)
                        {
                            // TODO MANAGE ERROR
                        }
                        else 
                        {
                            context.Data.sidenav = SidenavContextName.Post;
                            if (context.Data.post)
                            {
                                var renderedMd = this.blogTpl.RenderText(context.Data.post.content);
                                context.Data.post.content = renderedMd.text;
                                context.Data.summary = renderedMd.summary;
                            }
                            else 
                            {
                                context.Data.post = {content: this.translate(Errors.PostNotFound.Text)};
                            }
                            this.sendDefaultTemplate(context, res);
                        }
                    }
                    ,true);
                    
                }
                else 
                {
                    this.generatePosts(req, context, null, ()=>
                    {
                         this.sendDefaultTemplate(context, res);
                    });
                    
                }
                break;

            case BlogContextName.User:
                var userId = context.Data.query.id?context.Data.query.id: context.Data.params;
                context.Data.user = this.dataAccess.GetUser(userId);
                 this.sendDefaultTemplate(context, res);
                break;

            case BlogContextName.Login:
                this.sendDefaultTemplate(context, res);    
                break;
        }
    }

    protected generatePosts(req: Request, context: IContext, user: IUser, done: ()=>void)
    {
        var nbr = parseInt(req.params[0]);
        var offset: number = nbr?nbr:0;
        var criterias = {}
        if (context.Name != AdminContextName.AuthorPosts)
        {
            criterias = {
                published: true,
                publicationdate: 
                {
                    date: Date.now(),
                    criteria: DateCriteria.Before
                }
            };
        } 
        else if (user)
        {
           criterias = {authorId: user.$loki}; 
        }  
        this.postDataAccess.GetPosts(this.config.postPerPage, offset * this.config.postPerPage,(err, posts:IPost[])=>
        {
            if(err)
            {
                // TODO MANAGE ERROR
            }
            else 
            {
                context.Data.posts = posts;
                context.Data.sidenav = SidenavContextName.Posts;
                context.Data.offset = offset;
                context.Data.back = offset != 0;
                context.Data.previous = offset - 1;
                this.postDataAccess.CountPosts((err, count: number)=>
                {
                    if (err)
                    {
                        // TODO MANAGE ERROR 
                    }
                    else 
                    {
                        var max = count;
                        context.Data.more = max > this.config.postPerPage * (offset + 1);
                        if (context.Data.more)
                        {
                            context.Data.next = offset + 1;
                        }
                    }
                });
                
            }
        }, criterias);
        
    }

    protected uploadFile = (req, res: express.Response, next) =>
    {
        this.upload(req, res, (err) => {
            if(err) {
                winston.error(JSON.stringify(err));
                return res.status(500).json({error: Errors.FileUploadError.Code, text: this.translate(Errors.FileUploadError.Text)});
            }
            res.status(200).json({path: '/file/' + req.file.filename});
        });
    }
    
    protected servUploadedFile = (req, res: express.Response, next) =>
    {
        var pathInfo = req.params[0] ? req.params[0] : this.config.defaultWebServerFile;
        res.sendFile(pathInfo, {root: this.config.uploadFolder}, (err)=>
        {
            if (err)
            {
                res.sendFile(pathInfo, {root: path.join(this.config.defaultThemePath, this.publicFolder)}, (err)=>
                {
                    if (err)
                    {
                        res.status(404).sendFile('404.htm', {root: path.join(this.config.defaultThemePath, this.publicFolder)});
                    }
                });
            }
        });
    }
    protected serveFile = (req, res: express.Response, next) =>
    {
        var pathInfo = req.params[0] ? req.params[0] : this.config.defaultWebServerFile;
        res.sendFile(pathInfo, {root: path.join(this.config.currentThemePath, this.publicFolder)}, (err)=>
        {
            if (err)
            {
                res.sendFile(pathInfo, {root: path.join(this.config.defaultThemePath, this.publicFolder)}, (err)=>
                {
                    if (err)
                    {
                        res.status(404).sendFile('404.htm', {root: path.join(this.config.defaultThemePath, this.publicFolder)});
                    }
                });
            }
        });
    }
    
    protected getChallenges =  (req: Request, res: Response) =>
    {
        res.setHeader('Access-Control-Allow-Origin','*');

        var response = this.dataAccess.FindUsers({login: req.body.login});
        var challenges = this.auth.GetChallenges();
        var salt = null;
        if (response.length > 0)
        {
            var user = response[0];
            salt = user.salt;
        }
        if (!salt)
        {
            salt = this.auth.GenerateSalt();
        }

        var result = {
            salt: salt,
            challenges: challenges
        }
        res.json(result).status(200);
    }

    protected login = (req: Request, res: Response) =>
    {
        res.setHeader('Access-Control-Allow-Origin','*');

        var token = null;
        var userLogin: string = req.body.login;
        userLogin = userLogin.toLowerCase();
        
        var response = this.dataAccess.FindUsers({login: userLogin});
        if (response.length > 0)
        {
            token  = this.auth.Authenticate(response[0], req.body.password, req.body.key, req.body.clientSalt);
        }

        if (token)
        {
            res.status(200).json({token: token});
        }
        else 
        {
            res.status(401).send('Not logged');
        }
    }

    protected savePost = (req: Request, res: Response) =>
    {
        res.setHeader('Access-Control-Allow-Origin','*');
        var jwtInfo = this.getJwtInfo(req);
        var user: IUser = this.auth.DecodeToken(jwtInfo.jwt);
        if (jwtInfo.connected)
        {
            this.innerSavePost(req, user, (post: IPost)=>
            {
                var data = this.postDataAccess.SavePost(post, (err, post: IPost)=>
                {
                    if (err)
                    {
                        // TODO MANAGE ERROR
                    }
                    else 
                    {
                        res.status(200).json({id:data.id, published: data.published, message: this.translate('POST_SAVED')});
                    }
                });
               
            })
            
        }
        else
        {
            res.status(401).json({error: Errors.NotLogged, text: this.translate(Errors.NotLogged.Text)}); 
        }
    }
    
    protected innerSavePost(req: Request, user: IUser, done:(post:IPost)=>void)
    {
         
        if (req.body.id)
        {
            this.postDataAccess.GetPost(req.body.id, (err, post: IPost) =>
            {
                post.content = req.body.content;
                post.title = req.body.title;
                post.tags = req.body.tags? req.body.tags.split(/[\s,;]+/): [];
                post.publicationdate = new Date(req.body.publicationDate).getTime();
                done(post);
            });
            
        }
        else
        {
            var post: IPost = null;
            post = {
                authorId: user.$loki,
                content: req.body.content,
                title: req.body.title,
                tags: req.body.tags? req.body.tags.split(/[\s,;]+/): [],
                publicationdate: new Date(req.body.publicationDate).getTime(),
                published: false
            }
        }
    }

    protected innerTogglePostPublished = (req: Request, done:(post: IPost) => void) =>
    {
        var post: IPost = null;
        if (req.body.id)
        {
            post = this.postDataAccess.GetPost(req.body.id, (err, post:IPost) =>
            {
                if (err)
                {
                    // TODO MANAGE ERROR
                }
                else 
                {
                    done(post);
                }
            });
        }
    }

    protected togglePostPublished = (req: Request, res: Response) =>
    {
        res.setHeader('Access-Control-Allow-Origin','*');
        var jwtInfo = this.getJwtInfo(req);
        var user: IUser = this.auth.DecodeToken(jwtInfo.jwt);
        if (jwtInfo.connected)
        {
            this.innerTogglePostPublished(req, (post: IPost)=>
            {
                if (post)
                {
                    post.published = !post.published;
                    var data = this.postDataAccess.SavePost(post, (err, post: IPost)=>
                    {
                        if (err)
                        {
                            // TODO MANAGE ERROR
                        }
                        else 
                        {
                            var message = post.published?'POST_PUBLISHED': 'POST_UNPUBLISHED';
                            res.status(200).json({id:data.id, published: data.published,  message: this.translate(message)});
                        }
                    });
                    
                }
                else 
                {
                    res.status(401).json({error: Errors.PostNotFound, text: this.translate(Errors.PostNotFound.Text)})
                }
            })
            
            
            
        }
        else
        {
            res.status(401).json({error: Errors.NotLogged, text: this.translate(Errors.NotLogged.Text)}); 
        }
    }

    

    protected deletePost = (req: Request, res: Response) =>
    {
        res.setHeader('Access-Control-Allow-Origin','*');
        var jwtInfo = this.getJwtInfo(req);
        var user: IUser = this.auth.DecodeToken(jwtInfo.jwt);
        if (jwtInfo.connected)
        {
            var post: IPost = null;
            if (req.body.id)
            {
                this.postDataAccess.GetPost(req.body.id, (err, post: IPost)=>
                {
                    if (err)
                    {
                        // TODO MANAGE ERROR
                    }
                    else if (post)
                    {
                        this.postDataAccess.DeletePost(post, (err)=>
                        {
                            if (err)
                            {
                                // TODO MANAGE ERROR 
                            }
                            else 
                            {
                                var context : IContext= {
                                    Name: AdminContextName.AuthorPosts,
                                    Jwt: jwtInfo.jwt,
                                    Data:
                                    {
                                        context: AdminContextName.AuthorPosts,
                                        connected: true,
                                        isadmin: jwtInfo.isadmin,
                                        offset: req.body.offset
                                    }
                                }
                                this.generatePosts(req, context, user, ()=>
                                {
                                    var result = this.blogTpl.Render('{{#_author}}{{context}}{{/_author}}', context.Data);
                                    res.status(200).send(result);
                                })
                                
                            }

                        });
                       
                    }
                    else 
                    {
                        res.status(500).json({error: Errors.PostNotFound, text: this.translate(Errors.PostNotFound.Text)}); 
                    }
                });
               
            }
            else
            {
                res.status(401).json({error: Errors.NotLogged, text: this.translate(Errors.PostNotFound.Text)}); 
            }
            
        }
        else
        {
           res.status(401).json({error: Errors.NotLogged, text: this.translate(Errors.NotLogged.Text)});
        }
    }

    protected saveDataPlugin = (req: Request) =>
    {
        winston.info('Saving data plugin configuration');
        var dataPlugin = req.body.dataplugin;
        this.dataAccess.SaveActivePlugin(PluginType.DataAccess,  dataPlugin.active);
        var pluginParams = {};
        
        for (var key in dataPlugin.parameters)
        {
            var current = dataPlugin.parameters[key];
            pluginParams[current.name] = current.value;
        }
        
        this.dataAccess.SetPluginParameters(PluginType.DataAccess, pluginParams);
    }

    protected saveAdminInfo = (req: Request, res: Response) =>
    {
        res.setHeader('Access-Control-Allow-Origin','*');
        
        if (req.body.account)
        {
            this.config.title = req.body.title;
            this.config.subTitle = req.body.motto;
            this.config.defaultLanguage = req.body.lang;
            this.dataAccess.SaveConfig(this.config);

            var salt = this.auth.GenerateSalt();
            var cryptedPassword = this.auth.Hash(salt + req.body.password);
            var user: IUser =
            {
                login: req.body.account,
                password: cryptedPassword,
                salt: salt,
                name: req.body.account,
                description: '',
                isadmin: true 
            }
            this.dataAccess.SaveUser(user);
            
            this.saveDataPlugin(req);
            
            res.status(200).send('reload');
            this.dataAccess.ForceSave(()=>{process.exit(1);});
        }
        else
        {
            res.status(500).json({error: Errors.CongfigError, text: this.translate(Errors.ConfigError.Text)}); 
        }
    }

    protected saveConfig = (req: Request, res: Response) =>
    {
        res.setHeader('Access-Control-Allow-Origin','*');
        
        var jwtInfo = this.getJwtInfo(req);
        var user: IUser = this.auth.DecodeToken(jwtInfo.jwt);
        if (jwtInfo.isadmin)
        {
            this.config.title = req.body.title;
            this.config.subTitle = req.body.motto;
            this.config.defaultLanguage = req.body.lang;
            this.config.currentThemePath = req.body.theme;
            this.dataAccess.SaveConfig(this.config);
            this.saveDataPlugin(req);



            res.status(200).json({ok:true, message:this.translate('CONFIG_SAVED')});

            this.dataAccess.ForceSave(()=>{process.exit(1);});

        }
        else 
        {
            res.status(301).json({ok:true, message:this.translate(Errors.ConfigError.Text)});
        }
    }

    protected saveAdvancedConfig = (req: Request, res: Response) =>
    {
        res.setHeader('Access-Control-Allow-Origin','*');
        
        var jwtInfo = this.getJwtInfo(req);
        var user: IUser = this.auth.DecodeToken(jwtInfo.jwt);
        
        if (jwtInfo.isadmin)
        {
            if (req.body.config)
            {
                var newConfig = req.body.config;
                for (var key in newConfig)
                {
                    var currentConfig = newConfig[key];
                    this.config[currentConfig.name] = currentConfig.value;
                }

                this.dataAccess.SaveConfig(this.config);
                res.status(200).json({ok:true, message:this.translate('CONFIG_SAVED')});
                this.dataAccess.ForceSave(()=>{process.exit(1);});
            }
        }
        else 
        {
            res.status(301).json({ok:true, message:this.translate(Errors.ConfigError.Text)});
        }
    }
    
    protected translate(src: string): string
    {
        var result = this.i8n.Translate(src, null);
        return result;
    }

    protected getRouter()
    {
        return this.router;
    }
}


