"use strict";
class LokiDataAccess {
    GetComments(limit, offset, post) {
        var result = [];
        if (post.comments && post.comments.length > offset) {
            post.comments.sort((a, b) => {
                return a.date - b.date;
            });
            for (var idx = offset; idx < Math.min(limit + offset, post.comments.length); idx++) {
                var currentComment = post.comments[idx];
                currentComment.author = this.getUser(currentComment.authorId).name;
                result.push(post.comments[idx]);
            }
        }
        return result;
    }
    CountComments(done, post) {
        var result = 0;
        if (post.comments) {
            result = post.comments.length;
        }
        return result;
    }
    SaveComment(comment, post, done) {
        var currentCommentIdx = -1;
        if (comment.id && post.comments) {
            for (var idx = 0; idx < post.comments.length; idx++) {
                if (post.comments[idx].id == comment.id) {
                    currentCommentIdx = idx;
                }
            }
        }
        if (!post.comments) {
            post.comments = [];
        }
        if (currentCommentIdx >= 0) {
            post.comments[currentCommentIdx] = comment;
        }
        else {
            post.comments.push(comment);
        }
        this.savePost(post, (err, post) => {
            done(err, comment);
        });
    }
    DeleteComment(comment, post, done) {
        if (comment.id && post.comments) {
            for (var idx = 0; idx < post.comments.length; idx++) {
                if (post.comments[idx].id == comment.id) {
                    delete post.comments[idx];
                    break;
                }
            }
        }
        this.savePost(post, (err, post) => {
            done(err);
        });
    }
    Init(parameters, done) {
        this.savePost = parameters['savePost'];
        this.getUser = parameters['getuser'];
    }
}
exports.Plugin = LokiDataAccess;
