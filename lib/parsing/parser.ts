import * as md from 'marked';
import {BlogTplEngine} from '../template/blogtpl';
import {ISummaryElement} from '../../interface/data';
import {IPlugin, Pluggable, PluginType, IPluggable} from '../../interface/plugin';

export abstract class PostParser implements Pluggable
{
    protected summary: ISummaryElement[];
    protected templateEngine: BlogTplEngine;
    
    public abstract Parse(mdText: string, trimTags?: boolean);

    public abstract Init(parameters: {[id:string]: any}, done: (err)=>void);
    
    public  abstract SetTemplateEngine(templateEngine);
    
    public GetSummary(): ISummaryElement[]
    {
        return this.summary;
    }
}