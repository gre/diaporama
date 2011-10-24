VERSION=1.1-beta

LESSC=lessc
LESSOPT=-x

COFFEEC=coffee
COFFEEOPT=-c

JSMINC=yuicompressor
JSMINOPT=

all: _demo demo/slider.js demo/demo.min.css demo/slider.min.css lib/slider.min.css lib/slider.min.js 

_demo: demo/slider.js demo/fetchFlickr.js
	cd demo && make;

demo/slider.js: lib/slider.js
	cp $< $@

demo/slider.min.css: lib/slider.min.css
	cp $< $@

%.min.css: %.less
	${LESSC} ${LESSOPT} $< -o $@

lib/%.min.css: %.less
	${LESSC} ${LESSOPT} $< -o $@

lib/%.js: %.coffee
	${COFFEEC}  -o $@/.. ${COFFEEOPT} $<

lib/%.min.js: lib/%.js
	${JSMINC} ${JSMINOPT} $< -o $@

demo/demo.min.css: demo/demo.less
lib/slider.min.css: slider.less
lib/slider.js: slider.coffee
lib/slider.min.js: lib/slider.js

ZNAME=sliderjs-${VERSION}

zip: lib/slider.min.js lib/slider.min.css
	rm -rf ${ZNAME}/ ${ZNAME}.zip
	cp -R lib/ ${ZNAME}
	cp demo/load*.gif ${ZNAME}
	zip -r ${ZNAME}.zip ${ZNAME}
	rm -rf ${ZNAME}

clean: 
	rm -rf demo/docs/ demo/slider.js demo/demo.min.css demo/slider.min.css lib/slider.min.css lib/slider.min.js lib/slider.js
