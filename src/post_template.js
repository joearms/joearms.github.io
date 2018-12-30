function site_title(){
    return "<h1>Joe Armstrong - Erlang and other stuff</h1>";
}

function site_links(x){
    return `
	<li><a href="${dots(x)}/index.html">Index</a></li>
	<li><a href="${dots(x)}/about.html">About</a></li>
	<li><a href="${dots(x)}/lectures.html">Lectures</a></li>
      	<li><a href="${dots(x)}/resources.html">Resources</a></li>
	<li><a href="${dots(x)}/index_whoomph.html">Whoomph</a></li>
	`;
}

function dots(x){
    var y = x.level;
    if(y == 0){
	return ".";
    } else if(y==1) {
	return "..";
    }
}

function template(x){
    // meta variables x.title and x.data x.level x.disqus_id
    // typical value
    // x.disqus_id = "/2016-09-08-Some-title.html"
    var url = "https://joearms.github.io/published" + x.disqus_id;
    var t = `
<html>
<head>
    <meta charset="UTF-8">
    <title>${x.title} - ${site_title()}</title>
    <link href="${dots(x)}/src/style.css" rel="stylesheet" type="text/css"></link>
  </head>
    <body>
      <div class="wrap">
	<nav>
	  <h1>${site_title()}</h1>
	  <ul class="nav inline-items">
	    ${site_links(x)}
          </ul>
	</nav>
	<div class="chapter">
	  <div class="chapter_header">
	     <h1>${x.title}</h1>
          </div>
	  ${x.data}
        </div>
	<!-- the tweet button -->
	<p>	    
	  <a href= "https://twitter.com/share"  class="twitter-share-button" 
             data-url= ${url}>Tweet</a>
        </p>
  
        <script type="text/javascript"
                src="https://platform.twitter.com/widgets.js"></script>
        <!-- end of tweet button -->

        <p>Comments:</p>
  
        <div id="disqus">
          <div id="disqus_thread"></div>
          <script type="text/javascript">
      // var disqus_developer = 1;
      var disqus_shortname = 'joearmstrongsblog';
      var disqus_identifier = '${x.disqus_id}';
      var disqus_url = '${url}';
      (function() {
	  var dsq = document.createElement('script');
	  dsq.type = 'text/javascript'; dsq.async = true;
          dsq.src = 'https://' + disqus_shortname + '.disqus.com/embed.js';
      (document.getElementsByTagName('head')[0] || document.getElementsByTagName('body')[0]).appendChild(dsq);
      })();
    </script>
  </div>
</div>
    </body>
	</html>`;
    return t;
}

    
