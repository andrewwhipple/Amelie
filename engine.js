//Requires
let express = require('express');
let app = express();
let fs = require('fs');
let marked = require('marked');
let favicon = require('serve-favicon');
let http = require('http');
let Promise = require('es6-promise').Promise;

Promise.polyfill();

//Wrapping the async readFile calls in a promise!
function readFilePromise(fileName) {
	return new Promise(function(resolve, reject){
		fs.readFile(fileName, function(err, content){
			if (err) {
				reject(err);
			}
			resolve(content);
		});
	});
}

//A wrapper for all the relevant global vars
let globalVars = {
    //Info relating to the final, surfaced web site.
    siteConfig: {
        "description": "",
        "navbar": "",
        "metaDescription": "",
        "metaKeywords": "",
        "metaAuthor": "",
        "defaultTitle": "",
		"postTemplate": "",
		"linkPostTemplate": ""
    },
    //Info relating to the running of the app code
    "appConfig": {
        "lastPulled": null,
        "configTTL": 1800000,
        "port": 3000,
        "filePath": process.env.AM_FILEPATH || "default", //This is set in the "setup.sh" script, but on subsequent starts may need to be set in a startup script or hardcoded here. More info in README.
		"cacheMaxAge": 300
    }
}

//Favicon loading
app.use(favicon(__dirname + '/favicon.ico'));


//Setting the views directory and the view engine
app.set('views', './views');
app.set('view engine', 'pug');

//Load the post templates into memory.
function loadTemplates() {
	let templates = ["./views/postTemplate.spoon", "./views/linkPostTemplate.spoon"].map(readFilePromise);

	Promise.all(templates).then(function(files) {
		globalVars.siteConfig.postTemplate = files[0].toString();
		globalVars.siteConfig.linkPostTemplate = files[1].toString();
	}).catch(function(err){
		console.log(err);
	});
}

//Load the configuration files into memory.
function loadConfigs() {

    let configs = ["description.md", "navbar.md", "app-config.json", "site-config.json"];
	for (let i = 0; i < configs.length; i++) {
		configs[i] = globalVars.appConfig.filePath + '/config/' + configs[i];
	}
	configs = configs.map(readFilePromise);
	
	Promise.all(configs)
		.then(function(files) {
			
			globalVars.siteConfig.description = marked(files[0].toString());
			globalVars.siteConfig.navbar = marked(files[1].toString());
			
			let appConfig = JSON.parse(files[2]);
			let siteConfig = JSON.parse(files[3]);
			
			//If the siteConfig info is mal-formed or nonexistent, will pass it through without question
		    globalVars.siteConfig.metaDescription = siteConfig.metaDescription;
		    globalVars.siteConfig.metaAuthor = siteConfig.metaAuthor;
		    globalVars.siteConfig.metaKeywords = siteConfig.metaKeywords;
		    globalVars.siteConfig.defaultTitle = siteConfig.defaultTitle;

			now = new Date();
			globalVars.siteConfig.currentYear = now.getFullYear();
    
			//If the appConfig info is mal-formed or nonexistent, will revert to the defaults
		    globalVars.appConfig.configTTL = appConfig.configTTL || globalVars.appConfig.configTTL;
			globalVars.appConfig.cacheMaxAge = appConfig.cacheMaxAge || globalVars.appConfig.cacheMaxAge;
			
			globalVars.appConfig.lastPulled = Date.now();
			
		
		}).catch(function(err){
			console.log(err);
		});
}

loadConfigs();
loadTemplates();

//Handle the static files
app.use(express.static(globalVars.appConfig.filePath + '/static'));
app.use('/css', express.static(__dirname + '/css'));
app.use('/scripts', express.static(__dirname + '/scripts'));
app.use('/fonts', express.static(__dirname + '/fonts'));


//Helper function to see if the TTL for the config data has expired
function configDataIsExpired() {
	return Date.now() - globalVars.appConfig.lastPulled > globalVars.appConfig.configTTL;
}


/*
Function that, given a response object from an app.get() call, the number of posts to render
	(or null if you want all possible posts) and a substring to search for (again, or null if you
	want all posts) and creates the page for a blogroll and sends the response to the client.

Ex: I want every post ever, I'd call getBlogroll(res, null, null)
Ex: I want the last 5 posts, I'd call getBlogroll(res, 5, null)
Ex: I want only posts from march 2016, I'd call getBlogroll(res, null, "2016/03")
*/
function getBlogroll(res, numPosts, searchString) {
	
	fs.readFile(globalVars.appConfig.filePath + '/blog/postList.json', function(err, content) {
        if (err) {
			console.log(err);
			return;
		} 
		let postList = JSON.parse(content);

		//Ordering is by date, most recent first, and reverse alphabetical if multiple on one day.
		postList.posts.sort();
		postList.posts.reverse();
	
		searchString = searchString || "";
		numPosts = numPosts || postList.posts.length;

		let blogRollPostFiles = [];

		for (let i = 0; i < numPosts; i++) {
			if (i < postList.posts.length && postList.posts[i].toString().indexOf(searchString) !== -1) {
				blogRollPostFiles.push(globalVars.appConfig.filePath + '/' + postList.posts[i]);
			} 
		}

		blogRollPostFiles = blogRollPostFiles.map(readFilePromise);	

		let blogRollPosts = [];		
		
		Promise.all(blogRollPostFiles).then(function(posts) {
			for (let j = 0; j < posts.length; j++) {
				postData = getDataFromMarkdown(posts[j].toString());
				blogRollPosts.push(postData);
			}
        	
			now = new Date();
			currentYear = now.getFullYear();

			res.set('Cache-Control', 'public, max-age=' + globalVars.appConfig.cacheMaxAge);

			res.render('index', {
				metaDescription: globalVars.siteConfig.metaDescription,
				metaKeywords: globalVars.siteConfig.metaKeywords,
				metaAuthor: globalVars.siteConfig.metaAuthor,
				title: globalVars.siteConfig.defaultTitle,
				siteTitle: globalVars.siteConfig.defaultTitle,
				navbar: globalVars.siteConfig.navbar,
				description: globalVars.siteConfig.description,
				readMore: true,
				posts: blogRollPosts,
				copyrightYear: globalVars.siteConfig.currentYear
			});
	
		}).catch(function(err) {
			console.log(err);
		});
	});
}

