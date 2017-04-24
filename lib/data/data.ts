import {IPost, IUser, IComment} from '../../interface/data';
import {IConfig} from '../../interface/config';
import {IPlugin, Pluggable, PluginType, IPluggable} from '../../interface/plugin';

export abstract class DataAccess implements Pluggable
{
    public abstract Init(parameters: {[id:string]: any}, done: (err)=>void);
    public abstract CountUsers(): number;
    public abstract GetUser(id): IUser;
    public abstract FindUsers(query): IUser[];
    public abstract SaveUser(user: IUser);
    
    public abstract SaveConfig(config: IConfig);
    public abstract LoadConfig(): IConfig;
    public abstract ForceSave(done: ()=>void);
    
    public abstract GetActivePlugin(id: PluginType): string;
    public abstract SaveActivePlugin(id: PluginType, value: string);
    public abstract SetPluginParameters(type: PluginType, parameters: {[id: string]: string} );
    public abstract GetPluginParameters(type: PluginType): {[id: string]: any};
}

export abstract class PostDataAccess implements Pluggable
{
    public abstract GetPosts(limit, offset, done:(err, posts:Array<IPost>)=>void, criteria?);
    public abstract CountPosts(done:(err, count:number)=>void, criteria?);
    public abstract SavePost(post: IPost, done:(err, posts: IPost)=>void,);
    public abstract GetPost(id,  done:(err, post:IPost)=>void, published?: boolean);
    public abstract DeletePost(post: IPost,  done:(err)=>void);
    public abstract Init(parameters: {[id:string]: any}, done: (err)=>void);
}

export abstract class CommentDataAccess implements Pluggable
{
    public abstract GetComments(limit, offset, done:(err, posts:Array<IComment>)=>void, postId);
    public abstract CountComments(done:(err, count:number)=>void, postId);
    public abstract SaveComment(comment: IComment, done:(err, posts: IPost)=>void,);
    public abstract GetComment(id,  done:(err, comment:IComment)=>void, published?: boolean);
    public abstract DeleteComment(comment: IComment,  done:(err)=>void);
    public abstract Init(parameters: {[id:string]: any}, done: (err)=>void);
}
