import * as express from 'express';
import { Request, Response } from 'express';
import * as http from 'http';
import * as path from 'path';
import * as multer from 'multer';
import {I8N} from '../i8n/i8n';
var bodyParser = require('body-parser');
var cookieParser = require('cookie-parser');
import {Errors} from '../../interface/errors';
import {IPlugin, Pluggable, PluginType, IPluggable, IDefaultPlugin} from '../../interface/plugin';
import {LokiDataAccess} from '../data/lokidata';


import {BlogTplEngine} from '../template/blogtpl';
import {IContext, BlogContextName, AdminContextName, SidenavContextName, IPost, IComment, IUser, DateCriteria} from '../../interface/data';
import {IConfig, InitConfig, IMenuButton, ButtonType} from '../../interface/config';
import {PostParser} from '../parsing/parser';
import {Auth} from '../authentication/auth';
import {PluginManager} from '../managers/pluginmanager';


import {BlogEngine} from './engine';

export  class  InstallerBlogEngine extends BlogEngine
{
    constructor(dataAccess, done: ()=>void)
    {
        super(dataAccess, done);
    }

    protected init(done: ()=>void)
    {
        this.plugins = null;
        this.logInfo('Installer mode activated');
        this.config = InitConfig();
        
        this.pluginManager = new PluginManager(this.config.pluginsFolderPath);
        this.pluginManager.Init();

        this.parseParameters();
        this.router.get('/', this.showInstaller);
        this.router.post('/saveadmininfo', this.saveAdminInfo);
        this.finishInitialization(done);
    }

    protected initializationFinished()
    {
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
                dataPlugins: this.pluginManager.GetPlugins(PluginType.PostsDataAccess),
                commentsPlugins: this.pluginManager.GetPlugins(PluginType.CommentsDataAccess),
            },
            Jwt: this.auth.GenerateInstallerToken()
            
            
        }

        var result = this.blogTpl.Render('{{#_admin}}default{{/_admin}}', context.Data);
        res.status(200).end(result);
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
    
}
