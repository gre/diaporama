
Diaporama
=========

Diaporama is an image slideshow engine providing high quality animation effects including Kenburns effect and GLSL Transitions.


Key features
------------

- Minimal library. Not opininated. Up to you to connect to any event (window resize, touch events, keyboard,...) based on your needs.
- Responsive: works with any resolution and any ratio.
- the Diaporama API mimic the HTML5 Video API for a better learning curve.
- Kenburns effect on images with configurable animation from/to and easing function.
- configurable transition effects using GLSL Transitions created on GLSL.io (or your own)
- Change the diaporama properties at any time, the diaporama handle it nicely and efficiently with minimal changes. This also makes the library working great with Virtual DOM.
- WebGL library with DOM fallback (FIXME: not implemented yet)
- The slideshow is described in a JSON format.

Install
=======

Using Browserify:
```javascript
npm install --save diaporama
```

As a standalone library:

**Coming soon...**


API
===

```javascript
var diaporama = Diaporama(container, data, opts)
```

- In first parameter, you must provide an (empty) DOM element `container` in which the Diaporama will be created.
- The second parameter is the `data` description of the diaporama (you might have stored it in a `diaporama.json`), See JSON format Section for more info.
- The third parameter are the initial properties of the Diaporama. (`data` can also be passed in this object – in that case you can use the second parameter).


Diaporama Properties
----------

Diaporama make heavy uses of JavaScript's `defineProperty` for a better experience:
you can just get some property and set some values and the diaporama will nicely be synchronized.

Here are the properties: `loop`, `autoplay`, `data`, `width`, `height`, `resolution`, `currentTime`, `playbackRate`, `paused`, `duration`.

There is also helper methods (they are basically also setting some properties): `play()`, `pause()`, `next()`, `prev()`, `jump(slideIndex)`.

...

Events
------

Diaporama also have events that let you watch and react on some changes. The `diaporama` object is an EventEmitter so it haves the same API: `on`, `once`, `removeListener`,...


...

JSON Format
-----------

...


Diaporama by example
--------------------
