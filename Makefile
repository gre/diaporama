LESSC=lessc
LESSOPT=

JSMINC=yuicompressor
JSMINOPT=

all: clean _demo demo/slider.js demo/demo.css demo/slider.css lib/slider.min.css lib/slider.min.js

_demo: demo/slider.js
	cd demo && make;

demo/slider.js: slider.js
	cp slider.js demo/slider.js
demo/slider.css: lib/slider.min.css
	cp lib/slider.min.css demo/slider.css

lib/%.min.css: %.less
	${LESSC} ${LESSOPT} $< -o $@

%.css: %.less
	${LESSC} ${LESSOPT} $< -o $@

lib/%.min.js: %.js
	${JSMINC} ${JSMINOPT} $< -o $@

demo/demo.css: demo/demo.less
lib/slider.min.css: slider.less
lib/slider.min.js: slider.js


VERSION=1.0
ZNAME=sliderjs-${VERSION}

zip: lib/slider.js lib/slider.css
	rm -rf ${ZNAME}/ ${ZNAME}.zip
	cp -R lib/ ${ZNAME}
	zip -r ${ZNAME}.zip ${ZNAME}
	rm -rf ${ZNAME}

clean: 
	rm -rf demo/docs/ demo/slider.js demo/demo.css demo/slider.css lib/slider.min.css lib/slider.min.js
