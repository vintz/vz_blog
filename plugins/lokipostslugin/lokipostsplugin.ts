import * as loki from 'lokijs';
import { PostDataAccess} from '../../lib/data/data';
import {IUser, IPost, IPostsCriterias, IPublicationDateCriteria, DateCriteria} from '../../interface/data';
import {IConfig, InitConfig} from '../../interface/config';
import {IPlugin, Pluggable, PluginType, IPluggable} from '../../interface/plugin';

import * as fs from 'fs';
const PostsCollectionName = 'Posts';


class LokiDataAccess implements  Pluggable, PostDataAccess
{
    protected db: Loki;
    protected postsCollection: LokiCollection<IPost>;
    
    constructor()
    {

    }
    
    Init(parameters: {[id:string]: any}, done: (err)=>void)
    {
        var dbFile = parameters['dbfile'];
        this.GetUser = parameters['getuser'];
        this.db = new loki(dbFile, {autoload: true, autosave: true, autoloadCallback: () =>
        {
            fs.exists(dbFile, (exists)=>
            {
                if (exists)
                {
                    this.postsCollection = <LokiCollection<IPost>>this.db.getCollection(PostsCollectionName);
                }
                else 
                {
                    this.postsCollection = <LokiCollection<IPost>>this.db.addCollection(PostsCollectionName, {indices: ['date']});
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
    
    public CountPosts(done:(err, count)=>void, criteria?: {})
    {
        var res = this.postsCollection.count(criteria);
        done(null, res);
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
    public  GetPosts(limit: number, offset: number, done:(err, posts: IPost[]) => void, criteria?:IPostsCriterias)
    {
        var realCriterias = this.parseCriterias(criteria);
        var res = this.postsCollection.chain().find(realCriterias).sort((a: IPost, b:IPost)=>
        {
            return b.publicationdate - a.publicationdate;
        }).offset(offset).limit(limit).data();
        
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
            current.id = current['$loki'];
            current.author = currentAuthors[current.authorId]
        }
        done(null, res);
    }

    public  SavePost = (post:IPost,  done:(err, post: IPost) => void) =>
    {
       post = this.saveData(post, this.postsCollection);
       done(null, post);
    }

    public DeletePost(post: IPost, done:(err) => void)
    {
        this.postsCollection.remove(post);
        done(null);
    }

    public  GetPost = (id, done:(err, post: IPost) => void, published?: boolean) =>
    {
        var res = this.postsCollection.get(id);
        if (res)
        {
            res = JSON.parse(JSON.stringify(res));
            if (!published || res.published)
            {
                var author = this.GetUser(res.authorId);
                if (author != null)
                {
                    res.author = 
                    {
                        name: author.name
                    }
                }

                res.id = res['$loki'];
            }
            else 
            {
                res = null;
            }
        }
        done(null, res)
    }

    private saveData = (data: IPost, collection: LokiCollection<any>)=>
    {
       if (data['$loki'])
       {
           data = collection.update(data);
       }
       else 
       {
           data.createDate = Date.now();
           data = collection.insert(data);
           data.id = data['$loki'];
       }
       return data;
    }

    protected GetUser: (id: number)=> IUser; 
    
   
   
}


export {LokiDataAccess as Plugin};