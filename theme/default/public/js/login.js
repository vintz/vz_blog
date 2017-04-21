"use strict";
var gotoLogin = function()
{
    var sessionToken = getSessionToken();
    if (sessionToken)
    {
        window.location ='/admin';
    }
    else 
    {
        window.location = '/login';
    }
}
var login = function () {
    var login = jQuery('#login').val().toLowerCase();
    var password = jQuery('#password').val();
    post(getDomain(), '/getchallenges', '', { login: login }, null, function ( result, status) {
        innerLogin(login, password, result.salt, result.challenges);
    }, manage_error);
};

var innerLogin = function (login, password, salt, challenges) {

    var password2 = hash(salt + password);
    var selectedIdx = Math.floor(Math.random() * challenges.length);
    var clientChallenge = generateRandomString(15);
    var challenge = null;
    var keyToSend = null;
    var idx = 0;
    for (var key in challenges)
    {
        if (key == selectedIdx)
        {
            keyToSend = challenges[key].key;
            challenge = challenges[key].salt;
            break;
        }
    }
    var hashedPassword = hash( challenge + clientChallenge + login + password2);
    post(getDomain(), '/login', '', { login: login, password: hashedPassword, key: keyToSend, clientSalt : clientChallenge }, null, function ( result, status) {
        setSessionToken(result.token);
        window.location='/authorposts';
    }, manage_error);
};

var hash = function (text) {
    return Sha256.hash(text);
};

var manage_error = function(err)
{
     showToaster(err.responseText, 'error');
}

var generateRandomString = function(length)
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

var logout = function()
{
    setSessionToken(null);
    window.location = '/login';
}