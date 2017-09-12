.SUFFIXES: .erl .beam .yrl

MODS := $(wildcard *.erl)

%.beam: %.erl
	erlc -W $<

all:
	cd src; ./make_index.esh

test: beams

beams: ${MODS:%.erl=%.beam}

clean:
	rm -rf *.beam
