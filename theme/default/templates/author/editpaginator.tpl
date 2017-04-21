<ul class="nav" >
    <li><a href="/editpost/"><i class="icon-chevron-right"></i>{{#_translate}}NEW_POST{{/_translate}}</a></li>
    <input type="hidden" value="{{offset}}" id="offset" />
    <li class="{{^back}}hidden{{/back}}"><a href="/authorposts/{{previous}}"  >{{#_translate}}PREVIOUS_POSTS{{/_translate}}</a></li>
    <li class="{{^more}}hidden{{/more}}"><a href="/authorposts/{{next}}"  >{{#_translate}}NEXT_POSTS{{/_translate}}</a></li>
</ul>
