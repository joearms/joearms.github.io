/*
 * rendering engine - convert
 * a string into HTML
 * the string has come from an textarea by calling
 * Id.value
 * the resulting string (s) will be renderded using 
 * Tag.innerHTML = s
 *
 *  Inlines
 *  --Strike-- (outlevel)
 *  <<code>>   
 *  //emphasis//
 *  **bold**
 *  ^break
 *  [[Url]]
 *  [[Url|Name]]
 *  [[[Inline Image]]] (for funny inline gifs etc)
 *  ~WikiName
 *  * List
 *  ** List
 *  > Preformatted
 */


// render_wiki_string(id, s)

var listLevel;
var outStr;     // global variable -- output string
var globTag;    // the tag to be used in wiki stuff

function render_stuff(s, tag){
    // alert("render_stuff="+s);
    globTag = tag;
    var x = expand_mixed_text(s);
    // alert("x="+x);
    return x;
}

// this function only expands things inside <wik> ...</wik> sections

function expand_mixed_text(s) {
    var start, stop, mid, linksep, link;
    start = s.indexOf("<wik>");
    if(start == -1)return s;
    stop = s.indexOf("</wik>", start+2);
    if(stop == -1)return s;
    var s1 = s.substring(0, start);
    var mid = s.substring(start+5, stop);
    var s2 = s.substring(stop+6, s.length);
    return s1 + render_wiki_str(mid) + expand_mixed_text(s2);
}
    
function render_wiki_str(s){
    // out.innerHTML = "XX";
    lines = s.split("\n");
    // max is the max index a string can have in lines
    max = lines.length-1;
    // debug("max="+max);
    // for(i=0;i<max;i++){debug("i="+i+" s="+lines[i])};
    i = 0;
    listLevel = 0;
    outStr = "";
    while( i <= max){
	i = render_next(i, max, lines);
    };
    return outStr;
}

// expands ...[[....|.....]] or
//         ...[[..........]]

function expand_links(s) {
    var start, stop, mid, linksep, link;
    while(true){
	start = s.indexOf("[[");
	if(start == -1)return s;
	stop = s.indexOf("]]", start+2);
	if(stop == -1)return s;
	var s1 = s.substring(0, start);
	var mid = s.substring(start+2, stop);
        var s2 = s.substring(stop+2, s.length);
	// mid might be in two segments
	linksep = mid.indexOf("|");
	if (linksep == -1) {
	    // there is only segment
	    link =  "<a href='one?arg=" + mid + "'>" + mid + "</a>";
	    s = s1 + link + s2;
	} else {
	    // two parts
	    var a = mid.substring(0, linksep);
	    var b = mid.substring(linksep+1, mid.length);
	    link = "<a href='two?arg=" + b + "'>" + a + "</a>"; 
	    // alert("a="+a+"b="+b+"link2="+link);
	    s = s1 + link + s2;
	}
    }
}

function expand_inlines(s) {
    s = expand_code(s);
    s = expand_inline(s, "//", "<i>", "</i>");
    s = expand_inline(s, "**", "<b>", "</b>");
    s = expand_links(s);
    s = expand_br(s);
    s = expand_wiki_links(s);
    // do strike last
    s = expand_inline(s, "--", "<strike>", "</strike>");
    return(s);
}


function expand_wiki_links(s){
    var start,stop,mid;
    while(true){
	start = s.indexOf("~");
	if(start == -1)return s;
	// search for blank
	stop = s.indexOf(" ", start+1);
	if(stop == -1) return s;
	var s1 = s.substring(0, start);
	var mid = s.substring(start+1, stop);
	var s2 = s.substring(stop+1, s.length);
	s = s1 + '<a href="#" onclick="wikiClick("' + globTag +
            '","' + mid +'");">' + mid + "</a>" + s2;
    }
}


// expand_br(s) -> s'  where ^ is replaces by <br>

function expand_br(s){
    var start,stop,mid;
    while(true){
	start = s.indexOf("^");
	if(start == -1)return s;
	var s1 = s.substring(0, start);
	var s2 = s.substring(start+1, s.length);
	s = s1 + "<br>" + s2;
    }
}

