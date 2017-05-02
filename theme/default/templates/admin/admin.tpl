{{#_admin}}innerconfig{{/_admin}}

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

<button class="submit_btn btn btn-default" onclick="saveConfig();" >{{#_translate}}SAVE{{/_translate}}</button>

<script type="text/javascript">
    showDataPluginParameters();
</script>