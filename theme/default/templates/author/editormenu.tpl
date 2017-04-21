<ul class="nav" >
    <input type="hidden" value="{{post.id}}" id="post_id" />
    <li><a href="#" onclick="savepost()"><i class="icon-chevron-right"></i>{{#_translate}}SAVE_POST{{/_translate}}</a></li>
    <li id="unpublish_btn" class="{{^post.id}}hidden{{/post.id}} {{^post.published}}hidden{{/post.published}} "><i class="icon-chevron-right"></i><a href="#"  onclick="togglepostpublished()">{{#_translate}}UNPUBLISH{{/_translate}}</a></li>
    <li id="publish_btn"  class="{{^post.id}}hidden{{/post.id}} {{#post.published}}hidden{{/post.published}} "><i class="icon-chevron-right"></i><a href="#" onclick="togglepostpublished()">{{#_translate}}PUBLISH{{/_translate}}</a></li>
    <!--<li><a href="/editpost/{{post.id}}"><i class="icon-chevron-right"></i>{{#_translate}}RESET_POST{{/_translate}}</a></li>-->

    <li><hr /></li>
    <li id="delete_btn" class="{{^post.id}}hidden{{/post.id}} "><i class="icon-chevron-right"></i><a href="#" onclick="deletePost('{{post.id}}')" >{{#_translate}}DELETE{{/_translate}}</a></li>
</ul>
