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
import {DataAccess, PostDataAccess, CommentDataAccess} from '../data/data';
import {PostParser} from '../parsing/parser';
import {Auth} from '../authentication/auth';
import {PluginManager} from '../managers/pluginmanager';
import {ThemeManager} from '../managers/thememanager';
import * as winston from 'winston';
import {BlogEngine} from './engine';
import {StandardBlogEngine} from './standard';
import {InstallerBlogEngine} from './install';


class BlogEnginFactory
{
    constructor()
    {

    }

    CreateEngine( done: (err, engine: BlogEngine) => void)
    {
        var engine: BlogEngine;
        var dataAccess = new LokiDataAccess();
        dataAccess.Init({'dbfile': 'db.json'}, (err)=>
        {
            if(err)
            {
                done(err, null);
            }
            else 
            {
                if (dataAccess.CountUsers() <= 0)
                {
                    engine = new InstallerBlogEngine(dataAccess, ()=>
                    {
                        done(null, engine);
                    });
                }
                else 
                {
                    engine = new StandardBlogEngine(dataAccess, ()=>
                    {
                        done(null, engine);
                    });
                }
            }
        });
    }
}

export var EngineFactory = new BlogEnginFactory();

