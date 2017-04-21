import {ITheme} from '../../interface/theme';
import {Errors} from '../../interface/errors';
import {Manager} from './manager';
import * as fs from 'fs';
import * as path from 'path';

const THEME_FILE_NAME = 'theme.json';

export class ThemeManager extends Manager
{   
    protected themes: Array<ITheme>;

    constructor(path: string)
    {
        super(path, THEME_FILE_NAME, Errors.UnableToLoadThemes);
        this.themes = [];
    }

    protected addContent(directoryPath: string)
    {
        
        var definition: ITheme = JSON.parse(fs.readFileSync(path.join(directoryPath, this.baseFileName), 'utf8'));
        definition.Directory = directoryPath.replace(path.win32.sep, path.posix.sep);
        this.themes.push(definition);
    }

    protected purgeContent()
    {
        this.themes = [];
    }


    public GetThemes( selected: string)
    {
        for (var key in this.themes)
        {
            var currentTheme = this.themes[key];
            if (currentTheme.Directory == selected) 
            {
                currentTheme.Selected = true;
            }
            else 
            {
               currentTheme.Selected = false; 
            }
        }
        return this.themes;
    }
    
}