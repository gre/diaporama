JSDOCC=docco
JSDOCOPT=

all: docs/slider.html docs/fetchFlickr.html

docs/slider.html: slider.js
	${JSDOCC} ${JSDOCOPT} $<

docs/fetchFlickr.html: fetchFlickr.js
	${JSDOCC} ${JSDOCOPT} $<
