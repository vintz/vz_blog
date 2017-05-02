<a name="blog_info" class="anchor" href="#blog_info"><span class="header-link"></span></a>
<div class="page-header">
    <h2>
        {{#_translate}}BLOG_INFORMATION{{/_translate}} 
    </h2>
</div>
<input id="title" type="text" class="post_title" value="{{config.title}}" placeholder="{{#_translate}}TITLE{{/_translate}}"/>
<input id="motto" type="text" class="post_title" value="{{config.subTitle}}" placeholder="{{#_translate}}MOTTO{{/_translate}}"/>
{{#_translate}}LANG{{/_translate}}
<select id="lang" value="{{config.defaultLanguage}}">
    {{#langs}}
        <option value="{{key}}">{{label}}</option>
    {{/langs}}
</select>

<div class="page-header">
    <h2>
        {{#_translate}}THEME{{/_translate}} 
    </h2>
</div>
<select id="theme" value="" onchange="showThemeDescription()">
    {{#themes}}
        <option value="{{Directory}}" {{#Selected}}Selected{{/Selected}}>{{Name}}</option>
    {{/themes}}
</select>
<p id="theme_description"></p>

<div class="page-header">
    <h2>
        {{#_translate}}DATA_PLUGIN{{/_translate}} 
    </h2>
</div>
<select id="dataPlugin" value="" onchange="showDataPluginParameters()">
    {{#dataPlugins}}
        <option value="{{Id}}" {{Selected}}>{{Label}}</option>
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
<br />
<br />
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



<button class="submit_btn btn btn-default" onclick="saveConfig();" >{{#_translate}}SAVE{{/_translate}}</button>

<script type="text/javascript">
    showDataPluginParameters();
</script>