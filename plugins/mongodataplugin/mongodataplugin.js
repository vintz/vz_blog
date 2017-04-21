"use strict";
const mongodb = require('mongodb');
const data_1 = require('../../interface/data');
const PostsCollectionName = 'Posts';
class MongoDataAccess {
    constructor() {
        this.saveData = (data, collection) => {
            if (data.$loki) {
                data = collection.update(data);
            }
            else {
                data.createDate = Date.now();
                data = collection.insert(data);
                data.id = data.$loki;
            }
            return data;
        };
    }
    Init(parameters, done) {
        var dburl = parameters['dburl'];
        this.GetUser = parameters['getuser'];
        this.client = new mongodb.MongoClient();
        this.client.connect(dburl, (err, db) => {
            if (err) {
                done(err);
            }
            else {
                this.db = db;
                this.postsCollection = this.db.collection(PostsCollectionName);
                done(null);
            }
        });
    }
    ForceSave(done) {
        // TODO
    }
    CountPosts(criteria) {
        var res = this.postsCollection.count(criteria);
        return res;
    }
    parseCriterias(criteria) {
        var criterias = [];
        if (criteria == null) {
            return {};
        }
        if (criteria.tags) {
            var tags = { "tags": { "$in": criteria.tags.join } };
            criterias.push(tags);
        }
        if (typeof criteria.published != 'undefined') {
            var published = { "published": { "$eq": criteria.published } };
            criterias.push(published);
        }
        if (criteria.publicationdate) {
            var publicationDate = null;
            switch (criteria.publicationdate.criteria) {
                case data_1.DateCriteria.Before:
                    publicationDate = { "publicationdate": { "$lt": criteria.publicationdate.date } };
                    break;
                case data_1.DateCriteria.Equal:
                    publicationDate = { "publicationdate": { "$eq": criteria.publicationdate.date } };
                    break;
                case data_1.DateCriteria.After:
                    publicationDate = { "publicationdate": { "$gt": criteria.publicationdate.date } };
                    break;
            }
            criterias.push(publicationDate);
        }
        if (criteria.author) {
            var author = { "authorId": { "$eq": criteria.author } };
        }
        switch (criterias.length) {
            case 0:
                return {};
            case 1:
                return criterias[0];
            default:
                return { "$and": criterias };
        }
    }
    GetPosts(limit, offset, criteria) {
        var realCriterias = this.parseCriterias(criteria);
        var res = this.postsCollection.chain().find(realCriterias).sort((a, b) => {
            return b.publicationdate - a.publicationdate;
        }).offset(offset).limit(limit).data();
        var currentAuthors = {};
        currentAuthors['undefined'] = { name: 'NO_AUTHOR' };
        for (var key in res) {
            var current = res[key];
            if (!(current.authorId in currentAuthors)) {
                var author = this.GetUser(current.authorId);
                if (author != null) {
                    currentAuthors[current.authorId] =
                        {
                            name: author.name
                        };
                }
            }
            current.id = current.$loki;
            current.author = currentAuthors[current.authorId];
        }
        return res;
    }
    SavePost(post) {
        return this.saveData(post, this.postsCollection);
    }
    DeletePost(post) {
        this.postsCollection.remove(post);
    }
    GetPost(id, published) {
        var res = this.postsCollection.get(id);
        if (res) {
            res = JSON.parse(JSON.stringify(res));
            if (!published || res.published) {
                var author = this.GetUser(res.authorId);
                if (author != null) {
                    res.author =
                        {
                            name: author.name
                        };
                }
                res.id = res.$loki;
            }
            else {
                res = null;
            }
        }
        return res;
    }
}
exports.Plugin = MongoDataAccess;
