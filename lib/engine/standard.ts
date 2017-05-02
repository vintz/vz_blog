import * as express from 'express';
import * as multer from 'multer';
import * as path from 'path';
import { Request, Response } from 'express';
import {BlogEngine, IJwtInfo} from './engine';
import {PostParser} from '../parsing/parser';
import {PluginManager} from '../managers/pluginmanager';
import {ThemeManager} from '../managers/thememanager';
import {IConfig, InitConfig, IMenuButton, ButtonType} from '../../interface/config';
import {IPlugin, Pluggable, PluginType, IPluggable, IDefaultPlugin} from '../../interface/plugin';
import {DataAccess, PostDataAccess, CommentDataAccess} from '../data/data';
import {IContext, BlogContextName, AdminContextName, SidenavContextName, IPost, IComment, IUser, DateCriteria} from '../../interface/data';
import {Errors} from '../../interface/errors';

const DEFAULT = 'default';
const COMMENTS = 'comments';

export  class StandardBlogEngine extends BlogEngine
{
    protected postParser: PostParser;
    protected postDataAccess: PostDataAccess;
    protected commentDataAccess: CommentDataAccess;
    protected actions: {[id: string]: (req: express.Request, res: express.Response, next)=>void};
    protected upload;

    constructor(dataAccess, done: ()=>void)
    {
        super(dataAccess, done);
    }

    protected init(done: ()=>void)
    {
        this.logInfo('Standard mode activated');
        this.config = this.dataAccess.LoadConfig();
        this.parseParameters();
        
        this.pluginManager = new PluginManager(this.config.pluginsFolderPath);
        this.pluginManager.Init();
        this.themeManager = new ThemeManager(this.config.themeFolderPath);
        this.themeManager.Init();
        var postDataPluginIdx = this.dataAccess.GetActivePlugin(PluginType.PostsDataAccess);
        
        if (postDataPluginIdx && postDataPluginIdx != '')
        {
            var currentPostPlugin = this.pluginManager.GetPlugin(postDataPluginIdx);
            this.postDataAccess = <PostDataAccess>(new currentPostPlugin.Class['Plugin']());
            var parameters = this.dataAccess.GetPluginParameters(PluginType.PostsDataAccess);
            parameters['getuser'] = this.dataAccess.GetUser;
            this.postDataAccess.Init(parameters, (err)=>
            {
                if (!err)
                {
                    var commentDataPluginIdx = this.dataAccess.GetActivePlugin(PluginType.CommentsDataAccess);
                    if (commentDataPluginIdx && commentDataPluginIdx != '')
                    {
                        var currentCommentPlugin = this.pluginManager.GetPlugin(commentDataPluginIdx);
                        this.commentDataAccess = <CommentDataAccess>(new currentCommentPlugin.Class['Plugin']());
                        var parameters = this.dataAccess.GetPluginParameters(PluginType.CommentsDataAccess);
                        parameters['getuser'] = this.dataAccess.GetUser;
                        parameters['savepost'] = this.postDataAccess.SavePost;
                        parameters['getpost'] = this.postDataAccess.GetPost;
                        this.commentDataAccess.Init(parameters, (err)=>
                        {
                            if (!err)
                            {
                                this.finishStandardMode(done);
                            }
                            else 
                            {
                                this.logError(Errors.UnableToStartcommentDataAccess.Text);
                            }
                        });
                    }
                }
                else 
                {
                   this.logError(Errors.UnableToStartPostDataAccess.Text);
                }
            });
        }
    }

    protected initializationFinished()
    {
        this.postParser = new PostParser(this.blogTpl);
    }

    protected finishStandardMode(done: ()=>void)
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
        this.router.post('/savecomment', this.saveComment);
        
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
        done();
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

    /******** UPLOADED FILES MANAGEMENT ********/
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

    protected uploadFile = (req, res: express.Response, next) =>
    {
        this.upload(req, res, (err) => {
            if(err) {
                this.logError(JSON.stringify(err));
                return res.status(500).json({error: Errors.FileUploadError.Code, text: this.translate(Errors.FileUploadError.Text)});
            }
            res.status(200).json({path: '/file/' + req.file.filename});
        });
    }

    /******* LOGIN *********/
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

