<!DOCTYPE html>
<html lang="en">
    <head>
    
    <meta charset="utf-8" />
    <meta http-equiv="X-UA-Compatible" content="IE=edge" />

    <title>{{meta_title}}</title>
    <meta name="description" content="{{meta_description}}" />

    <meta name="HandheldFriendly" content="True" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />

    <link rel="shortcut icon" href="favicon.ico">

    <link rel="stylesheet" href="/css/bootstrap.css">
    <link rel="stylesheet" href="/css/jquery-ui.css">
    <link rel="stylesheet" href="/css/bootstrap-responsive.css">
    <link rel="stylesheet" href="/css/simplemde.min.css">

    <link rel="stylesheet" type="text/css" media="screen" href="/css/style.css">

     <script type="text/javascript" src="/js/jquery.js"></script>
     <script type="text/javascript" src="/js/jquery-ui.js"></script>
     <script type="text/javascript" src="/js/bootstrap.js"></script>
     <script type="text/javascript" src="/js/config.js"></script>
     <script type="text/javascript" src="/js/crypto.js"></script>
     <script type="text/javascript" src="/js/call.js"></script>
     <script type="text/javascript" src="/js/login.js"></script>
     <script type="text/javascript" src="/js/simplemde.min.js"></script>
     <script type="text/javascript" src="/js/index.js"></script>
     <script type="text/javascript" src="/js/admin.js"></script>
     
    
</head>
    <body class="">
        <div class="container main">
            <div class="row">
                {{#_template}}header{{/_template}}
                {{#_template}}toaster{{/_template}}
                <div class="span3">
                    <div class="fixed-nav nav nav-list bs-docs-sidenav ">
                        <div class="nav-container">
                            {{#_template}}{{sidenav}}{{/_template}}
                            {{#_author}}{{sidenav}}{{/_author}}
                            {{#_admin}}{{sidenav}}{{/_admin}}
                        </div>
                    </div>
                </div>
                <div class="span9">
                    {{#_template}}{{context}}{{/_template}}
                    {{#_author}}{{context}}{{/_author}}
                    {{#_admin}}{{context}}{{/_admin}}
                </div>
            </div>
        </div>
    </body>
</html>
