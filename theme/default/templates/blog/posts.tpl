{{#posts}}
    <h1><a href="/post/{{id}}">{{title}}</a></h1>
    <p>{{#_excerpt}}{{content}}{{/_excerpt}}</p>
    <p>{{#_date}}{{publicationdate}}{{/_date}} - <a href="/user/{{authorId}}">{{author.name}}</a></p>
{{/posts}}