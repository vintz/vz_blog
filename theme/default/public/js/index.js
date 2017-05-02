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



var offset = 0;

function savecomment()
{
    var comment = jQuery('#newComment').val();
    var postId = jQuery('#postId').val();
    var data = { comment: comment, postId: postId, token: getSessionToken() };
    post(getDomain(), '/savecomment', '', data, null, function ( result, status) {
        if (result.id)
        {
            
            jQuery('#newComment').val('');
            showToaster(result.message, 'success');
            offset = 0;
            getComments();
        }
    });

}

function getComments()
{
    var postId = jQuery('#postId').val();
    get(getDomain(), '/comments/'+postId+'?offset='+offset, '', null, null, function ( result, status) {
        jQuery('#post_comments').html(result);
    }, manage_error);
}

function nextComments()
{
    offset++;
    getComments();
}

function previousComments()
{
    offset--;
    getComments();
}
