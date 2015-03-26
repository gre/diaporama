
# Diaporama by Examples

## Fullscreen with controls example

**index.js:**
```javascript
var Diaporama = require("diaporama");

document.body.style.background = "#000";
document.body.style.margin = "0";
document.body.style.overflow = "hidden";

var div = document.createElement("div");
div.style.width = window.innerWidth + "px";
div.style.height = window.innerHeight + "px";
document.body.appendChild(div);

var diaporama = Diaporama(div, {
  GlslTransitions: require("glsl-transitions"),
  data: require("./diaporama.json"),
  autoplay: true,
  loop: true
});

var threshold = 1024 * 512;

function resize () {
  var w = window.innerWidth;
  var h = window.innerHeight;
  diaporama.width = w;
  diaporama.height = h;
  diaporama.resolution = Math.min(window.devicePixelRatio||1, Math.ceil((threshold) / (w * h))); // heuristic to degrade the quality for higher resolution
}

window.addEventListener("resize", resize);
resize();

document.body.addEventListener("keydown", function (e) {
  switch (e.which) {
    case 38: // Up
      diaporama.playbackRate *= 1.5;
      break;
    case 40: // Down
      diaporama.playbackRate /= 1.5;
      break;
    case 37: // Left
      diaporama.prev();
      break;
    case 39: // Right
      diaporama.next();
      break;
    case 32: // Space
      diaporama.paused = !diaporama.paused;
      break;
  }
});
```
