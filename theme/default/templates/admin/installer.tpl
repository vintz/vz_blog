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

{{#_admin}}innerconfig{{/_admin}}

<button class="submit_btn btn btn-default" onclick="saveAdminInfo();" >{{#_translate}}SAVE{{/_translate}}</button>
<script type="text/javascript">
    showDataPluginParameters();
</script>