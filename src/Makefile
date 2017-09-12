.SUFFIXES: .erl .beam .yrl

MODS := $(wildcard *.erl)

%.beam: %.erl
	erlc -W $<

test: beams

beams: ${MODS:%.erl=%.beam}

clean:
	rm -rf *.beam
