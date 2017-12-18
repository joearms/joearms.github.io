/**
 * expander.js - a markup parser
 * Copyright (c) 2017-9999, Joe Armstrong (MIT Licensed)
 * https://github.com/joearms/bookmaker
 *
 * Hopefully the last JS I every write

 * Very few regular expressions were used in the construction of this program
 * No libraries were were used in the construction of this program
 * All faults are mine and mine alone
 * Appears to work :-)
 */

'use strict'

var local_var = new Array();

function main(){
    var level;
    console.log('expander.js :: main()');
    var tag = document.getElementById('top');
    var str = tag.value;
    // first process all the data
    var html = md_to_html(str);
    // local vars are now available
    console.log('locals', local_var);
    if(local_var['level']){
	level = 0;
    } else {
	level = 1;
    };
    var idx = the_id();
    console.log('**** disqus_id =', idx);
    var x = {title:the_title(),data:html, level:level, disqus_id:idx};
    // console.log('**** TITLE=', the_title());
    var z = template(x);
    // console.log('z',z);
    // var n = document.createElement('div');
    // n.innerHTML = z;
    // insertAfter(n, tag);
    document.open();
    document.write(z);
    document.close();
}

function render_debug(){
    var str = t1.value;
    var lines = str.split("\n");
    console.log('lines', lines);
    var blocks = pass1(lines);
    console.table(blocks);
    // console.log("pass1 blocks=", blocks);
    blockid.innerHTML = showit(blocks);
    //document.getElementById('out').appendChild(tab);
    var forms = pass2(blocks);
    // console.log("pass2 forms=", forms);
    formid.innerHTML = showit(forms);
    //console.log("pass2 blocks=", blocks);
}

function md_to_html(str){
    var lines = str.split("\n");
    // console.log('lines', lines);
    var blocks = pass1(lines);
    // console.table(blocks);
    // console.log("pass1 blocks=", blocks);
    //document.getElementById('out').appendChild(tab);
    var forms = pass2(blocks);
    // console.log("pass2 forms=", forms);
    var html = forms_to_html1(forms);
    return html;
}
    
function render_nicely(tagId){
    var tag = document.getElementById(tagId);
    var str = tag.value;
    var lines = str.split("\n");
    console.log('lines', lines);
    var blocks = pass1(lines);
    // console.table(blocks);
    //document.getElementById('out').appendChild(tab);
    var forms = pass2(blocks);
    // console.log("pass2 forms=", forms);
    var html = forms_to_html1(forms);
    var n = document.createElement('div');
    n.innerHTML = html;
    insertAfter(n, tag);
    
    //console.log("pass2 blocks=", blocks);
}



function test(){
    // parse( "ab\n12");
    // parse( "* abc\ndef\n123");
    // parse("abc\nxyz\n* 123");
    // parse("+ abc\n  one\n  two\n\n  def\n* 123");
    parse("```\nabc\ndef\n```\n123");
}


function insertAfter(newElement,targetElement) {
    var parent = targetElement.parentNode;
    if (parent.lastChild == targetElement) {
        parent.appendChild(newElement);
    } else {
        parent.insertBefore(newElement, targetElement.nextSibling);
    }
}


function tail(x){
    return x.substring(1);
}

// pass1 isolates blocks

