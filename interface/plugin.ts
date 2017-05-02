export enum PluginType
{
    PostsDataAccess = 0, 
    CommentsDataAccess = 1,
    PostParser = 2
}

export abstract class Pluggable
{
    abstract Init(parameters: {[id:string]: any}, done: (err)=>void);
}

export interface IPluggable {
    new (): Pluggable;
}


export interface IPlugin
{
    Type: PluginType;
    ClassFile: string;
    Class?: IPluggable;
    Id: string;
    Label: string;
    Description: string;
    Parameters:Array<IPluginConfigEntry>;
    Selected?:boolean;
}

export interface IPluginConfigEntry
{
    Name: string;
    Type: PluginEntryDataType;
    Description: string;
    Label: string;
    DefaultValue: string|number|boolean;
}

export interface IPluginConfig 
{
    [id:string]: string|number|boolean;
}

export class PluginEntryDataType
{
    string: 'string';
    number: 'number';
    boolean: 'boolean';
}


export interface IDefaultPlugin extends IPlugin
{
    Default: boolean;
}