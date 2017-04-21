<div id="posts">
    <table class="table table-bordered table-striped responsive-utilities">
    {{#posts}}
        <tr>
        <td>{{title}}</td>
        <td>{{#_date}}{{publicationdate}}{{/_date}}</td>
        <td>{{author.name}}</td>
        <td> <a href="/editpost/{{id}}">{{#_translate}}EDIT{{/_translate}}</a> <a href="#" onclick="deletePost('{{id}}', '{{offset}}')" >{{#_translate}}DELETE{{/_translate}}</a> </td>
        </tr>
    {{/posts}}
    </table>
</div>