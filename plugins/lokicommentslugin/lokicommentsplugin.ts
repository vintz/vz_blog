import * as loki from 'lokijs';
import {CommentDataAccess} from '../../lib/data/data';
import {IUser, IComment, IPost} from '../../interface/data';
import {IPlugin, Pluggable, PluginType, IPluggable} from '../../interface/plugin';

import * as fs from 'fs';


class LokiDataAccess implements  Pluggable, CommentDataAccess
{
    protected getUser: (id: number)=> IUser; 
    protected savePost:  (post:IPost,  done:(err, post: IPost) => void) => void;

    public  GetComments(limit, offset, post: IPost): IComment[]
    {
        var result: IComment[] = [];
        if (post.comments && post.comments.length > offset)
        {
            post.comments.sort((a: IComment, b: IComment)=>
            {
                return a.date - b.date;
            });

            for (var idx = offset; idx < Math.min(limit + offset, post.comments.length); idx++ )
            {
                var currentComment = post.comments[idx];
                currentComment.author = this.getUser(currentComment.authorId).name;
                result.push(post.comments[idx]);
            }
        }
        return result;
    }

    public  CountComments(done:(err, count:number)=>void,  post: IPost): number
    {
        var result = 0;
        if (post.comments)
        {
            result = post.comments.length;
        }
        return result;
    }

    public  SaveComment(comment: IComment, post: IPost, done:(err, comment: IComment)=>void)
    {
        var currentCommentIdx = -1;
        if (comment.id && post.comments)
        {
            for (var idx = 0; idx < post.comments.length; idx++)
            {
                if (post.comments[idx].id == comment.id)
                {
                    currentCommentIdx = idx;
                }
            }
        }
        
        if (!post.comments)
        {
            post.comments = [];
        }

        if (currentCommentIdx >= 0)
        {
            post.comments[currentCommentIdx] = comment;
        }
        else 
        {
            post.comments.push(comment);
        }

        this.savePost(post, (err, post)=>
        {
            done(err, comment);
        });
    }

    public  DeleteComment(comment: IComment, post: IPost,  done:(err)=>void)
    {
        if (comment.id && post.comments)
        {
            for (var idx = 0; idx < post.comments.length; idx++)
            {   
                if (post.comments[idx].id == comment.id)
                {
                    delete post.comments[idx];
                    break;
                }
            }
        }
       
        this.savePost(post, (err, post) =>
        {
            done(err);
        });
    }
    
    public  Init(parameters: {[id:string]: any}, done: (err)=>void)
    {
        this.savePost = parameters['savePost'];
        this.getUser = parameters['getuser'];
    }
}


export {LokiDataAccess as Plugin};