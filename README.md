# vz_blog
A highly customizable blog created with node.js

## Quick start

Clone this repository

```
git clone  https://github.com/vintz/vz_blog.git
```

Load all the needed library 

```
npm install
```

Launch the blog

```
node index.js
```

That's all. The blog will be accessible from this address http://localhost:8888
You'll have to configure it and add a user. Hopefully the first configuration screen is pretty straightforward.

## Launch parameters

When you launch the blog, you can change some parameters such as the HTTP connection port or the default language.

To change the connection port:

```
node index.js port=7777
```

To change the default language to english 

```
node index.js lang=en
```

## TODO list

For now, many functionalities are missing. 
My next priorities are to create a plugin to store the posts in a MySql or  mongo database.


