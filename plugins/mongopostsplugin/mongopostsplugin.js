"use strict";
const mongodb = require('mongodb');
const data_1 = require('../../interface/data');
const PostsCollectionName = 'Posts';
class MongoPostAccess {
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
    CountPosts(done, criteria) {
        this.postsCollection.count(criteria, done);
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
    GetPosts(limit, offset, done, criteria) {
        var realCriterias = this.parseCriterias(criteria);
        var options = {
            limit: limit,
            skip: offset,
            sort: [['publicationDate', 'desc']]
        };
        this.postsCollection.find(realCriterias, options).toArray((err, res) => {
            if (err) {
                done(err, null);
            }
            else {
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
                    current.author = currentAuthors[current.authorId];
                }
                done(null, res);
            }
        });
    }
    SavePost(post, done) {
    }
    DeletePost(post) {
        this.postsCollection.remove(post);
    }
    GetPost(id, done, published) {
        var res = this.postsCollection.findOne({ id: id }, (err, post) => {
            if (err) {
                done(err, null);
            }
            else {
                if (post) {
                    post = JSON.parse(JSON.stringify(post));
                    if (!published || post.published) {
                        var author = this.GetUser(post.authorId);
                        if (author != null) {
                            post.author =
                                {
                                    name: author.name
                                };
                        }
                    }
                    else {
                        post = null;
                    }
                }
                done(null, post);
            }
        });
    }
}
exports.Plugin = MongoPostAccess;
