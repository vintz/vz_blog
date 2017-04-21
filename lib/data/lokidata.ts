import * as loki from 'lokijs';
import {DataAccess,} from './data';
import {IUser} from '../../interface/data';
import {IConfig, InitConfig} from '../../interface/config';
import {IPlugin, Pluggable, PluginType, IPluggable} from '../../interface/plugin';

import * as fs from 'fs';
const UsersCollectionName = 'Users';
const ConfigCollectionName = 'Config';
const PluginCollectionName = 'Plugin';
const ActivePluginsCollectionName = 'ActivePlugins';

interface ILokiPlugin extends IPlugin
{
    $loki: number;
}

interface ILokiActivePlugins 
{
    Type: PluginType;
    Id: string;
    Parameters: {[id: string]: string};

}

export class LokiDataAccess implements DataAccess
{
    protected db: Loki;
    protected usersCollection: LokiCollection<IUser>;
    protected configCollection: LokiCollection<IConfig>;
    protected activePluginsCollection: LokiCollection<ILokiActivePlugins>
    
    constructor()
    {

    }
    
    Init(parameters: {[id:string]: any}, done: (err)=>void)
    {
        var dbFile = parameters['dbfile'];
        this.db = new loki(dbFile, {autoload: true, autosave: true, autoloadCallback: () =>
        {
            fs.exists(dbFile, (exists)=>
            {
                if (exists)
                {
                    this.usersCollection = <LokiCollection<IUser>>this.db.getCollection(UsersCollectionName);
                    this.configCollection = <LokiCollection<IConfig>>this.db.getCollection(ConfigCollectionName);
                    this.activePluginsCollection = <LokiCollection<ILokiActivePlugins>>this.db.getCollection(ActivePluginsCollectionName);
                }
                else 
                {
                    this.usersCollection = <LokiCollection<IUser>>this.db.addCollection(UsersCollectionName, {unique: ['login'], indices: ['login']} );
                    this.configCollection = <LokiCollection<IConfig>>this.db.addCollection(ConfigCollectionName, InitConfig());
                    this.activePluginsCollection = <LokiCollection<ILokiActivePlugins>>this.db.addCollection(ActivePluginsCollectionName);
                    
                    
                }
                done(null);
            })
        }});
        
        
    }

    public ForceSave(done: ()=>void)
    {
        this.db.saveDatabase((err)=>
        {
            done();
        })
    }
    
    public GetUser = (id): IUser =>
    {
        var res = this.usersCollection.get(id);
        if (res)
        {
            res = JSON.parse(JSON.stringify(res));
        }
        return res;
    }

    public CountUsers(): number
    {
        var res = this.usersCollection.count();
        return res; 
    }

    public FindUsers(query): IUser[]
    {
        var res = this.usersCollection.chain().find(query).data();
        return res;
    }

    public SaveUser = (user)=>
    {
        return this.saveData(user, this.usersCollection);
    }

    private saveData = (data: any, collection: LokiCollection<any>)=>
    {
       if (data.$loki)
       {
           data = collection.update(data);
       }
       else 
       {
           data.createDate = Date.now();
           data = collection.insert(data);
           data.id = data.$loki;
       }
       return data;
    }

    public SaveConfig(config: IConfig)
    {
        this.saveData(config, this.configCollection);
    }

    public LoadConfig(): IConfig
    {
        var configs = this.configCollection.find();
        return configs.length > 0? configs[0] : null;
    }

    public GetActivePlugin(type: PluginType): string
    {
        var result = this.activePluginsCollection.find({"Type": type});
        if (result.length >= 1)
        {
            return result[0].Id;
        }
        else 
        {
            return '';
        }
    }

    public SaveActivePlugin(type: PluginType, id: string)
    {
        var result = this.activePluginsCollection.find({"Type": type});
        if (result.length >= 1)
        {
            var entry = result[0];
            entry.Id = id;
            this.activePluginsCollection.update(entry);
        }
        else 
        {
            this.activePluginsCollection.insert({Type:type, Id: id, Parameters:{}});
        }
    }

    public SetPluginParameters(type: PluginType, parameters: {[id: string]: string} )
    {
        var plugins = this.activePluginsCollection.find({"Type": type});
        if (plugins && plugins.length > 0)
        {
            var entry = plugins[0];
            entry.Parameters = parameters;
            this.activePluginsCollection.update(entry);
        }
    }

    public GetPluginParameters(type: PluginType): {[id: string]: any}
    {
        var plugins = this.activePluginsCollection.find({"Type": type});
        if (plugins && plugins.length > 0)
        {
            var entry = plugins[0];
            if (entry)
            {
                return entry.Parameters;
            }
        }
    }


}


