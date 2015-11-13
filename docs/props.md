Diaporama Properties
====================

Every properties can be passed at instanciation time, properties then get attached to the instance. **Properties reflect the Diaporama current state.**

At any time you can **get** AND **set** these properties.
This is the main way to interact with a Diaporama. It makes the API very simple to use.

The Diaporama consistency is guaranteed when you set properties *(thanks to JavaScript's `defineProperties`)*.
However, the value **is not guaranteed** to be instantly changed: for performance reasons, most of property changes are scheduled to the next rendering frame.


### `loop` (boolean)

This property defines the need to loop the diaporama. If set to true, the diaporama is looping.
Looping means that when the diaporama reaches the last slide,
it will not *"end"* but will continue by starting again the diaporama from the first slide.

### `autoplay` (boolean)

This property, if true, means that the diaporama will starts as soon as possible.
It watches the `canplaythrough` events in order to start the diaporama when it is likely
to have enough images loaded to play the diaporama without pauses.

### `data` (object)

This property reflects the Diaporama Data, object described by the [JSON Diaporama Format](./format.md).

### `width` (number in pixels)

This property reflects the current `width` of the Diaporama.

Diaporama width can dynamically changes.

### `height` (number in pixels)

This property reflects the current `height` of the Diaporama.

Diaporama height can dynamically changes.

### `resolution` (number)

This property defines the *device pixel ratio*.
By default it is set to `window.devicePixelRatio` (recommended).
On Retina devices, `devicePixelRatio` is `2.0`.

A more advanced usage is to degrade the `resolution` when the `width * height` area is important.

**Advanced Usage Example:**
```javascript
var threshold = 1024 * 512;
window.addEventListener("resize", function resize () {
  var w = window.innerWidth;
  var h = window.innerHeight;
  diaporama.width = w;
  diaporama.height = h;
  // heuristic to degrade the quality for high resolutions
  diaporama.resolution = Math.min(window.devicePixelRatio||1, Math.ceil((threshold) / (w * h)));
});
```

### `currentTime` (number in milliseconds)

This property exposes the current time of the diaporama **in milliseconds**.
A diaporama has a static timelapse defined by the `timeline` field of the format.
Setting the currentTime to a same time will always result to the same rendering.

When the diaporama is running, the currentTime is constantly updated.

Setting the currentTime makes the diaporama jump to a specific time position – like in a Video.

### `slide` (number)

The current timeline slide index of the diaporama.
Setting the value will cause the Diaporama to jump in time, but only if the slide changes.

### `playbackRate` (number)

This property defines the speed at which the diaporama is played.
By default, speed is `1.0` which is the normal speed
(duration=1000 will be one second of real time).

- With a speed < 1.0, the diaporama runs slower.
- With a speed > 1.0, the diaporama runs faster.

### `paused` (boolean)

This property is `true` when the diaporama is running, `false` otherwise.
Setting it will play or pause the diaporama (or do nothing if it doesn't change).

### `duration` (number in milliseconds, read-only)

This property is **read-only**. You cannot set it.

It gives you the current duration of the diaporama **in milliseconds**.

### `renderingMode` (read-only)

This property can **ONLY** be set once at instantiation.

It defines the preferred rendering mode to use.
`webgl` is used by default and is the recommanded mode.
`dom` can also be defined to force the DOM rendering.
However keep in mind that DOM rendering is designed to be a fallback to make
diaporama works everywhere. It doesn't (and can't) implement all diaporama features
(transitions are all fallback to a simple fade transition).

### `networkTimeout` (number in milliseconds)

This property can **ONLY** be set once at instantiation.

Define the maximum time in milliseconds to wait for loading each resource (images, videos).

### `currentRenderState` (read-only)

Represents the current rendering state (does the rendering succeed or awaiting some resource to load).
It can be one of following value:

`Diaporama.RENDER_EMPTY`: no rendering has been made or there is nothing to render.
`Diaporama.RENDER_WAITING`: The rendering is incomplete. It is awaiting resource to load.
`Diaporama.RENDER_PLAYING`: The rendering is complete.

### `timeBuffered` (read-only)

The current most reachable time (after this time, the diaporama will block because resources are not loaded yet).
