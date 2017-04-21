{{#menuButtons}}
    {{#visible}}
        <li class="{{active}}">
        <a href="{{url}}" {{#onclick}} onclick="{{onclick}}" {{/onclick}}>{{#_translate}}{{name}}{{/_translate}}</a>
        </li>
    {{/visible}}
{{/menuButtons}}