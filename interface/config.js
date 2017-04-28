"use strict";
const tools = require('../lib/tools/tools');
(function (ButtonType) {
    ButtonType[ButtonType["Admin"] = 0] = "Admin";
    ButtonType[ButtonType["Author"] = 1] = "Author";
    ButtonType[ButtonType["NotLogged"] = 2] = "NotLogged";
})(exports.ButtonType || (exports.ButtonType = {}));
var ButtonType = exports.ButtonType;
exports.InitConfig = () => {
    var config = {
        themeFolderPath: 'theme',
        defaultThemePath: 'theme/default',
        currentThemePath: 'theme/default',
        port: 8888,
        tplFoldername: 'templates',
        blogFoldernname: 'blog',
        adminFoldername: 'admin',
        authorFoldername: 'author',
        markdownFoldername: 'markdown',
        templateExtension: '.tpl',
        pluginsFolderPath: './plugins',
        defaultWebServerFile: 'index.html',
        uploadFolder: './upload',
        uploadEntry: 'upload',
        postPerPage: 5,
        excerptLength: 200,
        shortExcerptLength: 25,
        i8nPath: 'i8n',
        defaultLanguage: 'fr',
        title: '',
        subTitle: '',
        menuButtons: [
            {
                name: 'LOGIN',
                url: '#',
                priority: 0,
                onclick: "gotoLogin()",
                buttonType: ButtonType.NotLogged
            },
            {
                name: 'ADMIN',
                priority: 1,
                buttonType: ButtonType.Admin,
                url: '/admin',
            },
            {
                name: 'EDITION',
                priority: 2,
                buttonType: ButtonType.Author,
                url: '/authorposts',
            },
            {
                name: 'LOGOUT',
                priority: 3,
                url: '#',
                buttonType: ButtonType.Author,
                onclick: "logout();"
            }
        ],
        challengeTimeToLive: 300,
        challengeNbr: 3,
        secretKey: tools.GenerateRandomString(25),
        onlyConnectedComment: false,
        commentsAutoValidated: true,
    };
    return config;
};
