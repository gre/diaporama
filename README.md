Diaporama
=========
Diaporama is an image slideshow engine providing high quality animation effects including [Kenburns](http://github.com/gre/kenburns) effect and [GLSL Transitions](https://github.com/glslio/glsl-transition).

You can easily generate a new diaporama using [`diaporama-maker`](https://github.com/gre/diaporama-maker).

Key features
------------

- **Minimal and unopinionated library**. *Diaporama* focuses on rendering the slideshow. Up to you to hook it to any event (window resize, touch events, keyboard,...) based on your needs.
- **Responsive**: *Diaporama* works with any resolution and any ratio. The original image ratios are always preserved (crop to fit).
- **Simple API**. the Diaporama API mimic the HTML5 Video API for a better learning curve. You can set some properties and the library will always be in sync with your changes (and update efficiently with the minimal changes). This also make it easy when using with a Virtual DOM library. See also [`diaporama-react`](http://github.com/glslio/diaporama-react).
- **Kenburns effect** on images with configurable animation from/to and easing function.
- Customizable **transition effects** using GLSL Transitions created on [GLSL.io](https://glsl.io/) (or your own)
- **Works everywhere**. *Diaporama* is implemented with WebGL (hardware accelerated) but also have DOM fallback.
- The slideshow is described in a JSON format.
- **Retina-ready**. By default, the library use `devicePixelRatio` as canvas resolution. N.B.: This has a cost in term of performance, so if you want you can just give `1`. You can also responsively adapt it based on the canvas area.

Install
=======

Use with Browserify:
```javascript
npm install --save diaporama
```

As a standalone library:

**[Coming soon...]**


API overview
===

```javascript
var diaporama = Diaporama(container, data, opts)
```

- In first parameter, you must provide an (empty) DOM element `container` in which the Diaporama will be created.
- The second parameter is the `data` description of the diaporama (you might have stored it in a `diaporama.json`), The format is described in [JSON Description Format](#json-description-format).

- The third parameter are the initial properties of the Diaporama. (`data` can also be passed in this object – in that case you can use the second parameter).

*Diaporama* makes heavy uses of JavaScript's `defineProperty` for a better experience:
you can get a property or set a value in it and the diaporama will nicely be synchronized.

Here are the properties: `loop` (boolean), `autoplay` (boolean), `data` (object), `width` (number in pixels), `height` (number in pixels), `resolution` (number), `currentTime` (number in milliseconds), `playbackRate` (number), `paused` (boolean), `duration` (number in milliseconds, read-only), `renderingMode` (read-only).

There is also helper methods (they are basically also setting some properties): `play()`, `pause()`, `next()`, `prev()`, `jump(slideIndex)`.

For more detail on each properties and methods. See [Diaporama Properties](#diaporama-properties) section.

Diaporama also have events that let you watch and react on some changes. The `diaporama` object is an EventEmitter so it haves the same API: `on`, `once`, `removeListener`,...  See [Events](#events) section.


JSON Description Format
===========
...


Slide Image Element
-------------------

Transition Object
-----------------

[Experimental] Canvas 2D Drawing
-----------------

Transitions
-----------

Diaporama Properties
====================
...

Events
======
...

Diaporama by example
====================
...
