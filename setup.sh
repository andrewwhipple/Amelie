echo Hello, welcome!
echo Enter the relative filepath where you want your blog directory to live:
read filepath
echo Building the directory structure at $filepath
cd $filepath
mkdir blog
mkdir config
mkdir drafts
mkdir page
cd page
touch 404.md
echo '@@: "Title": "404" :@@' > 404.md
touch archive.md
echo '@@: "Title": "Archive" :@@' > archive.md
cd ../
mkdir static
cd blog
touch postList.json
echo '{ "posts": ["2017/01/01/helloworld.md"] }' > postList.json
mkdir 2017
cd 2017
mkdir 01
cd 01
mkdir 01
cd 01
touch helloworld.md
echo '@@: "Title": "Hello World!", "Link": "/blog/2017/01/01/helloworld", "Date": "1/1/2017", "LinkPost": false :@@ Hello world!'> helloworld.md
cd ../../../
cd ../config
touch app-config.json
echo '{"configTTL": 1800000,"filePath": "'$filepath'", "cacheMaxAge": 300 }' > app-config.json
touch description.md
touch navbar.md
touch site-config.json
echo '{ "metaDescription": "Amelie default", "metaKeywords": "amelie, blog","metaAuthor": "Amelie User", "defaultTitle": "Hello world!"}' > site-config.json
export AM_FILEPATH=$filepath
echo Done!
echo Remember to run 'npm install'
echo And REMEMBER TO EDIT THE PORT AND FILEPATH IN THE engine.js FILE