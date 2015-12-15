![](https://cloud.githubusercontent.com/assets/211411/7667405/7e5c14f0-fc06-11e4-8a96-8b3297728e28.png) Diaporama
=========
Diaporama is an image/video/content slideshow engine providing high quality animation effects including [Kenburns](https://github.com/gre/kenburns) effect and [GLSL Transitions](https://github.com/gre/glsl-transition).

[![](https://nodei.co/npm/diaporama.png)](https://www.npmjs.com/package/diaporama)

**[-> DEMO <-](http://greweb.me/diaporama/)**

Related Projects
---------------

- **[`diaporama-maker`](https://github.com/gre/diaporama-maker): application to create Diaporama slideshows.**
- [`diaporama-react`](https://github.com/glslio/diaporama-react): Use React with Diaporama.
- [`kenburns`](http://github.com/gre/kenburns): KenBurns effect for the Web.
- [`glsl-transition`](https://github.com/glslio/glsl-transition): Perform a GLSL Transition.
- [`slide2d`](https://github.com/gre/slide2d): Express vectorial content in JSON using canvas2d directives.


Diaporama Key features
------------

- **Minimal and unopinionated library**. *Diaporama* focuses on rendering the slideshow. Up to you to hook it to any event (window resize, touch events, keyboard,...) based on your needs.
- **Responsive**: *Diaporama* works with any resolution and any ratio. The original image ratios are always preserved (crop to fit).
- **Simple [API](docs/api.md)**. the Diaporama API mimic the HTML5 Video API for a better learning curve. You can set some [Properties](docs/props.md) and the library will always be in sync with your changes (and update efficiently with the minimal changes). There is also [Events](docs/events.md).
- [Easily interoperable with Virtual DOM library](docs/vdom.md).
- **Videos** support. allowing to define multiple video formats and image fallback.
- **[Kenburns](https://github.com/gre/kenburns) effect** on images with configurable animation from/to and easing function.
- Customizable **transition effects** using GLSL Transitions created on [GLSL.io](http://transitions.glsl.io/) (or your own)
- **Works everywhere**. *Diaporama* is implemented with WebGL (hardware accelerated) but also have DOM fallback.
- The slideshow is described in a [JSON format](docs/format.md).
- **Retina-ready**. By default, the library use `devicePixelRatio` as canvas resolution. N.B.: This has a cost in term of performance, so if you want you can just give `1`. You can also responsively adapt it based on the canvas area.
- **Texts, Images and Shapes** support – using [slide2d](https://github.com/gre/slide2d) which exposes everything Canvas can do.

Gitbooks Full Documentation
------------

[**https://gre.gitbooks.io/diaporama/content/**](https://gre.gitbooks.io/diaporama/content/)


Current state of browser support
-----------

Diaporama should be widely supported by browsers (desktop and mobile). If WebGL is not supported by the browser/hardware, it fallbacks properly to DOM implementation (an opacity transition is used).

Here are the current browsers I've been testing on

- Firefox (Mac, Linux)
- Chrome (Mac, Chromium Linux, Windows)
- Safari (Mac)
- IE 11
- iOS Safari
- Android Chrome
  - Support for Videos is broken (will display black): `<video>` drawing in Android Chrome is broken: https://code.google.com/p/chromium/issues/detail?id=174642
