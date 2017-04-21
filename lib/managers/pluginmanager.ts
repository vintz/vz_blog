import {IPlugin, PluginType, Pluggable} from '../../interface/plugin';
import {Errors} from '../../interface/errors';
import {Manager} from './manager';
import * as fs from 'fs';
import * as path from 'path';

const DEFINITION_FILE_NAME = 'definition.json';

export class PluginManager extends Manager
{
    protected plugins: {[id: number]: IPlugin};
    protected path: string;

    constructor(path: string)
    {
        super(path, DEFINITION_FILE_NAME, Errors.UnableToLoadPlugins);
        this.plugins = {};
    }
 
    protected addContent(directoryPath: string)
    {
        var definition: IPlugin = JSON.parse(fs.readFileSync(path.join(directoryPath, this.baseFileName), 'utf8'));
        const pluginClass = require(path.join(__dirname, '..', '..', directoryPath, definition.ClassFile));
        definition.Class = pluginClass;
        this.plugins[definition.Id] = definition;        
    }

    protected purgeContent()
    {
        this.plugins = {};
    }

    public GetPlugin(id: string): IPlugin
    {   
        return this.plugins[id];
    }

    public GetPlugins(type: PluginType, activePlugin?:string, activePluginParams?:  {[id: string]: any}): Array<IPlugin>
    {
        var result = [];
        for (var key in this.plugins)
        {
            var current = this.plugins[key];
            if (current.Type == type)
            {
                if (current.Id == activePlugin)
                {
                    current.Selected = true;
                    for (var key2 in current.Parameters)
                    {
                        var param = current.Parameters[key2];
                        if (param.Name in activePluginParams)
                        {
                            param.DefaultValue = activePluginParams[param.Name];
                        }
                    }
                }
                result.push(current);
            }
        }
        return result;
    }
}