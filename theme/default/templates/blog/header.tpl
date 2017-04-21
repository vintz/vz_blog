<div class="navbar navbar-inverse navbar-fixed-top">
    <div class="navbar-inner">
    <div class="container">
        <button type="button" class="btn btn-navbar" data-toggle="collapse" data-target=".nav-collapse">{{#_translate}}MENU{{/_translate}}</button>
        <div class="nav-collapse collapse">
            <ul class="nav">
                {{#_template}}menubuttons{{/_template}}
            </ul>
        </div>
    </div>
    </div>
</div>
<br />
<p class="lead">
    <a href="/" class="title">{{blogTitle}}</a>
    {{#blogSubTitle}}
        <br />
        {{blogSubTitle}}
    {{/blogSubTitle}}
</p>