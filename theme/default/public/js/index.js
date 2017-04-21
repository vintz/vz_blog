const sessionKey = 'authorization';
var getSessionToken = function()
{
    return localStorage.getItem(sessionKey);
}

var setSessionToken = function(token)
{
    localStorage.setItem(sessionKey, token);
    document.cookie = sessionKey+'='+token;
}

var cleanSession = function()
{
    localStorage.removeItem(sessionKey);
    document.cookie = sessionKey+'=""';
}


var showToaster = function(message, type)
{
    
    jQuery('#alert span').html(message);
    jQuery('#alert').removeClass('alert-success').removeClass('alert-info').removeClass('alert-warning').removeClass('alert-danger').removeClass('alert-error').addClass('alert-'+type).removeClass('hidden');
}

var hideToaster = function()
{
    jQuery('#alert').addClass('hidden');
}

function decodeHtml(html) {
    var txt = document.createElement("textarea");
    txt.innerHTML = html;
    return txt.value;
}