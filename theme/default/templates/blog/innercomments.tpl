{{#comments}}
    {{content}} <br />
    {{#_date}}{{date}}{{/_date}} - {{#_translate}}{{commentAuthor}}{{/_translate}}
    <br />
    <br />
{{/comments}}
{{^comments}}
    {{#_translate}} NO_COMMENTS {{/_translate}}
{{/comments}}

<div class="comments_paginator">
    {{#previouscomments}} 
        <a href="#" onclick="previousComments()"> < </a>
    {{/previouscomments}}
    &nbsp;&nbsp;&nbsp;
    {{#nextcomments}} 
        <a href="#" onclick="nextComments()"> > </a>
    {{/nextcomments}}
</div>


