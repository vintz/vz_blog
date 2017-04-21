"use strict";
exports.BlogContextName = {
    Post: 'post',
    Posts: 'posts',
    Login: 'login',
    User: 'user',
};
exports.AdminContextName = {
    MainAdmin: 'admin',
    AuthorPosts: 'authorposts',
    EditPost: 'editpost',
    Users: 'users',
    User: 'user',
    AdvancedConfig: 'advancedconfig',
};
exports.SidenavContextName = {
    Posts: 'paginator',
    AuthorPosts: 'editpaginator',
    Post: 'summary',
    EditPost: 'editormenu',
    Config: 'configmenu',
};
(function (DateCriteria) {
    DateCriteria[DateCriteria["Before"] = 0] = "Before";
    DateCriteria[DateCriteria["After"] = 1] = "After";
    DateCriteria[DateCriteria["Equal"] = 2] = "Equal";
})(exports.DateCriteria || (exports.DateCriteria = {}));
var DateCriteria = exports.DateCriteria;
