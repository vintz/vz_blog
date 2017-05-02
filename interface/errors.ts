export interface IError
{
    Text: string;
    Code: number;
}
export var Errors: {[id:string]: IError} =
{
    Unknown:
    {   
        Text: 'UNKNOWN_ERROR',
        Code: 0
    },
    FileNotFound:
    {   
        Text: 'FILE_NOT_FOUND',
        Code: 1
    },
    PostNotFound:
    {   
        Text: 'POST_NOT_FOUND',
        Code: 2
    },
    NotLogged:
    {   
        Text: 'NOT_LOGGED',
        Code: 3
    },
    FileUploadError:
    {   
        Text: 'ERROR_UPLOADING_FILE',
        Code: 4
    },
    CongfigError:
    {   
        Text: 'ERROR_SAVING_CONFIG',
        Code: 5
    },
    UnableToStartPostDataAccess:
    {   
        Text: 'UNABLE_TO_START_POST_DATA_ACCESS',
        Code: 6
    },
    UnableToLoadPlugins:
    {   
        Text: 'UNABLE_TO_LOAD_PLUGINS',
        Code: 7
    },
    UnableToLoadThemes:
    {   
        Text: 'UNABLE_TO_LOAD_THEMES',
        Code: 8
    },
    UnableToStartCommentDataAccess:
    {   
        Text: 'UNABLE_TO_START_COMMENTS_DATA_ACCESS',
        Code: 9
    },
    UnableToStartPostParser:
    {   
        Text: 'UNABLE_TO_START_POST_PARSER',
        Code: 10
    },
    

}
