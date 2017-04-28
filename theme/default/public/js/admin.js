var savepost = function()
{
    var title = jQuery('#title').val();
    var publicationDate = jQuery( "#publication" ).datepicker( "getDate" );
    var content = simplemde.value();
    var id = jQuery('#post_id').val();
    var tags = jQuery('#tags').val();
    var data = { title: title, publicationDate: publicationDate, content: content, id: id, tags: tags, token: getSessionToken() };
    post(getDomain(), '/savepost', '', data, null, function ( result, status) {
        if (result.id)
        {
            jQuery('#post_id').val(result.id);
            jQuery('#publish_btn').addClass('hidden');
            jQuery('#unpublish_btn').addClass('hidden');
            if (!result.published)
            {
                jQuery('#publish_btn').removeClass('hidden');
            }
            else 
            {
                jQuery('#unpublish_btn').removeClass('hidden');
            }
            showToaster(result.message, 'success');
        }

    }, manage_error);
}

var togglepostpublished = function()
{
     var id = jQuery('#post_id').val();
     var data = {id: id};
     post(getDomain(), '/togglePostPublished', '', data, null, function ( result, status) {
        if (result.id)
        {
            jQuery('#publish_btn').addClass('hidden');
            jQuery('#unpublish_btn').addClass('hidden');
            if (!result.published)
            {
                jQuery('#publish_btn').removeClass('hidden');
            }
            else 
            {
                jQuery('#unpublish_btn').removeClass('hidden');
            }
            showToaster(result.message, 'success');
        }
     });
}

var deletePost = function(id, offset)
{
    var data = {  
        id: id, 
        token: getSessionToken(),
        offset: offset

     };
    post(getDomain(), '/deletepost', '', data, null, function ( result, status) {
        showToaster('Post deleted', 'success');
        jQuery('#posts').html(result);

    }, manage_error);
}

var confirmPasswordSecurity = function(insecuredText, invalidText) 
{
    var password = jQuery('#password').val();
    var confirmation = jQuery('#confirm_password').val();
    var valid = 0;
    if (checkPassword(password))
    {
        jQuery('#password').addClass('valid_password').removeClass('invalid_password');
        jQuery('#password_span').addClass('valid_password').removeClass('invalid_password');
        
    }
    else 
    {
        jQuery('#password').removeClass('valid_password').addClass('invalid_password');
        jQuery('#password_span').removeClass('valid_password').addClass('invalid_password');
    }

    if (confirmation && confirmation.length != 0)
    {
        if (password == confirmation)
        {
            jQuery('#confirm_password').addClass('valid_password').removeClass('invalid_password');
            jQuery('#confirm_password_span').addClass('valid_password').removeClass('invalid_password'); 
             
        }
        else 
        {
            jQuery('#confirm_password').removeClass('valid_password').addClass('invalid_password'); 
            jQuery('#confirm_password_span').removeClass('valid_password').addClass('invalid_password'); 
            
        }
    }
    else 
    {
        jQuery('#confirm_password').removeClass('valid_password').removeClass('invalid_password'); 
        jQuery('#confirm_password_span').removeClass('valid_password').removeClass('invalid_password'); 
        
    }
}

var checkPassword = function(password) 
{
    var strongRegex = new RegExp("^(?=.*[a-z])(?=.*[A-Z])(?=.*[0-9])(?=.*[!@#\$%\^&\*])(?=.{8,})");

    return strongRegex.test(password);
}

var saveAdminInfo = function()
{
    saveConfigMain(true)
}

var saveConfig = function()
{
    saveConfigMain(false);
}

var saveConfigMain = function(installer)
{
    var account = null;
    var password = null;
    

    var title = jQuery('#title').val();
    var motto = jQuery('#motto').val();
    var lang = jQuery('#lang').val();

    var activeDataPlugin = jQuery('#dataPlugin').val();
    var activeDataPluginParameters = [];
    jQuery('#pluginParameters_'+activeDataPlugin +' :input').each(function(idx,elem){	
        
        var parameter = {
            name: this.id,
            value: this.value
        };
        activeDataPluginParameters.push(parameter);
    });

    var activeCommentPlugin = jQuery('#commentsPlugin').val();
    var activeCommentPluginParameters = [];
    jQuery('#pluginParameters_'+activeCommentPlugin +' :input').each(function(idx,elem){	
        
        var parameter = {
            name: this.id,
            value: this.value
        };
        activeCommentPluginParameters.push(parameter);
    });

    var info = {
        title: title,
        motto: motto,
        lang: lang,
        dataplugin:
        {   
            active: activeDataPlugin,
            parameters: activeDataPluginParameters
        },
        commentsplugin:
        {   
            active: activeCommentPlugin,
            parameters: activeCommentPluginParameters
        }
    }
    if (installer)
    {
        info.account = jQuery('#account').val().toLowerCase();
        info.password = jQuery('#password').val();
        post(getDomain(), '/saveadmininfo', '', info, null, function ( result, status) {
            if (result == 'reload')
            {
                window.location ='/';
            }
        }, manage_error);
    }
    else 
    {
        info.theme = jQuery('#theme').val();
        post(getDomain(), '/saveconfig', '', info, null, function ( result, status) {
            if (result.ok)
            {
                jQuery('html,body').scrollTop(0);
                showToaster(result.message, 'success');
            }
        }, manage_error);
    }
    
    

}

var showDataPluginParameters = function()
{
    jQuery('.pluginParameters').addClass('hidden');
    jQuery('#pluginParameters_'+jQuery('#dataPlugin').val()).removeClass('hidden');
    jQuery('#pluginParameters_'+jQuery('#commentsPlugin').val()).removeClass('hidden');
}



var saveAdvancedConfig = function()
{
    var data = [];
    jQuery('#advancedConfig input').each(function(idx,elem){	
        
            var config = {
                name: this.id,
                value: this.value
            };
            data.push(config);
        }
    )
    post(getDomain(), '/saveadvancedconfig', '', {config:data}, null, function ( result, status) {
        if (result.ok)
        {
            jQuery('html,body').scrollTop(0);
            showToaster(result.message, 'success');
        }
    }, manage_error);
}

var saveAdvancedConfig = function()
{
    var data = [];
    jQuery('#advancedConfig input').each(function(idx,elem){	
        
            var config = {
                name: this.id,
                value: this.value
            };
            data.push(config);
        }
    )
    post(getDomain(), '/saveadvancedconfig', '', {config:data}, null, function ( result, status) {
        if (result.ok)
        {
            jQuery('html,body').scrollTop(0);
            showToaster(result.message, 'success');
        }
    }, manage_error);
}