import * as crypto from 'crypto';
import {IUser} from '../../interface/data';
import * as tools from '../tools/tools';
import * as winston from 'winston';
import * as jwt from 'jsonwebtoken';

interface ISalt 
{
    value: string;
    expiration: number;
}
export class Auth
{
    protected salts: {[id:string]: ISalt};
    protected challengeNbr: number;
    protected timeToLive: number;
    private saltLength = 15; // TODO SETTER? 
    private keyLength = 8; // TODO SETTER? 
    private tokenValidity = '1h';
    private secretKey: string = null;

    constructor(timeToLive: number, challengeNbr : number, secretKey: string)
    {
        this.salts = {};
        this.challengeNbr = challengeNbr;
        this.timeToLive = timeToLive;
        this.secretKey = secretKey;
        setInterval(this.purgeSalts, 1000);
    }

    protected purgeSalts()
    {
        for (var key in this.salts)
        {
            var salt = this.salts[key];
            if (salt.expiration < Date.now())
            {
                delete this.salts[key];
            }
        }
    }

    protected getChallenge(): {salt: string, key: string}
    {
        var key = null;
        var salt = this.GenerateSalt();

        var toSave: ISalt = 
        {
            expiration: Date.now() + this.timeToLive * 1000,
            value: salt
        }
        
        do
        {
            key = this.generateKey();
        }
        while (key in this.salts);
        this.salts[key] = toSave;

        var result  = {salt : salt, key: key};
        return result;
    }

    public GetChallenges(): Array<{salt: string, key: string}>
    {
        var result = [];
        for (var idx = 0; idx < this.challengeNbr; idx++)
        {
            result.push(this.getChallenge());
        }
        return result;
    }

    public Authenticate(user: IUser,  password: string, key: string, clientSalt): any
    {
        var token = null;
        if (key in this.salts)
        {
            const hashedPassword = this.Hash(this.salts[key].value + clientSalt + user.login + user.password);
            if (password === hashedPassword) 
            {
                winston.debug(`authentication of login ${user.login} successful`);
                delete this.salts[key]; // TODO DELETE OTHER SALTS FOR SAME USER
                var value = JSON.parse(JSON.stringify(user));
                value.password = null;
                var token = this.createToken(value);
            }
        }
        return token;
    }

    public GenerateInstallerToken()
    {
        var user: IUser=
        {
            name: 'installer',
            login: 'installer',
            password: '',
            description: '',
            salt: ''
        }
        var token = this.createToken(user);
        return token;
    }

    protected generateKey(): string
    {
        return tools.GenerateRandomString(this.keyLength);
    }

    public GenerateSalt(): string
    {
        return tools.GenerateRandomString(this.saltLength);
    }

    protected generateRandomString(length: number): string
    {
        var result = '';
        var data = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
        for (var idx = 0; idx <= length; idx++)
        {
            var rdIdx = Math.floor(Math.random() * data.length);
            result += data[rdIdx];
        }
        return result;
    }

    public Hash(text: string)
    {
        const hash = crypto.createHash('sha256');
        hash.update(text, 'utf8');
        return hash.digest('hex');
    }

    protected createToken(data)
    {
         return jwt.sign(data, this.secretKey, { expiresIn: this.tokenValidity });
    }

    public getTokenValidity() 
    {
        return this.tokenValidity;
    }

    public SetTokenValidity(duration: string) 
    {
        this.tokenValidity = duration;
    }

    public VerifyToken(token: string, callback?: (err: any, obj: any) => void) 
    {
        if (callback) 
        {
            jwt.verify(token, this.secretKey, callback);
        }
        else 
        {
            try {
                var decoded = jwt.verify(token, this.secretKey);
                return true;
            } catch(err) {
                return false;
            }
        }
    }

    public DecodeToken(token: string) {
        return jwt.decode(token, this.secretKey);
    }


}