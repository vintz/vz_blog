import * as tools from '../lib/tools/tools';

export interface IConfig
{
    themeFolderPath: string;
    defaultThemePath: string;
    currentThemePath: string;
    port:  number;
    tplFoldername: string;
    blogFoldernname: string;
    markdownFoldername: string,
    templateExtension: string;
    adminFoldername: string;
    authorFoldername: string;
    defaultWebServerFile: string;
    uploadFolder: string;
    uploadEntry: string; 
    pluginsFolderPath: string;
    postPerPage: number;
    excerptLength: number; 
    shortExcerptLength: number;
    i8nPath: string;
    defaultLanguage: string;
    title: string;
    subTitle: string;
    menuButtons: IMenuButton[];
    challengeTimeToLive: number;
    challengeNbr: number;
    secretKey: string;
    onlyConnectedComment: boolean;
    commentsAutoValidated: boolean;
    
}

export interface IMenuButton
{
    name: string;
    url: string;
    priority: number;
    onclick?: string;
    buttonType: ButtonType;
    visible?: boolean;
}

export enum ButtonType
{
    Admin,
    Author,
    NotLogged
}

export var InitConfig = ():IConfig =>
{
    var config: IConfig = 
    {
        themeFolderPath: 'theme',
        defaultThemePath: 'theme/default',
        currentThemePath: 'theme/default',
        port:  8888, 
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
                onclick:"gotoLogin()",
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
    }
    
    return config;
}
