"use strict";
const loki = require('lokijs');
const data_1 = require('../../interface/data');
const fs = require('fs');
const PostsCollectionName = 'Posts';
class LokiDataAccess {
    constructor() {
        this.SavePost = (post, done) => {
            post = this.saveData(post, this.postsCollection);
            done(null, post);
        };
        this.GetPost = (id, done, published) => {
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
                    res.id = res['$loki'];
                }
                else {
                    res = null;
                }
            }
            done(null, res);
        };
        this.saveData = (data, collection) => {
            if (data['$loki']) {
                data = collection.update(data);
            }
            else {
                data.createDate = Date.now();
                data = collection.insert(data);
                data.id = data['$loki'];
            }
            return data;
        };
    }
    Init(parameters, done) {
        var dbFile = parameters['dbfile'];
        this.GetUser = parameters['getuser'];
        this.db = new loki(dbFile, { autoload: true, autosave: true, autoloadCallback: () => {
                fs.exists(dbFile, (exists) => {
                    if (exists) {
                        this.postsCollection = this.db.getCollection(PostsCollectionName);
                    }
                    else {
                        this.postsCollection = this.db.addCollection(PostsCollectionName, { indices: ['date'] });
                    }
                    done(null);
                });
            } });
    }
    ForceSave(done) {
        this.db.saveDatabase((err) => {
            done();
        });
    }
    CountPosts(done, criteria) {
        var res = this.postsCollection.count(criteria);
        done(null, res);
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
            current.id = current['$loki'];
            current.author = currentAuthors[current.authorId];
        }
        done(null, res);
    }
    DeletePost(post, done) {
        this.postsCollection.remove(post);
        done(null);
    }
}
exports.Plugin = LokiDataAccess;