function pass1(line){
    // pass1 categorises each line
    // *important* always retain the entire line (unchanged)
    // because we might want to recombine it later
    // for example in a pre
    var block = new Array();
    var i=0;
    var stop, j;
    while(i < line.length){
	// console.log('block=',block);
	var ln = line[i];
	if(ln.startsWith('*')){
	    block.push({type:'header', data:ln});
	    i++;
	} else if(ln.startsWith('@var')) {
	    block.push({type:'var', data:ln});
	    i++;
	} else if(ln.startsWith('<<')) {
	    block.push({type:'anchor', data:ln});
	    i++;
	} else if(ln.startsWith('+')) {
	    block.push({type:'list', data:ln});
	    i++;
	} else if(ln.startsWith('>')) {
	    block.push({type:'blockquote', data:ln});
	    i++;
	    // test [[ *before* [
	} else if(ln.startsWith('[[')){
	    block.push({type:'string', data:ln});
	    i++ ;
	} else if(ln.startsWith('[')){
	    block.push({type:'defn', data:ln});
	    i++ ;
	} else if(ln.startsWith("<pre>")){
	    block.push({type:'prestart',data:ln});
	    i++;
	} else if(ln.startsWith("</pre>")){
	    block.push({type:'preend',data:ln});
	    i++;
	} else if(ln.startsWith("```")){
	    block.push({type:'fencetag',data:ln});
	    i++;
	} else if(ln.startsWith("@begin{")){
	    block.push({type:'blockstart',data:ln});
	    i++;
	} else if(ln.startsWith("@end{")){
	    block.push({type:'blockend',data:ln});
	    i++;
	} else if(ln.startsWith("@include{")){
	    block.push({type:'includestart',data:ln});
	    i++;
	} else if(ln.startsWith("@END")){
	    block.push({type:'includeend',data:ln});
	    i++;
	} else if(ln.startsWith("@")){
	    block.push({type:'verbatim',data:ln});
	    i++;
	} else if(ln.startsWith("    ")){
	    block.push({type:'indented',data:ln});
	    i++;
	} else if(ln == ""){
	    block.push({type:'blank', data:"\n"});
	    i++;
	} else {
	    block.push({type:'string', data:ln});
	    i++;
	};
	
    };
    return(block);
}


function pass2(b){
    var f = new Array();
    var i = 0;
    var dat;
    while(i < b.length){
	switch (b[i].type) {
	case 'anchor':
	    dat = b[i].data;
	    f.push({type:'anchor',
		    data:dat.substr(3,dat.length-4)});
	    i++;
	    break;
	case 'header':
	    // count the number of '*'s
	    var j = 0;
	    dat = b[i].data;
	    while(dat.charAt(j++) == '*');
	    f.push({type:'header', level:j-1,data:dat.substring(j-1,dat.length)});
	    i++;
	    break;
	case 'includestart':
	    // collect from the next line until we see includeend
	    var s = "";
	    i++;
	    while(i < b.length) {
		if(b[i].type == 'includeend') {
		    i++;
		    break;
		} else {
		    s += b[i].data + "\n";
		    i++;
		}
	    };
	    f.push({type:'include', data: s});
	    break;
	case 'fencetag':
	    // collect util we see fencetag
	    i++;
	    while(i < b.length) {
		if(b[i].type == 'fencetag') {
		    i++;
		    break;
		} else {
		    s += b[i].data + "\n";
		    i++;
		}
	    };
	    f.push({type:'fence', data: s});
	    break;
	case 'prestart':
	    // collect while is not preend
	    // since we can write<pre>Bla\n we have to include
	    // Bla\n in the target
	    var s = b[i].data.substring(5);
	    if(s.length>0) s += "\n";
	    i++;
	    while(i < b.length) {
		if(b[i].type == 'preend') {
		    i++;
		    break;
		} else {
		    s += b[i].data + "\n";
		    i++;
		}
	    };
	    f.push({type:'pre', data: s});
	    break;
	case 'string':
	    // collect while is string
	    var s = "";
	    while(i < b.length) {
		// console.log('aa i,b,type',[i,b[i],b[i].type]);
		if(b[i].type == 'string') {
		    s += b[i].data + " ";
		    i++;
		} else {
		    // console.log('breaking with',i);
		    break;
		};
	    };
	    // console.log('here',i,s);
	    //f.push({a:'para',txt:s});
	    f.push({type:'para', data: s});
	    break;
	case 'blockquote':
	    // blockquotes begin with ">"
	    // so we remove this and collect
	    // collect while is string
	    var s = tail(b[i].data) + "\n";
	    i++;
	    while(i < b.length) {
		if(b[i].type == 'string') {
		    s += b[i].data + " ";
		    i++;
		} else {
		    break;
		};
	    };
	    f.push({type:'blockquote', data: s});
	    break;
	case 'list':
	    // console.log('collect list');
	case 'defn': 
	    // the lines that follow a list
	    // are strings (indented by 2 or more spaces) and blank lines
	    if(is_multiline_continuation(b, i)){
		var s = "";
		var j = i;
		i++;
		while(i < b.length){
		    if(b[i].type == 'blank') {
			s += '<br><br>';
			i++;
		    } else if(b[i].type == 'string' &&
			      b[i].data.substring(0,2) == "  "){
			s += " "  + b[i].data;
			i++;
		    } else {
			break;
		    };
		};
		// if the argument is defn when trim the
		// input
		var arg = b[j].data;
		if(b[j].type == "defn"){
		    // [XXXX]... extract the XXX part the trailing ]...
		    arg = arg.match(/\[(.*)\].*/)[1];
		};
		f.push({type:b[j].type, data:arg, extra:s});
	    } else {
		// this is *not* a multiline just a single line
		f.push({type:b[i].type, data:b[i].data, extra:""});
		i++;
	    }
	    break;
	case 'indented':
	    // collect data while indented or blank
	    var s = b[i].data + '\n';
	    i++;
	    var lastadded;
	    while(i < b.length){
		if(b[i].type == 'blank') {
		    s += '\n';
		    lastadded = 'blank';
		    i++;
		} else if(b[i].type == 'indented'){
		    s += b[i].data + "\n";
		    lastadded = 'indented';
		    i++;
		} else {
		    break;
		};
	    };
	    if(lastadded == 'blank'){
		// remove the last \n
		s = s.substring(0, s.length-1);
	    };
	    f.push({type:'pre', data:s});
	    break;
	case 'blank':
	    i++;
	    break;
	case 'var':
	    // @var varname = "..."
	    var m = b[i].data.match(/@var\s*([a-z_]*)\s*=\s*"(.*)"/);
	    if(m)local_var[m[1]] = m[2];
	    i++;
	    break;
	default:
	    console.log('oops', b[i]);
	    i++;
	    break;
	};
    };
    return f;
}

