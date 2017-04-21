import {IPlugin, PluginType, Pluggable} from '../../interface/plugin';
import {Errors, IError} from '../../interface/errors';
import * as fs from 'fs';
import * as path from 'path';

export abstract class Manager
{
    protected path: string;
    protected baseFileName: string;
    protected error: IError;

    constructor(path: string, baseFileName: string, error: IError )
    {
        this.path = path;
        this.baseFileName = baseFileName;
        this.error = error;
    }

    public Init():any
    {
        this.purgeContent();
        
        var files = fs.readdirSync(this.path);
        if(files && files.length <= 0)
        {
            return  this.error;
        }
        else 
        {
            for (var key in files)
            {
                var currentDirectory = path.join(this.path, files[key]);
                if(fs.lstatSync(currentDirectory).isDirectory())
                {
                    var filename = path.join(currentDirectory, this.baseFileName);
                    if (fs.existsSync(filename))
                    {
                        this.addContent(currentDirectory);
                    }
                }
            }
            return null;
        }
    }

    protected abstract purgeContent();

    protected abstract addContent(file: string);
}