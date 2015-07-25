![](https://cloud.githubusercontent.com/assets/211411/7667405/7e5c14f0-fc06-11e4-8a96-8b3297728e28.png) Diaporama
=========
Diaporama is an image slideshow engine providing high quality animation effects including [Kenburns](http://github.com/gre/kenburns) effect and [GLSL Transitions](https://github.com/glslio/glsl-transition).

[![](https://nodei.co/npm/diaporama.png)](http://npmjs.org/package/diaporama)

Related Projects
---------------

- **[`diaporama-maker`](http://github.com/gre/diaporama-maker): application to create Diaporama slideshows.**
- [`diaporama-react`](http://github.com/glslio/diaporama-react): Use React with Diaporama.
- [`kenburns`](http://github.com/gre/kenburns): KenBurns effect for the Web.
- [`glsl-transition`](https://github.com/glslio/glsl-transition): Perform a GLSL Transition.
- [`slide2d`](https://github.com/gre/slide2d): Express vectorial content in JSON using canvas2d directives.

Examples
--------

- [http://greweb.me/diaporama-example1/](http://greweb.me/diaporama-example1/)
- [http://greweb.me/diaporama-example2/](http://greweb.me/diaporama-example2/)
- [http://greweb.me/gl-slideshow-example/](http://greweb.me/gl-slideshow-example/)


Diaporama Key features
------------

- **Minimal and unopinionated library**. *Diaporama* focuses on rendering the slideshow. Up to you to hook it to any event (window resize, touch events, keyboard,...) based on your needs.
- **Responsive**: *Diaporama* works with any resolution and any ratio. The original image ratios are always preserved (crop to fit).
- **Simple [API](docs/api.md)**. the Diaporama API mimic the HTML5 Video API for a better learning curve. You can set some [Properties](docs/props.md) and the library will always be in sync with your changes (and update efficiently with the minimal changes). There is also [Events](docs/events.md).
- [Easily interoperable with Virtual DOM library](docs/vdom.md).
- **[Kenburns](https://github.com/gre/kenburns) effect** on images with configurable animation from/to and easing function.
- Customizable **transition effects** using GLSL Transitions created on [GLSL.io](http://transitions.glsl.io/) (or your own)
- **Works everywhere**. *Diaporama* is implemented with WebGL (hardware accelerated) but also have DOM fallback (slower).
- The slideshow is described in a [JSON format](docs/format.md).
- **Retina-ready**. By default, the library use `devicePixelRatio` as canvas resolution. N.B.: This has a cost in term of performance, so if you want you can just give `1`. You can also responsively adapt it based on the canvas area.

Gitbooks Full Documentation
------------

[**http://gre.gitbooks.io/diaporama/content/**](http://gre.gitbooks.io/diaporama/content/)