// expand_code replaces <<...>> by <<tt>...</tt>
// this is the form that is returned from a text area

function expand_code(s) {
    var start, stop, mid;
    while(true){
	start = s.indexOf("&lt;&lt;");
	if(start == -1)return s;
	stop = s.indexOf("&gt;&gt;", start+2);
	if(stop == -1)return s;
	var s1  = s.substring(0, start);
	var mid = s.substring(start+8, stop);
	var s2 = s.substring(stop+8, s.length);
	s = s1 + "<tt><b>" + mid + "</b></tt>" + s2;
    }
}

// expand the inline "term"
//   replace s1 term XXX term s2 
//        by s1 wrapstart XXX wrapend s2
// used to expand things like ~~
// for example
//    expand_inline(s, "~~", "<strike>", "</strike>")

function expand_inline(s, term, wrapstart, wrapstop) {
    var start,stop,mid;
    while(true){
	start = s.indexOf(term);
	if(start == -1)return s;
	stop = s.indexOf(term, start+2);
	if(stop == -1)return s;
	var s1 = s.substring(0, start);
	var mid = s.substring(start+2, stop);
	var s2 = s.substring(stop+2, s.length);
	s = s1 + wrapstart + mid + wrapstop + s2;
    }
}

function render_next(i, max, lines){
    var s;
    s = lines[i];
    // debug("i="+i+" s="+s);
    if( s[0] == '>') {
	// alert("pre");
	// collect pre
	acc = s;
	while(i < max){
	    i++;
	    s = lines[i];
	    if (s[0] == '>'){
		acc += "\n" + s;
             } else {
                setListLevel(0);
		outStr += "<pre>" + acc + "</pre>";
		return(i);
	    };
	};
        setListLevel(0);
	outStr += "<pre>" + acc + "</pre>";
	return(max+1);
    } else if(s[0] == '!') {
        setListLevel(0);
	collected_header(s);
	return(i+1);    
    } else if(s[0] == '*') {
	collected_list(s);
	return(i+1);    
    } else {
	// alert("para");
	acc = s;
	while(i < max){
	    i++;
	    s = lines[i];
	    if (s[0] == '>' || s[0] == "!" || s[0] == '*' || isallblank(s)) {
                setListLevel(0);
		collected_para(acc);
		return(i);
	    } else {
		acc += " " + s;
	    }
	};
        setListLevel(0);
	collected_para(acc);
	return(max+1);
    };
}

function setListLevel(n){
    if (listLevel == n) return;
    else if ( listLevel > n) {
	while(listLevel > n){
	    outStr += "</ul>";
	    listLevel--;
	};
    } else if (listLevel < n) {
	while(listLevel < n){
	    outStr += "<ul>";
	    listLevel++;
	}
    }
}

function collected_para(s){
    // now we have to expand ** ~~ etc....
    s = expand_inlines(s);
    outStr += "<p>" + s + "</p>\n";
}

function collected_header(s){
    var count, i;
    i=0;
    while(i < s.length && s[i] == '!')i++;
    // i = 1 for !
    // i = 2 for !!
    count = i;
    // advance i over any blanks
    while(s[i] == ' ' && i < s.length)i++;
    var tag = "h"+count;
    outStr += "<"+tag+">" + s.substring(i,s.length) + "</" + tag + ">\n";
}

function collected_list(s){
    var count, i, s1;
    i=0;
    while(i < s.length && s[i] == '*')i++;
    // i = 1 for !
    // i = 2 for !!
    count = i;
    setListLevel(count);
    // advance i over any blanks
    while(s[i] == ' ' && i < s.length)i++;
    s1 = s.substring(i,s.length);
    outStr += "<li>" + expand_inlines(s1) + "</li>";
}

function isallblank(s) {
    var i;
    for(i = 0; i < s.length; i++){
	if(s[i] != ' ')return(false);
    };
    return(true);
}
