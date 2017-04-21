<input id="title" type="text" class="post_title" value="{{post.title}}" placeholder="{{#_translate}}TITLE{{/_translate}}"/>
<input id="publication" type="text" class="post_date" value="{{#_date}}{{post.publicationdate}}{{/_date}}" placeholder="{{#_translate}}PUBLICATION_DATE{{/_translate}}" /><br />
<input id="tags" type="text" value="{{post.tags}}" class="post_tags" placeholder="{{#_translate}}TAGS{{/_translate}}" />
<textarea id="blogEditor" class="myTextArea" ></textarea>
<div id="uploadDlg" class="modal fade" role="dialog" style="height:100%; background: transparent; display: none;" >
    <div class="modal-dialog" >
         <div class="modal-content" >
            <div class="modal-header">
                <button type="button" class="close" data-dismiss="modal">&times;</button>
                <h4 class="modal-title">{{#_translate}}UPLOAD_DIALOG_TITLE{{/_translate}}</h4>
            </div>
            <div class="modal-body">
                <form id="uploadForm" enctype="multipart/form-data" action="/uploadfile" method="post">
                    <input type="file" name="upload" />
                    <input type="submit" value="{{#_translate}}UPLOAD{{/_translate}}" name="submit" />
                </form>
            </div>
            <div class="modal-footer">
            </div>
        </div>
        
    </div>
</div>
<script>
    var currentEditor;
    var imageButton = 
    {
			name: "image",
			action: function customFunction(editor){
                $('#uploadDlg').modal('toggle');
			},
			className: "fa fa-image",
			title: "image",
	};
    var simplemde = new SimpleMDE({ element: document.getElementById("blogEditor") , 
                                toolbar: ["bold", "italic","|", 
                                "heading-1", "heading-2", "heading-3",  "|", 
                                "unordered-list" , "ordered-list", '|' ,
                                "quote" , imageButton, "link", "|",
                                "horizontal-rule", "|",
                                "guide" ]});
    simplemde.value(decodeHtml(decodeURI('{{post.content}}')));

    
    $( "#publication" ).datepicker({
	    dateFormat: "{{#_translate}}BROWSER_DATE_FORMAT{{/_translate}}"
    });

    var initUploadForm = function() 
    {
        var $form = $('#uploadForm');
        $form.on('submit', function (e) {
            
            var formdata = (window.FormData) ? new FormData($form[0]) : null;
            var data = (formdata !== null) ? formdata : $form.serialize();

            e.preventDefault();
            $.ajax({
                url: $form.attr('action'),
                type: $form.attr('method'),
                contentType: false, // obligatoire pour de l'upload
                processData: false, // obligatoire pour de l'upload
                dataType: 'json', // selon le retour attendu
                data: data,
                success: function (response) {
                    var cm = simplemde.codemirror;
                    var output = '![]('+response.path+')';
                    cm.replaceSelection(output);
                    $('#uploadDlg').modal('toggle');
                },
            });
        });
    }
    initUploadForm();

</script>

<!--https://github.com/NextStepWebs/simplemde-markdown-editor-->