function is_multiline_continuation(b, i){
    if(i >= b.length -1)return false;
    if(b[i+1].data.substr(0,2) == "  ")return true
    return false;
}
    
function showit(data){
    var s="<table border='1'>"; 
    for(var i = 0; i < data.length; i++) {
	var o = data[i];
	var keys = Object.keys(o);
	s += "<tr>";
	for(var j=0; j<keys.length;j++){
	    var key = keys[j];
	    var val = o[key];
	    // val + ' ' forces the value to be a string :-)
	    s += "<td>" + key + " = " + quote(val+' ') + "</td>";
	};
	s += "</tr>"
    };
    s += "</table>";
    return(s);
}

function quote(str){
    var x = "";
    for(var i=0;i<str.length;i++){
	if(str[i] == '<'){
	    x += "&lt;";
	} else {
	    x += str[i];
	};
    };
    return x;
}

function forms_to_html1(forms){
    var s = "";
    for(var i =0; i< forms.length; i++){
	switch(forms[i].type){
	case 'anchor':
	    s += "<a name='" + forms[i].data + "'></a>\n";
	    break;
	case 'include':
	    // easy :-)
	    s += forms[i].data;
	    break;
	case 'header':
	    var h = "h" + forms[i].level;
	    s += "<" + h + ">" + forms[i].data + "</" + h + ">";
	    break;
	case 'para':
	    console.log('para str=',forms[i].data);
	    console.log('para expanded=',expand_inlines(forms[i].data));
	    
	    s += "<p class='para'>" +
		expand_inlines(forms[i].data) + "</p>";
	    break;
	case 'pre':
	    s += "<pre class='my'>" + quote(forms[i].data) + "</pre>";
	    break;
	case 'blockquote':
	    s += "<blockquote>" + expand_inlines(forms[i].data) + "</blockquote>\n";
	    break;
	case 'list':
	    var str = tail(forms[i].data) + forms[i].extra;
	    s += "<li class='my'>" + expand_inlines(str) + "</li>";
	    break;
	case 'defn':
	    s += "<dt>" + forms[i].data + "</dt>" +
		"<dd>" + expand_inlines(forms[i].extra) + "</dd>\n";
	    break;
	case 'verbatim':
	    s += tail(forms[i].data);
	    break;
	default:
	    s += "<pre>Bad Tag<br>" + forms[i].type + "</pre>";
	}
    };
    return s;
}

