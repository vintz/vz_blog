import * as loki from 'lokijs';
import {CommentDataAccess} from '../../lib/data/data';
import {IUser, IComment, IPost} from '../../interface/data';
import {IPlugin, Pluggable, PluginType, IPluggable} from '../../interface/plugin';

import * as fs from 'fs';


class LokiDataAccess implements  Pluggable, CommentDataAccess
{
    protected getUser: (id: number)=> IUser; 
    protected savePost:  (post:IPost,  done:(err, post: IPost) => void) => void;
    protected getPost:  (id,  done:(err, post: IPost) => void, published?: boolean) => void;

    public  GetComments(limit, offset, postId: number, done:(err, comments: Array<IComment>)=>void)
    {
        var result: IComment[] = [];
        this.getPost(postId, (err, currentPost) =>
        {
            if (err)
            {
                done(err, result)
            }
            else 
            {
                if (currentPost.comments && currentPost.comments.length > offset)
                {
                    currentPost.comments.sort((a: IComment, b: IComment)=>
                    {
                        return a.date - b.date;
                    });

                    for (var idx = offset; idx < Math.min(limit + offset, currentPost.comments.length); idx++ )
                    {
                        var currentComment = currentPost.comments[idx];
                        currentComment.author = this.getUser(currentComment.authorId).name;
                        result.push(currentPost.comments[idx]);
                    }
                }
                done(null, result);
            }
        });
    }

    public  CountComments(done:(err, count:number)=>void,  postId: number)
    {
        var result = 0;
        this.getPost(postId, (err, currentPost) =>
        {
            if(err)
            {
                done(err, 0);
            }
            else if (currentPost.comments)
            {
                result = currentPost.comments.length;
            }
            done(null, result);
        });
        
    }

    public  SaveComment(comment: IComment, postId: number, done:(err, comment: IComment)=>void)
    {
        var currentCommentIdx = -1;
        this.getPost(postId, (err, currentPost) =>
        {
            if (err)
            {
                done(err, null);
            }
            else 
            {
                if (comment.id && currentPost.comments)
                {
                    for (var idx = 0; idx < currentPost.comments.length; idx++)
                    {
                        if (currentPost.comments[idx].id == comment.id)
                        {
                            currentCommentIdx = idx;
                        }
                    }
                }
                
                if (!currentPost.comments)
                {
                    currentPost.comments = [];
                }

                if (currentCommentIdx >= 0)
                {
                    currentPost.comments[currentCommentIdx] = comment;
                }
                else 
                {
                    comment.id = currentPost.comments.length+'';
                    currentPost.comments.push(comment);
                }

                this.savePost(currentPost, (err, post)=>
                {
                    done(err, comment);
                });
            }
        });
        
    }

    public  DeleteComment(comment: IComment, postId: number,  done:(err)=>void)
    {
        this.getPost(postId, (err, currentPost) =>
        {
            if (err)
            {
                done(err);
            }
            else 
            {
                if (comment.id && currentPost.comments)
                {
                    for (var idx = 0; idx < currentPost.comments.length; idx++)
                    {   
                        if (currentPost.comments[idx].id == comment.id)
                        {
                            delete currentPost.comments[idx];
                            break;
                        }
                    }
                }
            
                this.savePost(currentPost, (err, post) =>
                {
                    done(err);
                });
            }
        });
    }
    
    public  Init(parameters: {[id:string]: any}, done: (err)=>void)
    {
        this.savePost = parameters['savepost'];
        this.getUser = parameters['getuser'];
        this.getPost = parameters['getpost'];
    }
}


export {LokiDataAccess as Plugin};