<ul class="nav" >
    <input type="hidden" value="{{offset}}" id="offset" />
    <li class="{{^back}}hidden{{/back}}"><a href="/posts/{{previous}}"  >{{#_translate}}PREVIOUS_POSTS{{/_translate}}</a></li>
    <li class="{{^more}}hidden{{/more}}"><a href="/posts/{{next}}"  >{{#_translate}}NEXT_POSTS{{/_translate}}</a></li>
</ul>