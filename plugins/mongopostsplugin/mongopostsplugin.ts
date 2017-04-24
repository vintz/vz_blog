import * as mongodb from 'mongodb';
import { PostDataAccess} from '../../lib/data/data';
import {IUser, IPost, IPostsCriterias, IPublicationDateCriteria, DateCriteria} from '../../interface/data';
import {IConfig, InitConfig} from '../../interface/config';
import {IPlugin, Pluggable, PluginType, IPluggable} from '../../interface/plugin';

import * as fs from 'fs';
const PostsCollectionName = 'Posts';


class MongoPostAccess implements  Pluggable, PostDataAccess
{
    protected db: mongodb.Db;
    protected client: mongodb.MongoClient;
    protected postsCollection: mongodb.Collection;
    
    constructor()
    {

    }
    
    Init(parameters: {[id:string]: any}, done: (err)=>void)
    {
        var dburl = parameters['dburl'];
        this.GetUser = parameters['getuser'];
        
        this.client = new mongodb.MongoClient();
        this.client.connect(dburl, (err, db)=>
        {
            if (err)
            {
                done(err);
            }
            else 
            {
                this.db = db;
                this.postsCollection = this.db.collection(PostsCollectionName);
                done(null);
            }
        });
    }

    public ForceSave(done: ()=>void)
    {
        // TODO
    }
    
    public CountPosts(done:(err, count: number)=>void, criteria?: {})
    {
        this.postsCollection.count(criteria, done);
    }

    protected parseCriterias(criteria: IPostsCriterias): {}
    {
        var criterias = [];
        if (criteria == null)
        {
            return {};
        }
        if (criteria.tags)
        {
            var tags = {"tags":{"$in": criteria.tags.join}};
            criterias.push(tags);
        }
        if (typeof criteria.published != 'undefined')
        {
            var published = {"published":{"$eq": criteria.published}};
            criterias.push(published);
        }
        if (criteria.publicationdate)
        {
            var publicationDate = null;
            switch(criteria.publicationdate.criteria)
            {
                case DateCriteria.Before:
                    publicationDate = {"publicationdate":{"$lt":criteria.publicationdate.date}};
                    break;
                case DateCriteria.Equal:
                    publicationDate = {"publicationdate":{"$eq":criteria.publicationdate.date}}
                    break;
                case DateCriteria.After:
                    publicationDate = {"publicationdate":{"$gt":criteria.publicationdate.date}}
                    break;
            }
            criterias.push(publicationDate);
        }
        if (criteria.author)
        {
            var author = {"authorId":{"$eq":criteria.author}};
        }

        switch (criterias.length)
        {
            case 0:
                return {};
            case 1:
                return criterias[0];
            default:
                return {"$and":criterias};
        }
    }
    public  GetPosts(limit: number, offset: number, done:(err, posts: IPost[])=>void, criteria?:IPostsCriterias)    {
        var realCriterias = this.parseCriterias(criteria);
        var options = 
        {
            limit: limit,
            skip: offset,
            sort: [['publicationDate','desc']]
        }
        this.postsCollection.find(realCriterias, options).toArray( (err, res: Array<IPost>) =>
        {
            if (err)
            {
                done(err, null)
            }
            else 
            {
                var currentAuthors = {};
                currentAuthors['undefined'] = {name: 'NO_AUTHOR'};
                for (var key in res)
                {
                    var current = res[key];
                    if (!(current.authorId in currentAuthors))
                    {
                        var author = this.GetUser(current.authorId);
                        if (author != null)
                        {
                            currentAuthors[current.authorId] = 
                            {   
                                name: author.name
                            }
                        }
                    }
                    current.author = currentAuthors[current.authorId]
                }
                done(null, res);
            }
        });
    }

    public  SavePost(post:IPost, done:(err,post: IPost)=>void)
    {
      
    }

    public DeletePost(post: IPost)
    {
        this.postsCollection.remove(post);
    }

    public  GetPost(id, done:(err, post: IPost)=> void, published?: boolean)
    {
        var res = this.postsCollection.findOne({id: id}, (err, post: IPost) =>
        {
            if (err)
            {
                done(err, null);
            }
            else 
            {
                if (post)
                {
                    post = JSON.parse(JSON.stringify(post));
                    if (!published || post.published)
                    {
                        var author = this.GetUser(post.authorId);
                        if (author != null)
                        {
                            post.author = 
                            {
                                name: author.name
                            }
                        }
                    }
                    else 
                    {
                        post = null;
                    }
                }
                done(null, post)
            }
        });
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

    protected GetUser: (id: number)=> IUser; 
    
   
   
}


export {MongoPostAccess as Plugin};