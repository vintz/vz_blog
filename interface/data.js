"use strict";
exports.BlogContextName = {
    Post: 'post',
    Posts: 'posts',
    Login: 'login',
    User: 'user',
    Comments: 'comments'
};
exports.AdminContextName = {
    MainAdmin: 'admin',
    AuthorPosts: 'authorposts',
    EditPost: 'editpost',
    Users: 'users',
    User: 'user',
    AdvancedConfig: 'advancedconfig',
    Preview: 'preview',
};
exports.SidenavContextName = {
    Posts: 'paginator',
    AuthorPosts: 'editpaginator',
    Post: 'summary',
    EditPost: 'editormenu',
    Config: 'configmenu',
    Preview: 'preview',
};
(function (DateCriteria) {
    DateCriteria[DateCriteria["Before"] = 0] = "Before";
    DateCriteria[DateCriteria["After"] = 1] = "After";
    DateCriteria[DateCriteria["Equal"] = 2] = "Equal";
})(exports.DateCriteria || (exports.DateCriteria = {}));
var DateCriteria = exports.DateCriteria;
