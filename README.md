Diaporama
=========
Diaporama is an image slideshow engine providing high quality animation effects including [Kenburns](http://github.com/gre/kenburns) effect and [GLSL Transitions](https://github.com/glslio/glsl-transition).

```
npm install diaporama
```

Diaporama Key features
------------

- **Minimal and unopinionated library**. *Diaporama* focuses on rendering the slideshow. Up to you to hook it to any event (window resize, touch events, keyboard,...) based on your needs.
- **Responsive**: *Diaporama* works with any resolution and any ratio. The original image ratios are always preserved (crop to fit).
- **Simple [API](docs/api.md)**. the Diaporama API mimic the HTML5 Video API for a better learning curve. You can set some properties and the library will always be in sync with your changes (and update efficiently with the minimal changes). This also make it easy when using with a Virtual DOM library. See also [`diaporama-react`](http://github.com/glslio/diaporama-react).
- **[Kenburns](https://github.com/gre/kenburns) effect** on images with configurable animation from/to and easing function.
- Customizable **transition effects** using GLSL Transitions created on [GLSL.io](https://glsl.io/) (or your own)
- **Works everywhere**. *Diaporama* is implemented with WebGL (hardware accelerated) but also have DOM fallback (slower).
- The slideshow is described in a [JSON format](docs/format.md).
- **Retina-ready**. By default, the library use `devicePixelRatio` as canvas resolution. N.B.: This has a cost in term of performance, so if you want you can just give `1`. You can also responsively adapt it based on the canvas area.

Gitbooks Full Documentation
------------

[**http://gre.gitbooks.io/diaporama/content/**](http://gre.gitbooks.io/diaporama/content/)
