function site_title(){
    return "<h1>Joe Armstrong - Erlang and other stuff</h1>";
}

function site_links(){
   return `<li><a href="./index.html">Index</a></li>
	   <li><a href="./lectures.html">Lectures</a></li>
	<li><a href="./resources.html">Resources</a></li>`;
}

function template(x){
    // meta variables x.title and x.data
    var t = `
<html>
  <meta charset="UTF-8">
  </meta>
  <head>
    <link href="style.css" rel="stylesheet" type="text/css"></link>
  </head>
    <body>
      <div class="wrap">
	<nav>
	  <h1>${site_title()}</h1>
	  <ul class="nav inline-items">
	    ${site_links()}
          </ul>
	</nav>
	<div class="chapter">
	  <div class="chapter_header">
	     <h1>${x.title}</h1>
          </div>
	  ${x.data}
        </div>
      </div>
    </body>
	</html>`;
    return t;
}

    
