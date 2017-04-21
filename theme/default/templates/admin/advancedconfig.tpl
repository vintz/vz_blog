<div class="page-header disclaimer" >
    {{#_translate}}ADVANCED_CONFIG_DISCLAIMER{{/_translate}}
</div>
<form id="advancedConfig">
{{#config}}
    <label style="margin-top: 2em" for="{{key}}" >{{key}}</label> <input type="text" id="{{key}}" class="post_title" name="{{key}}" value="{{value}}" placeholder="{{key}}" />
{{/config}}
</form>
<button class="submit_btn btn btn-default" onclick="saveAdvancedConfig();" >{{#_translate}}SAVE{{/_translate}}</button>