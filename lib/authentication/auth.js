"use strict";
const crypto = require('crypto');
const tools = require('../tools/tools');
const winston = require('winston');
const jwt = require('jsonwebtoken');
class Auth {
    constructor(timeToLive, challengeNbr, secretKey) {
        this.saltLength = 15; // TODO SETTER? 
        this.keyLength = 8; // TODO SETTER? 
        this.tokenValidity = '1h';
        this.secretKey = null;
        this.salts = {};
        this.challengeNbr = challengeNbr;
        this.timeToLive = timeToLive;
        this.secretKey = secretKey;
        setInterval(this.purgeSalts, 1000);
    }
    purgeSalts() {
        for (var key in this.salts) {
            var salt = this.salts[key];
            if (salt.expiration < Date.now()) {
                delete this.salts[key];
            }
        }
    }
    getChallenge() {
        var key = null;
        var salt = this.GenerateSalt();
        var toSave = {
            expiration: Date.now() + this.timeToLive * 1000,
            value: salt
        };
        do {
            key = this.generateKey();
        } while (key in this.salts);
        this.salts[key] = toSave;
        var result = { salt: salt, key: key };
        return result;
    }
    GetChallenges() {
        var result = [];
        for (var idx = 0; idx < this.challengeNbr; idx++) {
            result.push(this.getChallenge());
        }
        return result;
    }
    Authenticate(user, password, key, clientSalt) {
        var token = null;
        if (key in this.salts) {
            const hashedPassword = this.Hash(this.salts[key].value + clientSalt + user.login + user.password);
            if (password === hashedPassword) {
                winston.debug(`authentication of login ${user.login} successful`);
                delete this.salts[key]; // TODO DELETE OTHER SALTS FOR SAME USER
                var value = JSON.parse(JSON.stringify(user));
                value.password = null;
                var token = this.createToken(value);
            }
        }
        return token;
    }
    GenerateInstallerToken() {
        var user = {
            name: 'installer',
            login: 'installer',
            password: '',
            description: '',
            salt: ''
        };
        var token = this.createToken(user);
        return token;
    }
    generateKey() {
        return tools.GenerateRandomString(this.keyLength);
    }
    GenerateSalt() {
        return tools.GenerateRandomString(this.saltLength);
    }
    generateRandomString(length) {
        var result = '';
        var data = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
        for (var idx = 0; idx <= length; idx++) {
            var rdIdx = Math.floor(Math.random() * data.length);
            result += data[rdIdx];
        }
        return result;
    }
    Hash(text) {
        const hash = crypto.createHash('sha256');
        hash.update(text, 'utf8');
        return hash.digest('hex');
    }
    createToken(data) {
        return jwt.sign(data, this.secretKey, { expiresIn: this.tokenValidity });
    }
    getTokenValidity() {
        return this.tokenValidity;
    }
    SetTokenValidity(duration) {
        this.tokenValidity = duration;
    }
    VerifyToken(token, callback) {
        if (callback) {
            jwt.verify(token, this.secretKey, callback);
        }
        else {
            try {
                var decoded = jwt.verify(token, this.secretKey);
                return true;
            }
            catch (err) {
                return false;
            }
        }
    }
    DecodeToken(token) {
        return jwt.decode(token, this.secretKey);
    }
}
exports.Auth = Auth;
