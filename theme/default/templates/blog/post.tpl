{{#post}}
<h2>{{post.title}}</h2>
<p>{{#_date}}{{post.publicationdate}}{{/_date}} - <a href="/user/{{post.authorId}}">{{post.author.name}}</a></p>
<p>{{&post.content}}</p>
{{/post}}

{{^post}}
<h2>{{#_translate}} NO_POST {{/_translate}}</h2>
{{/post}}

