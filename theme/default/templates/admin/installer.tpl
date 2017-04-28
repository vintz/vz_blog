<a name="account_info" class="anchor" href="#account_info"><span class="header-link"></span></a>
<div class="page-header">
    <h2>
        {{#_translate}}ACCOUNT_INFORMATION{{/_translate}} 
    </h2>
</div>
<input id="account" type="text" class="post_title" value="" placeholder="{{#_translate}}ACCOUNT{{/_translate}}"/>
<div id="password_span" data-invalid="{{#_translate}}PASSWORD_INVALID{{/_translate}}" ><input id="password"  onkeypress="confirmPasswordSecurity()" type="password" style="width: 100%" value="" placeholder="{{#_translate}}PASSWORD{{/_translate}}"> </input></div>
<div id="confirm_password_span" data-invalid="{{#_translate}}CONFIRMATION_FAILED{{/_translate}}" ><input id="confirm_password" onkeypress="confirmPasswordSecurity()" type="password" style="width: 100%" value="" placeholder="{{#_translate}}CONFIRM_PASSWORD{{/_translate}}" ></input></div>
<br />
<br />
<a name="blog_info" class="anchor" href="#blog_info"><span class="header-link"></span></a>
<div class="page-header">
    <h2>
        {{#_translate}}BLOG_INFORMATION{{/_translate}} 
    </h2>
</div>
<input id="title" type="text" class="post_title" value="" placeholder="{{#_translate}}TITLE{{/_translate}}"/>
<input id="motto" type="text" class="post_title" value="" placeholder="{{#_translate}}MOTTO{{/_translate}}"/>
{{#_translate}}LANG{{/_translate}}
<select id="lang" value="EN">
    {{#langs}}
        <option value="{{key}}">{{label}}</option>
    {{/langs}}
</select>
<a name="data_plugin" class="anchor" href="#data_plugin"><span class="header-link"></span></a>
<div class="page-header">
    <h2>
        {{#_translate}}DATA_PLUGIN{{/_translate}} 
    </h2>
</div>
<select id="dataPlugin" value="" onchange="showDataPluginParameters()">
    {{#dataPlugins}}
        <option value="{{Id}}">{{Label}}</option>
    {{/dataPlugins}}
</select>

{{#dataPlugins}}
    <div class="pluginParameters hidden" id="pluginParameters_{{Id}}" >
        <blockquote>
            {{#_translate}}{{Description}}{{/_translate}} 
        </blockquote>
    {{#Parameters}}
        <div class="field" data-description="{{#_translate}}{{Description}}{{/_translate}}"><input id="{{Name}}" class="post_title" type="text" placeholder="{{#_translate}}{{Label}}{{/_translate}}" value="{{DefaultValue}}" ></input></div>
    {{/Parameters}}
    </div>
{{/dataPlugins}}

<h2>
    {{#_translate}}COMMENTS_PLUGIN{{/_translate}} 
</h2>
<select id="commentsPlugin" value="" onchange="showDataPluginParameters()">
    {{#commentsPlugins}}
        <option value="{{Id}}">{{Label}}</option>
    {{/commentsPlugins}}
</select>

{{#commentsPlugins}}
    <div class="pluginParameters hidden" id="pluginParameters_{{Id}}" >
        <blockquote>
            {{#_translate}}{{Description}}{{/_translate}} 
        </blockquote>
    {{#Parameters}}
        <div class="field" data-description="{{#_translate}}{{Description}}{{/_translate}}"><input id="{{Name}}" class="post_title" type="text" placeholder="{{#_translate}}{{Label}}{{/_translate}}" value="{{DefaultValue}}" ></input></div>
    {{/Parameters}}
    </div>
{{/commentsPlugins}}




<button class="submit_btn btn btn-default" onclick="saveAdminInfo();" >{{#_translate}}SAVE{{/_translate}}</button>

<script type="text/javascript">
    showDataPluginParameters();
</script>