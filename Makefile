LESSC=lessc
LESSOPT=

JSMINC=yuicompressor
JSMINOPT=

all: clean _demo demo/slider.js demo/demo.min.css demo/slider.min.css lib/slider.min.css lib/slider.min.js

_demo: demo/slider.js
	cd demo && make;

demo/slider.js: slider.js
	cp $< $@

demo/slider.min.css: lib/slider.min.css
	cp $< $@

%.min.css: %.less
	${LESSC} ${LESSOPT} $< -o $@

lib/%.min.css: %.less
	${LESSC} ${LESSOPT} $< -o $@

lib/%.min.js: %.js
	${JSMINC} ${JSMINOPT} $< -o $@

demo/demo.min.css: demo/demo.less
lib/slider.min.css: slider.less
lib/slider.min.js: slider.js

VERSION=1.0
ZNAME=sliderjs-${VERSION}

zip: lib/slider.min.js lib/slider.min.css
	rm -rf ${ZNAME}/ ${ZNAME}.zip
	cp -R lib/ ${ZNAME}
	zip -r ${ZNAME}.zip ${ZNAME}
	rm -rf ${ZNAME}

clean: 
	rm -rf demo/docs/ demo/slider.js demo/demo.min.css demo/slider.min.css lib/slider.min.css lib/slider.min.js
