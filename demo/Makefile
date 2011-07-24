JSDOCC=docco
JSDOCOPT=

all: docs/slider.html docs/fetchFlickr.html

docs/%.html: %.js
	${JSDOCC} ${JSDOCOPT} $<

docs/slider.html: slider.js
docs/fetchFlickr.html: fetchFlickr.js
