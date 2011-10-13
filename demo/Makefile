JSDOCC=docco
JSDOCOPT=

all: docs/slider.html docs/fetchFlickr.html

docs/fetchFlickr.html: fetchFlickr.js
	${JSDOCC} ${JSDOCOPT} $<

docs/%.html: ../%.coffee
	${JSDOCC} ${JSDOCOPT} $<

docs/slider.html: slider.js
docs/fetchFlickr.html: fetchFlickr.js
