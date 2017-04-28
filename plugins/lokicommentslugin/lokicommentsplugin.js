"use strict";
class LokiDataAccess {
    GetComments(limit, offset, postId, done) {
        var result = [];
        this.getPost(postId, (err, currentPost) => {
            if (err) {
                done(err, result);
            }
            else {
                if (currentPost.comments && currentPost.comments.length > offset) {
                    currentPost.comments.sort((a, b) => {
                        return a.date - b.date;
                    });
                    for (var idx = offset; idx < Math.min(limit + offset, currentPost.comments.length); idx++) {
                        var currentComment = currentPost.comments[idx];
                        currentComment.author = this.getUser(currentComment.authorId).name;
                        result.push(currentPost.comments[idx]);
                    }
                }
                done(null, result);
            }
        });
    }
    CountComments(done, postId) {
        var result = 0;
        this.getPost(postId, (err, currentPost) => {
            if (err) {
                done(err, 0);
            }
            else if (currentPost.comments) {
                result = currentPost.comments.length;
            }
            done(null, result);
        });
    }
    SaveComment(comment, postId, done) {
        var currentCommentIdx = -1;
        this.getPost(postId, (err, currentPost) => {
            if (err) {
                done(err, null);
            }
            else {
                if (comment.id && currentPost.comments) {
                    for (var idx = 0; idx < currentPost.comments.length; idx++) {
                        if (currentPost.comments[idx].id == comment.id) {
                            currentCommentIdx = idx;
                        }
                    }
                }
                if (!currentPost.comments) {
                    currentPost.comments = [];
                }
                if (currentCommentIdx >= 0) {
                    currentPost.comments[currentCommentIdx] = comment;
                }
                else {
                    comment.id = currentPost.comments.length + '';
                    currentPost.comments.push(comment);
                }
                this.savePost(currentPost, (err, post) => {
                    done(err, comment);
                });
            }
        });
    }
    DeleteComment(comment, postId, done) {
        this.getPost(postId, (err, currentPost) => {
            if (err) {
                done(err);
            }
            else {
                if (comment.id && currentPost.comments) {
                    for (var idx = 0; idx < currentPost.comments.length; idx++) {
                        if (currentPost.comments[idx].id == comment.id) {
                            delete currentPost.comments[idx];
                            break;
                        }
                    }
                }
                this.savePost(currentPost, (err, post) => {
                    done(err);
                });
            }
        });
    }
    Init(parameters, done) {
        this.savePost = parameters['savepost'];
        this.getUser = parameters['getuser'];
        this.getPost = parameters['getpost'];
    }
}
exports.Plugin = LokiDataAccess;