function the_id(){
    var u = window.location.pathname;
    var filename = u.substring(u.lastIndexOf('/'));
    return filename;
}

function the_title(){
    if(local_var['title']){
	console.log('TITLE','=',local_var['title']);
	return local_var['title'];
    } else {
	var u = window.location.pathname;
	var filename = u.substring(u.lastIndexOf('/')+1);
	// A filename like 2016-08-08-Draft-Payment-System-in-Erlang.html
	// is transformed into
	// Draft Payment System in Erlang 
	var t1 = filename.substring(11);
	var t2 = t1.slice(0,-5);
	var t3 = t2.replace(/-/g, " ");
	console.log('TITLE','=',t3);
	return t3;
    }
}

// Umm this means we can't have _ *inside a URL*
// <li><a href="...">

function expand_inlines(s) {
    s = s.replace(/``/g, "&ldquo;");
    s = s.replace(/''/g, "&rdquo;");
    s = s.replace(/--/g, "&ndash;");
    s = expand_inline(s, "`", "<span class='code'>", "</span>");
    s = expand_inline(s, "__", "<span class='yellow'>", "</span>");
    s = expand_inline(s, "**", "<i>", "</i>");
    s = expand_links(s);
    // do strike last
    s = expand_inline(s, "~~", "<strike>", "</strike>");
    return(s);
}

// expand the inline "term"
//   replace s1 term XXX term s2 
//        by s1 wrapstart XXX wrapend s2
// used to expand things like ~~
// for example
//    expand_inline(s, "~~", "<strike>", "</strike>")

function expand_inline(s, term, wrapstart, wrapstop) {
    var n = term.length;
    var start,stop,mid;
    while(true){
	start = s.indexOf(term);
	if(start == -1)return s;
	stop = s.indexOf(term, start+n);
	if(stop == -1)return s;
	var s1 = s.substring(0, start);
	var mid = s.substring(start+n, stop);
	var s2 = s.substring(stop+n, s.length);
	s = s1 + wrapstart + mid + wrapstop + s2;
    }
}

// expands ...[[....|.....]] or
//         ...[[..........]]

function expand_links(s) {
    var start, stop, mid, linksep, link;
    // [[Link][Text]]
    // or [[Link]]
    while(true){
	start = s.indexOf("[[");
	if(start == -1)return s;
	stop = s.indexOf("]]", start+2);
	if(stop == -1)return s;
	var s1 = s.substring(0, start);
	var mid = s.substring(start+2, stop);
        var s2 = s.substring(stop+2, s.length);
	// mid might be in two segments
	// console.log('mid=',mid);
	linksep = mid.indexOf("][");
	if (linksep == -1) {
	    // there is only segment
	    link =  "<a href='"+ mid + "'>" + mid + "</a>";
	    s = s1 + link + s2;
	} else {
	    // two parts
	    var ref = mid.substring(0, linksep);
	    var txt = mid.substring(linksep+2, mid.length);
	    // console.log('ref',ref,'text',txt);
	    link = "<a href='" + ref + "'>" + txt + "</a>"; 
	    // alert("a="+a+"b="+b+"link2="+link);
	    s = s1 + link + s2;
	}
    }
}

main();
