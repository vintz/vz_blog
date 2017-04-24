export interface IPost
{
    id?: number;
    title: string;
    content: string;
    publicationdate: number;
    authorId: number;
    author?: ISimpleUser;
    tags: string[];
    published: boolean;
    createDate?: number;

}

export interface ISimpleUser
{
    name: string;
}

export interface IUser
{
    $loki?: number;
    login: string;
    password: string;
    name: string;
    description: string;
    salt: string;
    isadmin: boolean;
}


export interface IContext
{
    Name: string;
    Jwt: string;
    Data: {[id: string]: any};
}

export var BlogContextName = 
{
    Post: 'post',
    Posts: 'posts',
    Login: 'login',
    User: 'user',
}

export var AdminContextName = 
{
    
    MainAdmin: 'admin',
    AuthorPosts: 'authorposts',
    EditPost: 'editpost',
    Users: 'users',
    User: 'user',
    AdvancedConfig: 'advancedconfig',
}

export var  SidenavContextName = 
{
    Posts: 'paginator',
    AuthorPosts: 'editpaginator',
    Post: 'summary',
    EditPost: 'editormenu',
    Config: 'configmenu',

}

export interface IRenderedText
{
    text: string;
    summary: ISummaryElement[];
}

export interface ISummaryElement
{
    id:string;
    name: string; 
    idx: number;
    level: number;
}

export interface IPostsCriterias
{
    tags?: string[];
    published?: boolean;
    publicationdate?: IPublicationDateCriteria;
    author?: number;
}

export interface IPublicationDateCriteria
{
    date: number;
    criteria: DateCriteria;
}


export enum DateCriteria
{
    Before,
    After,
    Equal
}

export interface IComment
{
    authorId: number;
    content: string;
    date: number;
    validated: boolean;
}