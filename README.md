# Amelie

**Say hi to "Amelie," a tiny, quirky blog engine built in Node.js.**

*"Why, Andrew, did you build your own blog engine? That's a dumb bad thing to do!"* you may ask. 

Yes in fact, it is a dumb and bad thing to do, but it's a dumb and bad thing I did for a few reasons:

1. I wanted to get better at Node.js, Javascript, and server side code. 

2. I wanted a blog engine where I could:

* Write all my blog posts as simple [markdown](https://daringfireball.net/projects/markdown/) files, 
* Store them all in a Dropbox folder
* Which means all I really have to do to publish a post is add a new markdown file in my Dropbox folder
* And I never have to implement a login or admin system for my site
* (I also wanted to be able to do link posts)

3. Like every good control freak, I liked the idea of owning all my own code from start-to-finish.

So, as far as design goals go, Markdown, Dropbox, and not having an admin panel were the big functional ones, and Javascript/Node.js were the big implementation ones. It's also based primarily on [Express](http://expressjs.com) because at this point I've been using Express for making my webservers for gosh, four years? Five?

In terms of inspiration, the idea of starting from scratch with a lightweight, new engine written in Node came from seeing [Casey Liss](http://caseyliss.com) do the same with his engine [Camel](https://github.com/cliss/camel). I don't recall ever actually reading anything beyond Camel's README so I *think* the only technical inspiration was using "@" signs to highlight metadata. But fair warning there may be unintentional inspiration snuck in. Honestly, you should probably just use Camel since Casey, you know, develops code for a living.

The visual design/overall structural flow of the default templates is also hugely inspired by Casey Liss and [Marco Arment's](https://marco.org) sites.

We should also talk about what Amelie does and doesn't do well:

**Good!**

* Small, lightweight, and purpose-built for blogging
* Uses markdown for creating posts
* Works wonderfully with Dropbox
* But it also doesn't need Dropbox! It just needs folders of files, which can be edited however you choose
* Much of the configuration is dynamically loaded, and can be edited without a deploy
* No admin panel or login to the app of any kind
* No database to manage; all content is loaded from files on disk.
* The generic "static" folder allows it to serve any type of file or media 
* The name is gr8

**Not so Good!**

* Unless it's behind a caching server, doing file lookups and generating the HTML on the fly makes it not the speediest.
* Publishing posts to the blogroll is manual and can be error-prone.
* It's only ever been used by one person, and he (me) made it, so it has little error checking.
* Since it doesn't have an admin panel or web-based CMS, using the engine is more technical than other alternatives
* The engine and the view templates were built hand-in-hand, so a serious redesign would require some editing of the engine code

**Unknown???**

* It's never been tested under any major load, so it may all go bananas in that case!
* It may be completely unintuitive for anyone who didn't literally build it from the ground up. 

---

Currently, Amelie only runs on [my own website](https://andrewwhipple.com), but please let me know if you decide to use it and I'll update that here!

Finally, you may be wondering, why is it called "Amelie"? Well, it is small, sometimes unpredictable, brings joy to all who encounter it, and also is [married to the Mice King.](https://www.youtube.com/watch?v=mCuBjMNlnVs)


## Terminology

There are a few terms related to how I think about blogging from a functional perspective that will come up again and again in this README and if you dig into the engine code. Many of them may be intuitive, but just in case:

* Post: an individual blog post, which can live at it's own independently accessible url or may be part of a blogroll. 
* Link Post: a post whose primary purpose is to link out to some external content. Explained in more detail in "Writing A Post"
* Page: a static page, meant to be more permanent than a blog post, and not able to be indexed by any blogrolls.
* Blogroll: A collection of multiple posts rendered on the same page and organized by date. The engine creates three blogrolls by default: one at "/" that shows the 5 most recent posts, one at "/blogroll" that shows every post ever, and one at "/blog/YYYY/MM" that shows all posts for that month.

With that all out of the way, here's how you use Amelie.

## Installation

You need to have Node.js running wherever you want the code to live. You can check [Node's site for download/installation instructions.](https://nodejs.org/en/download/)

Once Node is installed, you can put the source code in this repo on the machine where you want the server to run. 

Run `npm install` from the command line to install all of the various dependencies (which will be installed in the `node_modules` folder.)

### Filepath

The "filepath" is a crucial bit of information in setting up this engine. As I mentioned above, using Dropbox as the place to store my posts was my major motivation, and therefore I wanted my posts to live in, well, a Dropbox folder.

I decided to implement it such that the code and the content could live in separate folders with no hierarchical relation to each other. The code lives in this repo, and (in my case) the blog posts live in an arbitrary shared Dropbox folder. 

This requires the notion of the "filepath," which is the location of the root folder for the *content*, but written in relation to the root folder for the *code.*

Here's an example on a server:

> Say this code repo lives at `~/Documents/Amelie`. Say my content lives at `~/Dropbox/BlogPosts`. So my filepath is the *content* relative to the *code,* which in this case is `../../Dropbox/BlogPosts`.

Think about how you want your server to be set up, and come up with the filepath you'll need to use.

A side-effect of this is you absolutely *do not* need to use Dropbox as your file store for the content. It just needs a regular old set of folders, so you can update and make new posts using Dropbox, Git, FTP, logging into your server and manually editing, whatever you want!

## Installation (con't)

Once you have your filepath determined, you have two options: you can read the rest of this README and manually set up the directory structure etc, or run the included `setup.sh` (and still read the rest of this README.)

Assuming you're choosing the script, run `bash setup.sh` in the command line.

This will ask you for the filepath, which you'll need to have determined (see above.) Remember, this is the path to the *content* of your blog, relative to where the *code* lives.

`setup.sh` is a dirt-simple bash script that takes your filepath, builds out the directory structure there, then saves the filepath as the environment variable `AM_FILEPATH`.

This environment variable will be read by the Amelie engine to load the original set of configs. You will need to make sure that environment variable is set whenever you relaunch the Amelie engine.

Alternatively, you can also choose to edit the `engine.js` code to manually set the filepath. This is probably the more reliable option if we're being honest.

In addition to the filepath, you may have to edit the `port` variable at line 40 of `engine.js` to whatever port you want to use. 

After that, go to `app-config.json` (detailed below) and fill out any config info you need to get it running on your system. The setup script will default a lot of info for you. 

At this point everything should be set for the absolute, bare-minimum site, so you should be able to run `node engine.js` and navigate to your site at `localhost:3000` (or if you edited the port variable in `engine.js`, use whatever port you picked.)

This will load a bare-bones hello world site, loading one post generated by the setup script at blog/2017/01/01/helloworld.md. Feel free to delete that once you're ready to go!

## Directory Structure

Amelie follows a very strict structure for the directories where the posts live. The engine piggybacks on the file structure for it's url schemes, so it's crucial that the structure is maintained and folders and files are titled appropriately, or links break and the app may crash.

Say for example you want your posts to live in a folder called `BlogPosts`, the structure would be:

```
BlogPosts
(Blog posts)
+--blog
|	(Very important file that contains the list of all published posts)
|	+--postList.json
|	(Year, YYYY)
|	+--2017
|	|	(Month, MM)
|	|	+--01
|	|	|	(Day, DD)
|	|	|	+--28
|	|	|	|	(Markdown files for the posts)
|	|	|	|	+--helloworld.md
|	|	+--03
|	|	|	+--04
|	|	|	|	+--example.md
|	|	|	+--15
|	|	|	|	+--anotherexample.md
+--config
|	+--description.md
|	+--navbar.md
|	+--app-config.json
|	+--site-config.json
+--drafts
|	+--exampledraft.md
+--page
|	+--examplepage.md
|	+--anotherexample.md
+--static
| 	+--exampleimage.jpeg
```

In more detail:

### blog

This is where all the blog posts live, and the folder hierarchy is Year (as YYYY) -> Month (as MM) -> Day (as DD) -> individual markdown files. 

Make sure that you follow the YYYY and MM and DD convention, otherwise posts may end up out of order if rendered in a blogroll. 

You can name your markdown files whatever you would like! But as a heads-up, the filename (minus the `.md` suffix) will be the url slug for the eventual blog post, so keep that in mind when titling.

One more note: any post in this folder (provided it follows the correct diretory structure) *can be viewed by direct url.* So if you put the markdown file for a blog post in its proper YYYY/MM/DD folder, even if it's not added to the `postList.json` file (more on that below) it can be found at `/blog/YYYY/MM/DD/mysecretpost`. This is why I suggest putting any in-progress posts in the `drafts` folder (explained below.)

#### postList.json

`blog` also contains the `postList.json` file, which is a JSON file containing a single array that lists the filepaths for all of the posts that are currently published. This file is used by the Amelie engine whenever it is creating blogrolls.

What I'm saying is screwing around with this file is a quick way to break the app, so tread carefully. More details on how to properly use this file are below in "Publishing A Post."

### config

Here lies some configuration info to allow for changes to the site that previously required a full deploy (or at least a relaunch of the engine code.)

#### description.md

The HTML templates are currently structured so there is a header that shows up on every page of the site. That header has three components: the "Title," which acts as a redirect to the "/" page, the "Description," which is a line of arbitrary text, and the "Navbar," which under the hood is also just a line of arbitrary text, but is meant for persistant navigation links.

`description.md` is where the markdown for the description section of the header lives. 

#### navbar.md

Similarly, this contains the markdown for the navbar section of the header.

#### app-config.json

This file contains information related to how the Amelie app *runs* as code. Included are:

##### configTTL

This, a Number in seconds, controls how long the Amelie app will go before forcing it to re-load the files in this config folder. 

##### filepath

This filepath is not actually read, but this is kept in this config file as a reminder that HEY it's important and also to store it in text somewhere in case it gets lost.

##### cacheMaxAge

This controls the max age parameter sent in the cache-control header in all responses from the server. 

#### site-config.json

While `app-config.json` controls info related to how the *app* runs, this controls info related to how the *site* behaves. Specifically, this is where you can set the following meta information for the HTML heads of your site:

* metaDescription
* metaKeywords
* metaAuthor

As well as `defaultTitle`, which acts as the title sent on any non-blog-post or non-static page (such as the home blogroll) as well as acts as the "Title" in the header across the site. 
 
 
### drafts

This is a wild west folder. I personally use it to save drafts before moving them into their own folder in the `blog` section, but do with it as you like! 

As a note, trying to navigate to any post in this folder will 404 out, so this is a good place to put in-progress posts (rather than staging them in their relevant `blog` sub-folder.)

### page

This is where the markdown files for any static pages live. For example, if you put a file called `example.md` in this folder, it would be rendered at `/example`. 

The only required page here is `404.md`. This is where you put the markdown for what you want rendered on the 404 page. And yes it's mandatory, both because I'm too lazy to make the engine serve a default 404 page, and also because if [Strongbad can have a custom 404](http://www.homestarrunner.com/404) page you can too.

### static

This is the place to store any static files (other than css/javascript). Examples include images, pdfs, rss feeds, links to podcast mp3s, etc etc. Like the `page` section, they will be rendered just after the root url, so for example `exampleimage.jpeg` would have a url of `/exampleimage.jpeg`.
 
## Writing A Post

Publishing a post is currently a bit more involved than I'd like, but it still doesn't require logging in to an admin panel or anything. 

To create a new blog posts, first create a new markdown file (ex: `mypost.md`.) Of note, the filename (minus the `.md` suffix) will be the url slug for your post.

Start every post with metadata of the following form:

`@@: "title": "PostTitle", "date": "PostDate", "linkPost": bool, "link": "Link", "permalink": "PostPermalink" :@@`

This blog uses the concept of a "link post", which is a term for the kind of short posts that are primarily to link out to another piece of content you find interesting. This contrasts with posts that are entirely your own. The two are rendered slightly differently:

* Original Posts (aka not a link post) will look like this [example of an original post](https://andrewwhipple.com/blog/2017/01/06/2016-podcasts). The title of my post is a link to that same post, on my site.
* Link Posts will look like like this [example of a link post](https://andrewwhipple.com/blog/2016/04/09/boyproblemsvideo). Note that there is an icon (🔗 in my case) to visually distinguish it from original content, the title of the post links *out* to the source I'm referencing, and there's a new "Permalink" item in the post's header that links to the actual post on my site. 

The idea behind link posts is that if all you're really doing is linking out to someone else's content you should 1: make it incredibly clear that you're referencing their work, and 2: link out to it so your readers can easily view the other content. Ideally also 3: you should make your link posts such that they have worthwhile commentary on top of the source material (aka you're not just regurgitating someone else's work.)

Basically, it's a way to share other people's content without being a jerk.

Anyway, this concept of a link post is baked into Amelie, so now that you understand that, here's an explanation of the fields in the metadata section:

* `title`: A string for the title for your blog post!
* `date`: A *string* for the date you're posting the blog post, in human-readable form. This is not used for anything in code, but is rendered on the post page, so it's purely for aesthetic/informational purposes.
* `linkPost`: A bool to flag whether this post is a link post.
* `link`: A url string to the link you want in the title of the post. Conventionally, if you're making an original post, this should be the link to where the post lives on your site, whereas if it's a link post, this should link out to the *external* source you're referencing. 
* `permalink`: Optional parameter if "LinkPost" is false (aka if it's an original piece.) If it is a link post, then this is where you put the permalink to your actual blog post.

Additionally, you can optionally specify what will go in the meta tags on a per-post or per-page with the following fields:

* `metaDescription`: A string for the `description` tag
* `metaKeywords`: A string for the `keywords` tag (must be a string, not an array of strings)
* `metaAuthor`: A string for the `author` tag

If those are not set in the post/page metadata, then by default they'll be populated with the site-wide values set in `config/site-config.json` 

Eagle-eyed viewers may notice that the metadata section is just JSON, but with `@@:` and `:@@` instead of curly braces. Yep. I just chose different symbols for easier parsing, because they were things that would never show up in a reasonable blog post (unlike curly braces!)

## Publishing A Post

Once your file is created and saved, create a subfolder in the `blog` folder, following the conventions laid out above. Specifically, using the date you want to publish your blog post, make a folder at `blog/YYYY/MM/DD/` and put your markdown file there. 

At this point, anyone can navigate to the url of your blog post and it will render. But it won't show up in the blogrolls at "/", "/blogroll", or "/blog/YYYY/MM". This is a way you can fake an unlisted post, if you want something that can only be accessibly by direct link!

But for a normal post, you want it on your blogroll, so you need to publish it. Full disclosure, this is a little more complicated than I would like, and I will probably simplify it in future revisions to Amelie. 

But for now, the way you publish a post to be indexed by blogrolls is by adding it to `postList.json`, which is a file that lives at the top of the `blog` folder.

This file is a JSON object containing a single array called `posts`. To publish a post, edit this file and add to the array the string with the filepath to the post in question, using the format `"blog/YYYY/MM/DD/post.md"`.

As an example, if there was a new post I was writing with the filename "carlyslayjepsen.md" that lived in the `blog/2017/11/21` folder, what I would add to `postList.json` is:

`"blog/2017/11/21/carlyslayjepsen.md"`

As a trick, remember when writing a post it asks you for the "Link"? Well the link to this post would be "/blog/2017/11/21/carlyslayjepsen". So to go from writing a post to publishing it, you can:

* Use the "Link" parameter from the post,
* Add ".md" to the end

There are lots of reasons why this is a Bad System. And one of the key ones is it is *very finicky.* If the filepath is wrong by even one character, it can crash the app. If you forget a semicolon in adding the filepath to the array, it can crash. If you forget to make it a string, the app can crash. It's bad bad bad bad and should be killed with fire.

But it's what we got right now. 🙃

## Customizing Your Site
 
Since you have the code, technically you can customize it by doing whatever the heck you want to any piece of it. 

But there are probably a few key things you'd like to futz with, particularly related to what the site *looks like.*

And read the above section on how the directory is structured ("Directory Structure") and particularly the section on the `config` folder to learn about some other configurations you can make to the site without having to edit code and redeploy. 

### CSS

This site, as it stands, uses [Twitter Bootstrap](http://getbootstrap.com) for the majority of the heavy lifting, but all the custom CSS lives in the `css/theme.css` file. For namespace purposes a lot of the HTML classes used in the site are prefixed with `am-` and are (hopefully, I guess you can be the judge of that...) named in such a way that it makes sense what the classes refer to. But if you want to edit anything visual, find the appropriate `am-` class and go to town.

### HTML Templates

As of version 2, Amelie uses [Pug](https://pugjs.org/) as its rendering engine of choice.

Templates for the site are in the `views` folder:

* `index.pug`: This is the base structure of every page on the site. It contains the shared head tag, shared header, shared footer, and the structure for everything surrounding the actual post content.
* `mixins.pug`: This contains two pug [mixins](https://pugjs.org/language/mixins.html) for rendering the content of an individual post or link post within a page or blogroll.

Edit these views to your hearts content, but be careful to do so in close consideration with `engine.js` lest there's some code that expects something to be in the document.

Also, if you want to add analytics or ad code, `index.pug` is the place to do that! There's even a helpful `div` in the footer for an `am-ad` class, if you want to use it.
 
### Favicon

Replace the `favicon.ico` file in the root of the code directory with whatever you want, but make sure it keeps the `favicon.ico` filename. 

---

Anyway, that's Amelie. Below is some information that may not be of any use to anyone but eh why not.


## Current Features:
* Lightweight, small, Javscript-based engine
* Allows blog posts in Markdown
* Allows link posts in Markdown
* Allows static pages in Markdown
* Allows editing and publishing of posts without an admin panel or login
* Creates a blogroll of the last 5 posts at the index ("/")
* Creates a full blogroll of every post ever at "/blogroll"
* Creates a blogroll for each month at "/blog/YYYY/MM"
* Allows editing of header content and meta information without a deploy
* Allows blog posts and static pages to serve their own meta information
* Allows custom 404 pages
* Allows serving of arbitrary files in the `static` folder.


## To-Do:
* Replace postList.json with a lower-cermony and less error-prone method of post publishing.
* Implement RSS feeds (in both XML and JSON.)
* Server-side caching
* Implement searching and perhaps tags for posts

## Changelog:

1.0.0: Initial commit of the current working version!

2.0.0:
* Replaced handwritten template engine with [Pug](https://pugjs.org/)
* Changed `postList.json` format from `YYYY/MM/DD/filename.md` to `blog/YYYY/MM/DD/filename.md`
* Changed metadata keys in post markdown headers from `TitleCase` to `camelCase`
* Added more example pages to the sample and setup script

2.0.1:
* Added eslint
* Miscellaneous code cleanup

2.1.0:
* Added support for specifying description, keywords, and author metatext on a per-post basis.

## Sites Powered By Amelie
* [andrewwhipple.com](https://andrewwhipple.com)

## Conclusion

Welp, I think that's all I got. [Time to kick back and relax.](https://www.youtube.com/watch?v=rmJEETLbW7g)
