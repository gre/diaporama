Getting Started
===============

There are two ways to create a diaporama:
- The recommended way: use `diaporama-maker`, a graphical slideshow editor.
- The programmer way: write your own `diaporama.json` (see [JSON Format](docs/format.md)).

## Using Diaporama Maker

The simplest way to create a diaporama is to use the Diaporama Maker.
`diaporama-maker` is an WYSIWYG editor that creates your `diaporama.json` without
having to write a single line of it. You can also generate a complete *ZIP Archive*
that contains the diaporama ready to be deployed (The archive includes an `index.html` file that runs the diaporama in fullscreen).

![](https://camo.githubusercontent.com/24978a582c5230b1f033a7565d8942053999535d/687474703a2f2f692e696d6775722e636f6d2f4f45594d526a782e6a7067)

### Install Diaporama Maker

```javascript
npm install --save diaporama-maker
```

You can then start it using
```
diaporama folder_with_photos
```

## Use Diaporama programmatically

If the ZIP Archive created by Diaporama Maker isn't enough for you,
you can run a Diaporama programmatically.

### NPM

You can install `diaporama` as a NPM dependency (to use with Browserify / ...):
```
npm install --save diaporama
```

You can import Diaporama using:
```javascript
var Diaporama = require("diaporama");
```

### Standalone build

You can also download the library using the standalone build. (JavaScript file containing the library)

[Download HEAD build](https://raw.githubusercontent.com/gre/diaporama/master/dist/build.min.js)

You can now uses Diaporama which is in
```
window.Diaporama
```


**To learn how to use `Diaporama` programmatically, jump to [API Overview](api.md) section.**
