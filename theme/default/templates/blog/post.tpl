{{#post}}
<input type="hidden" id="postId" value="{{post.id}}"></input>
    <h2>{{post.title}}</h2>
    <p>{{#_date}}{{post.publicationdate}}{{/_date}} - <a href="/user/{{post.authorId}}">{{post.author.name}}</a></p>
    <p>{{&post.content}}</p>

    <hr />
    <h2>{{#_translate}}COMMENTS{{/_translate}}</h2>
    <div id="post_comments">
        {{#_template}}innercomments{{/_template}}
    </div>
    <br />
    <hr />
    {{#_template}}commenteditor{{/_template}}
{{/post}}

{{^post}}
<h2>{{#_translate}} NO_POST {{/_translate}}</h2>
{{/post}}

