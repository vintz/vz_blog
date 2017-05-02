import * as express from 'express';
import { Request, Response } from 'express';
import * as http from 'http';
import * as path from 'path';
import {I8N} from '../i8n/i8n';
var bodyParser = require('body-parser');
var cookieParser = require('cookie-parser');
import {Errors} from '../../interface/errors';
import {IPlugin, Pluggable, PluginType, IPluggable, IDefaultPlugin} from '../../interface/plugin';
import {LokiDataAccess} from '../data/lokidata';


import {BlogTplEngine} from '../template/blogtpl';
import {IContext, BlogContextName, AdminContextName, SidenavContextName, IPost, IComment, IUser, DateCriteria} from '../../interface/data';
import {IConfig, InitConfig, IMenuButton, ButtonType} from '../../interface/config';
import {DataAccess, PostDataAccess, CommentDataAccess} from '../data/data';
import {PostParser} from '../parsing/parser';
import {Auth} from '../authentication/auth';

import {PluginManager} from '../managers/pluginmanager';
import {ThemeManager} from '../managers/thememanager';

import * as winston from 'winston';

export interface IJwtInfo 
{
    jwt: string;
    connected: boolean; 
    isadmin: boolean
}

export abstract class  BlogEngine 
{
    protected pluginManager: PluginManager;
    protected themeManager: ThemeManager;
    protected plugins: {[id:number]: IPlugin};
    protected dataAccess: DataAccess;
    protected learningMode: boolean;
    protected i8n: I8N;
    protected publicFolder = 'public';
    protected config: IConfig;
    protected router: express.Router;
    protected auth: Auth;
    protected blogTpl: BlogTplEngine;

    constructor(dataAccess: LokiDataAccess, done: ()=>void)
    {
        this.learningMode = false;
        this.dataAccess = dataAccess;
        this.dataAccess.Init({'dbfile': 'db.json'}, (err)=>
        {
            this.router = express.Router();
            this.init(() => 
            {
                this.router.get('/*', this.serveFile);
                this.finishInitialization(()=>
                {
                    this.initializationFinished(()=>
                    {
                        done();
                    });
                });
            });
        });
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
            httpServ.listen(this.config.port,()=>
            {
                winston.info('Server started on port : ' + this.config.port);
                done();
            });
        });
    }

    protected abstract init(done: ()=>void);
    protected abstract initializationFinished(done: ()=>void);
    
    protected translate(src: string): string
    {
        var result = this.i8n.Translate(src, null);
        return result;
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

    protected saveDataPlugin = (req: Request) =>
    {
        winston.info('Saving data plugin configuration');
        var dataPlugin = req.body.dataplugin;
        
        this.dataAccess.SaveActivePlugin(PluginType.PostsDataAccess, dataPlugin.active);
        var pluginParams = {};
        
        for (var key in dataPlugin.parameters)
        {
            var current = dataPlugin.parameters[key];
            pluginParams[current.name] = current.value;
        }
        
        this.dataAccess.SetPluginParameters(PluginType.PostsDataAccess, pluginParams);

        var commentPlugin = req.body.commentsplugin;
        this.dataAccess.SaveActivePlugin(PluginType.CommentsDataAccess,  commentPlugin.active);
        var pluginParams = {};
        
        for (var key in commentPlugin.parameters)
        {
            var current = commentPlugin.parameters[key];
            pluginParams[current.name] = current.value;
        }
        
        this.dataAccess.SetPluginParameters(PluginType.CommentsDataAccess, pluginParams);

        var parserPlugin = req.body.parserplugin;
        this.dataAccess.SaveActivePlugin(PluginType.PostParser,  parserPlugin.active);
        var pluginParams = {};
        
        for (var key in parserPlugin.parameters)
        {
            var current = parserPlugin.parameters[key];
            pluginParams[current.name] = current.value;
        }
        
        this.dataAccess.SetPluginParameters(PluginType.PostParser, pluginParams);
    }

   

    protected logInfo(message)
    {
        winston.info(message);
    }

    protected logError(message)
    {
        winston.error(message);
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

    protected getRouter()
    {
        return this.router;
    }

    protected manageError = (err, res: Response) =>
    {
        var errorString = JSON.stringify(err);
        winston.error(errorString);
        res.status(500).end(errorString);
    }

}


