"use strict";
exports.config = {
    defaultThemePath: 'theme/default',
    themePath: 'theme/default',
    port: 8888,
    tplFoldername: 'templates',
    blogFoldernname: 'blog',
    adminFoldername: 'admin',
    markdownFoldername: 'markdown',
    templateExtension: '.tpl',
    defaultWebServerFile: 'index.html',
    uploadFolder: './upload',
    uploadEntry: 'upload',
    postPerPage: 5,
    excerptLength: 200,
    shortExcerptLength: 25,
    i8nPath: 'i8n',
    defaultLanguage: 'fr',
    title: 'THE BLOG',
    subTitle: 'Where the magic happens',
     menuButtons: [
        {
            name: 'LOGIN',
            url: '#',
            onclick:"gotoLogin()",
        }
    ],
    adminMenuButtons: [
        {
            name: 'ADMIN',
            url: '/authorposts',
        },

        {
            name: 'LOGOUT',
            url: '#',
            onclick: "logout();"
        }
    ],
    challengeTimeToLive: 300,
    challengeNbr: 3,
    secretKey: 'toto',
};