/*
Wrapper to read the the Markdown data from a given blog post filename and url path.

Takes the post (the filename of the blog post, minus the ".md" suffix); 
	the path (the date-structured URL path to the post file); 
	and the callback.

Passes into the callback the errors (if any) and the markdown from the file, as a string.
*/
function getBlogMarkdown(post, path, callback) {
    fs.readFile(globalVars.appConfig.filePath + '/blog/' + path + post + '.md', function(err, data) {        
        if (!err) data = data.toString();
        callback(err, data);
    });
};

/*
Wrapper like getBlogMarkdown, but searches the filepaths for pages. 
Only requires the page filename (minus the ".md" suffix) and a callback.

Passes into the callback the errors (if any) and the markdown from the file, as a string.
*/
function getPageMarkdown(page, callback) {
    fs.readFile(globalVars.appConfig.filePath + '/page/' + page + '.md', function(err, data) {
        if (!err) data = data.toString();
        callback(err, data);
    });
};

//Helper function to pull the metadata out of a given markdown string and return it as JSON object
function parseMetaData(markdown) {
    let metaDataRaw = markdown.match(/@@:.*:@@/)[0];     
    let metaDataClean = metaDataRaw.replace("@@:", "{").replace(":@@", "}");
    return JSON.parse(metaDataClean);
}

function getDataFromMarkdown(markdown) {
	let metadata = parseMetaData(markdown);
	let content = marked(markdown.replace(/@@:.*:@@/, ""));
	return {
		"metadata": metadata,
		"content": content
	}
}

//Route handler for the homepage, responsible for creating the main blogroll
app.get('/', function(req, res) {
    if (configDataIsExpired()) {
        loadConfigs();
    }    
   	getBlogroll(res, 5, null);
});

//Route handler for the full, infinite scroll blogroll.
app.get('/blogroll', function(req, res) {
	getBlogroll(res, null, null);
});

//Route handler for individual blog post permalinks
app.get('/blog/:year/:month/:day/:post/', function(req, res) {
    let path = "" + req.params.year + "/" + req.params.month + "/" + req.params.day + "/";
    getBlogMarkdown(req.params.post, path, function(err, data) {
        if (err) {
            res.redirect('/404');
        } else { 
			let post = getDataFromMarkdown(data);
			res.set('Cache-Control', 'public, max-age=' + globalVars.appConfig.cacheMaxAge); 
			res.render('index', {
				metaDescription: globalVars.siteConfig.metaDescription,
				metaKeywords: globalVars.siteConfig.metaKeywords,
				metaAuthor: globalVars.siteConfig.metaAuthor,
				siteTitle: globalVars.siteConfig.defaultTitle,
				navbar: globalVars.siteConfig.navbar,
				description: globalVars.siteConfig.description,
				copyrightYear: globalVars.siteConfig.currentYear,
				title: post.metadata.title,
				posts: [post]
			});
        }
    }); 
});

//Route handler for the monthly archive pages. Basically a modified index blogroll page.
app.get('/blog/:year/:month/', function(req, res) {
    fs.readFile(globalVars.appConfig.filePath + '/blog/postList.json', function(err, content) {
        if (err) {
            return callback(new Error(err));
        } 
        let dateString = req.params.year + "/" + req.params.month + "/";
        getBlogroll(res, null, dateString);
    });
});

//Route handler for static pages
app.get('/:page', function(req, res) {
    getPageMarkdown(req.params.page, function(err, data) {
        if (err) {
            res.redirect('/404');
        } else {
			let page = getDataFromMarkdown(data);
			res.set('Cache-Control', 'public, max-age=' + globalVars.appConfig.cacheMaxAge);
			res.render('index', {
				metaDescription: globalVars.siteConfig.metaDescription,
				metaKeywords: globalVars.siteConfig.metaKeywords,
				metaAuthor: globalVars.siteConfig.metaAuthor,
				siteTitle: globalVars.siteConfig.defaultTitle,
				navbar: globalVars.siteConfig.navbar,
				description: globalVars.siteConfig.description,
				copyrightYear: globalVars.siteConfig.currentYear,
				title: page.metadata.title,
				page: page.content
			});
        }
    })
});


//If all else fails! Must be last get handler. A generic 404-er
app.get('/*', function(req, res) {
   res.redirect('/404');
});


//Creates the server
http.createServer(app).listen(globalVars.appConfig.port);

