LESSC=lessc
LESSOPT=

JSMINC=yuicompressor
JSMINOPT=

all: clean _demo demo/slider.css demo/slider.js demo/demo.css demo/slider.css lib/slider.css lib/slider.js

_demo: demo/slider.js
	cd demo && make;

demo/slider.js: slider.js
	cp slider.js demo/slider.js

demo/demo.css: demo/demo.less
	${LESSC} ${LESSOPT} $< -o $@

demo/slider.css: lib/slider.css
	cp lib/slider.css demo/slider.css

lib/slider.css: slider.less
	${LESSC} ${LESSOPT} $< -o $@

lib/slider.js: slider.js
	${JSMINC} ${JSMINOPT} $< -o $@


VERSION=1.0
ZNAME=sliderjs-${VERSION}

zip: lib/slider.js lib/slider.css
	rm -rf ${ZNAME}/ ${ZNAME}.zip
	cp -R lib/ ${ZNAME}
	zip -r ${ZNAME}.zip ${ZNAME}
	rm -rf ${ZNAME}

clean: 
	rm -rf demo/docs demo/slider.css demo/slider.js demo/demo.css demo/slider.css lib/slider.css lib/slider.js