    /********* POST MANAGEMENT ********/
    protected savePost = (req: Request, res: Response) =>
    {
        res.setHeader('Access-Control-Allow-Origin','*');
        var jwtInfo = this.getJwtInfo(req);
        var user: IUser = this.auth.DecodeToken(jwtInfo.jwt);
        if (jwtInfo.connected)
        {
            this.innerSavePost(req, user, (post: IPost)=>
            {
                this.postDataAccess.SavePost(post, (err, post: IPost)=>
                {
                    if (err)
                    {
                        this.manageError(err, res);
                    }
                    else 
                    {
                        res.status(200).json({id:post.id, published: post.published, message: this.translate('POST_SAVED')});
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
            done(post);
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
                        this.manageError(err, res);
                    }
                    else if (post)
                    {
                        this.postDataAccess.DeletePost(post, (err)=>
                        {
                            if (err)
                            {
                                this.manageError(err, res); 
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
                                };
                                this.generatePosts(req, res, context, user, ()=>
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

    protected innerTogglePostPublished = (req: Request, res: Response,  done:(post: IPost) => void) =>
    {
        var post: IPost = null;
        if (req.body.id)
        {
            post = this.postDataAccess.GetPost(req.body.id, (err, post:IPost) =>
            {
                if (err)
                {
                    this.manageError(err, res);
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
            this.innerTogglePostPublished(req, res, (post: IPost)=>
            {
                if (post)
                {
                    post.published = !post.published;
                    this.postDataAccess.SavePost(post, (err, post: IPost)=>
                    {
                        if (err)
                        {
                            this.manageError(err, res);
                        }
                        else 
                        {
                            var message = post.published?'POST_PUBLISHED': 'POST_UNPUBLISHED';
                            res.status(200).json({id:post.id, published: post.published,  message: this.translate(message)});
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

    /********* COMMENTS MANAGEMENT ************/
    protected saveComment = (req: Request, res: Response) =>
    {
        res.setHeader('Access-Control-Allow-Origin','*');
        var jwtInfo = this.getJwtInfo(req);
        var user: IUser = this.auth.DecodeToken(jwtInfo.jwt);
        var comment: IComment = 
        {
            id: null,
            content: req.body.comment,
            date: Date.now(),
            authorId: jwtInfo.connected?user.$loki:null,
            validated: this.config.commentsAutoValidated
        }
        var postId = req.body.postId

        if (jwtInfo.connected || !this.config.onlyConnectedComment)
        {
            this.commentDataAccess.SaveComment(comment, postId, (err, comment: IComment)=>
            {
                if (err)
                {
                    this.manageError(err, res);
                }
                else 
                {
                    res.status(200).json({id:comment.id, message: this.translate('COMMENT_SAVED')});
                }
            });
        }
        else
        {
            res.status(401).json({error: Errors.NotLogged, text: this.translate(Errors.NotLogged.Text)}); 
        }
    }

    protected innerGetComments(res: Response, postId:number , context: IContext, offset: number, fullPageLoad: boolean)
    {
        var limit = 5;
        var finalOffset = offset * limit;
        this.commentDataAccess.GetComments(limit, finalOffset, postId, (err, comments)=>
        {
            if (err)
            {
                this.manageError(err, res);
            }
            else 
            {
                context.Data.post.previouscomments = (offset != 0);
                context.Data.post.comments = comments;
                this.commentDataAccess.CountComments((err, count: number) =>
                {
                    context.Data.post.nextcomments = (finalOffset + limit  < count);
                    if (fullPageLoad)
                    {
                        this.sendTemplate(context, res, DEFAULT);
                    }
                    else 
                    {
                        this.sendTemplate(context, res, COMMENTS);
                    }
                }, postId);
                
                
                
            }
        })
    }

    /********* CONFIG ********/
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

    /******* BLOG DISPLAY (STANDARD) ********/
    protected generateBlogPage = (req: Request, res: Response, next) =>
    {
        var context:IContext = this.getContext(req);

        switch (context.Name)
        {
            case BlogContextName.Posts:
                this.generatePosts(req, res, context, null, ()=>
                {
                    this.sendTemplate(context, res, DEFAULT);
                });

                break;

            case BlogContextName.Post:
                var postId = context.Data.query.id?context.Data.query.id: context.Data.params;
                if (postId)
                {
                    this.postDataAccess.GetPost(postId, (err, post: IPost) =>
                    {
                        if  (err)
                        {
                            this.manageError(err, res);
                        }
                        else 
                        {
                            
                            if (post)
                            {
                                context.Data.sidenav = SidenavContextName.Post;
                                context.Data.post = post;
                                var renderedMd = this.blogTpl.RenderText(context.Data.post.content);
                                context.Data.post.content = renderedMd.text;
                                context.Data.summary = renderedMd.summary;
                                this.innerGetComments(res, postId, context, 0, true);
                            }
                            else 
                            {
                                context.Data.post = null; 
                                this.sendTemplate(context, res, DEFAULT);
                            }
                            
                        }
                    }
                    ,true);
                    
                }
                else 
                {
                    this.generatePosts(req, res, context, null, ()=>
                    {
                        this.sendTemplate(context, res, DEFAULT);
                    });
                    
                }
                break;

            case BlogContextName.User:
                var userId = context.Data.query.id?context.Data.query.id: context.Data.params;
                context.Data.user = this.dataAccess.GetUser(userId);
                this.sendTemplate(context, res, DEFAULT);
                break;

            case BlogContextName.Login:
                this.sendTemplate(context, res, DEFAULT);
                break;

            case BlogContextName.Comments:
                    var offset = parseInt(context.Data.query.offset);
                    var currentPostId: number = parseInt(req.params[0]);
                    context.Data.post = {};
                    this.innerGetComments(res, currentPostId, context, offset, false );
                    break;
        }
    }

    protected generatePosts(req: Request, res: Response,  context: IContext, user: IUser, done: ()=>void)
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
                this.manageError(err, res);
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
                        this.manageError(err, res);
                    }
                    else 
                    {
                        var max = count;
                        context.Data.more = max > this.config.postPerPage * (offset + 1);
                        if (context.Data.more)
                        {
                            context.Data.next = offset + 1;
                        }
                        done();
                    }
                });
                
            }
        }, criterias);
        
    }

    protected sendTemplate(context:IContext, res: Response, template)
    {
        var result = this.blogTpl.Render('{{#_template}}' + template + '{{/_template}}', context.Data);
        res.status(200).end(result);
    }



    /******* BLOG DISPLAY (ADMIN) ********/

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
                    this.sendTemplate(context, res, DEFAULT);
                    break;

                case AdminContextName.MainAdmin:
                    var dataPlugin =  this.dataAccess.GetActivePlugin(PluginType.PostsDataAccess);
                    var dataPluginParameters = this.dataAccess.GetPluginParameters(PluginType.PostsDataAccess);
                    var commentsPlugin =  this.dataAccess.GetActivePlugin(PluginType.CommentsDataAccess);
                    var commentsPluginParameters = this.dataAccess.GetPluginParameters(PluginType.CommentsDataAccess);
                    context.Data.langs = [ // TODO GET LANGS FROM LANG FILES
                        {key: 'FR', label: this.translate('FRENCH')},
                        {key: 'EN', label: this.translate('ENGLISH')},
                        {key: 'DE', label:this.translate('GERMAN')},
                        {key: 'IT', label:this.translate('ITALIAN')},
                    ];
                    context.Data.themes = this.themeManager.GetThemes(this.config.currentThemePath);
                    context.Data.dataPlugins = this.pluginManager.GetPlugins(PluginType.PostsDataAccess, dataPlugin, dataPluginParameters);
                    context.Data.commentsPlugins = this.pluginManager.GetPlugins(PluginType.CommentsDataAccess, commentsPlugin, commentsPluginParameters);
                    context.Data.config = this.config;
                    context.Data.sidenav = SidenavContextName.Config;
                   this.sendTemplate(context, res, DEFAULT);
                    break;
                    
                case AdminContextName.AuthorPosts: 
                    this.generatePosts(req, res, context, user, ()=>
                    {
                        context.Data.sidenav = SidenavContextName.AuthorPosts;
                        this.sendTemplate(context, res, DEFAULT);
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
                                this.manageError(err, res);
                            }
                            else 
                            {
                                context.Data.post = JSON.parse(JSON.stringify(post)); 
                                context.Data.post.content = encodeURI(context.Data.post.content);
                                context.Data.post.tags = context.Data.post.tags && Array.isArray(context.Data.post.tags)? context.Data.post.tags.join(): '';
                                context.Data.sidenav = SidenavContextName.EditPost;
                                this.sendTemplate(context, res, DEFAULT);
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
                        this.sendTemplate(context, res, DEFAULT);
                    }
                    break;
            }
            
        }
    }

    /******* CONTEXT *********/

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
}
