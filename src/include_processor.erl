-module(include_processor).

-export([do_includes/1]).

do_includes(F) ->
    {ok, Bin} = file:read_file(F),
    S = binary_to_list(Bin),
    L = parse(S),
    %% io:format("L=~p~n",[L]),
    L1 = [do_include(I) || I <- L],
    {Flags, L2} = lists:unzip(L1),
    case lists:member(true, Flags) of
	true ->
	    rebuild_file(F, L2);
	false ->
	    %% io:format("Unchanged~p~n",[F]),
	    void
	    
    end.

rebuild_file(F, L) ->
    F1 = filename:rootname(F) ++ ".html",
    L1 = [build_part(I) || I<- L],
    ok = file:write_file(F1, L1),
    io:format("Inclusions made to: ~p~n",[F1]),
    true.

build_part({raw,X}) -> X;
build_part({include,Tag,Content}) -> 
    ["\n@include{",Tag,"} DO NOT EDIT BELOW\n",
     Content,
     "@END\n"].

do_include({raw,_}=X) -> {false, X};
do_include({include,Cmd,Old}=X) -> 
    New = get_data(Cmd),
    case New of
	Old -> {false, X}; 
	_   -> 
	    %% io:format("Changed~nOld:~n~p~nNew:~n~p~n",[Old,New]),
	    {true,{include,Cmd,New}}
    end.

quote(S) ->
    elib2_misc:string2html(S).

get_data(Cmd) ->
    case erl_scan:string(Cmd) of
	{ok,[{atom,_,file},
	     {'=',_},
	     {string,_,File}],_} ->
	    include_file(File);
	{ok,[{atom,_,file},
	     {'=',_},
	     {string,_,File},
	     {',',_},
	     {atom,_,section},
	     {'=',_},
	     {string,_,Section}],_} ->
	    include_section(File, Section);
	{ok,[{atom,_,file},
	     {'=',_},
	     {string,_,File},
	     {',',_},
	     {atom,_,function},
	     {'=',_},
	     {string,_,Func},
	     {',',_},
	     {atom,_,arity},
	     {'=',_},
	     {integer,_,Arity}
	    ],_} ->
	    include_function(File, Func, Arity);
	Other ->
	    io:format("Bad command in include statement:~p~n",[Other]),
	    exit(ooo)
    end.

parse(S) ->
    parse(S, []).

%% Filled in includes look like this:
%%  @include{text}
%%  ... text
%%  @END

%% If the include is not filled in we will
%% reach EOF or another @include{...} directive


parse([], L) ->
    lists:reverse(L);
parse("\n@include{" ++ T, L) ->
    {Cmd, T1}  = collect_command(T, []),
    {Body, T2} = collect_body(Cmd, T1),
    parse(T2,[{include,Cmd,list_to_binary(Body)}|L]);
parse(T, L) ->
    {X, T1} = collect_raw(T, []),
    parse(T1, [{raw,X}|L]).

collect_command("}" ++ T, L) -> {lists:reverse(L), skip_past_eol(T)};
collect_command([H|T], L)    -> collect_command(T, [H|L]).

skip_past_eol([$\n|T]) -> T;
skip_past_eol([_|T])   -> skip_past_eol(T); 
skip_past_eol([])      -> [].

collect_body(Cmd, L) ->
    case collect_body1(L, []) of
	none  ->
	    io:format("No content assumed for:~p~n",[Cmd]),
	    {"none", L};
	Other -> Other
    end.

collect_body1([], _)                     -> none;
collect_body1("\n@include{" ++ _, _) -> none;
collect_body1("\n@END\n" ++ T, L)        -> {lists:reverse([$\n|L]), T};
collect_body1([H|T], L)                  -> collect_body1(T, [H|L]).

collect_raw([], L)                     -> {lists:reverse(L), []};
collect_raw("\n@include{" ++ _ = T, L) -> {lists:reverse(L), T};
collect_raw([H|T], L)                  -> collect_raw(T, [H|L]).

include_file(File) ->
    case file:read_file(File) of
	{ok, Bin} ->
	    L = quote(binary_to_list(Bin)),
	    iolist_to_binary(["<pre>\n",L, "</pre>\n"]);
	{error,_} ->
	    exit({fatal,cannot,include,File})
    end.

include_section(File, Tag) ->
    io:format("including file:~p Section:~p~n",[File, Tag]),
    L1 = elib2_misc:get_erl_section(File, Tag), %% string ..
    %% io:format("L1=~p~n",[L1]),
    L2 = quote(L1),
    iolist_to_binary(["<div class='erlang'>\n",L2, "</div>\n"]).

%% START:include_function
include_function(ErlFile, Func, Arity) ->
    Name = list_to_atom(Func),
    io:format("including file:~p Func:~p/~p~n",[ErlFile, Name, Arity]),
    L = segmenting:segment(ErlFile),
    case lists:keysearch({function,{Name,Arity}}, 1, L) of
	{value, {_, L1}} ->
	    L2 = [erl_toks_to_html(I) || I <- L1], 
	    B2 = iolist_to_binary(L2),
	    L3 = quote(binary_to_list(B2)),
	    iolist_to_binary(["<div class='erlang'>\n", 
			      L3,
			      "</div>\n"]);
	false ->
	    L1 = [Z || {{function,Z},_} <- L],
	    exit({missing_function, ErlFile, Name, Arity, found, L1})
    end.
%% END:include_function

erl_toks_to_html({_Tag,Val}) ->
    Val.

