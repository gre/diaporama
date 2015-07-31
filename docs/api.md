API overview
===

See also [Diaporama by Examples](examples.md).

### Create a Diaporama

```javascript
var diaporama = Diaporama(container, data, props)
```

- **`container` (DOM Element)** *(required)* : you must provide an (empty) DOM element container in which the Diaporama will be created.
- **`data` (Object)** : data of the diaporama (e.g; extracted from a `diaporama.json`), The format is described in [JSON Data Format](format.md).
- **`props` (Object)** : initial properties of the Diaporama. (`data` can also be passed in this object – in that case you can give `props` as second parameter).

### Properties:

> **N.B.:** Every properties initially defined in **props** can also be accessed or set on a `diaporama` instance and the diaporama will always keep things synchronized based on your changes. *(Diaporama uses JavaScript's `defineProperties`)*

- `loop` (boolean)
- `autoplay` (boolean)
- `data` (object)
- `width` (number in pixels)
- `height` (number in pixels)
- `resolution` (number)
- `currentTime` (number in milliseconds)
- `slide` (number)
- `playbackRate` (number)
- `paused` (boolean)
- `duration` (number in milliseconds, read-only)
- `renderingMode` (read-only)
- `networkTimeout` (number in milliseconds)
- `currentRenderState` (read-only)
- `timeBuffered` (read-only)

**For more details on each property, See [Diaporama Properties](#diaporama-properties) section.**

### Methods:

*Diaporama* has a few helper methods usually on top of Properties:

- `play()` : set `paused` to false.
- `pause()` : set `paused` to true.
- `next([duration])` : set `currentTime` to the time of the next slide. If duration is provided, there is a transition to go to the next slide time.
- `prev([duration])` : set `currentTime` to the time of the previous slide. If duration is provided, there is a transition to go to the previous slide time.
- `jump(slideIndex, [duration])` : set `currentTime` to jump to a specific slide by its index.  If duration is provided, there is a transition to go to the requested slide time.
- `feed(observable, opts)`: give an observable (stream) to feed the diaporama timeline over time. The observed values can be a slide OR an array of slides. *Note: an observable has a `subscribe(onNext,onError,onCompleted)` method that returns a disposable (with a `dispose()` function). You can use RxJS with `feed()`.*

### Events:

*Diaporama* have events that let you watch and react on changes:


  - `canplay`, `canplaythrough`, `load`, `progress`
  - `destroy`
  - `error`
  - `resize`
  - `play`, `pause`
  - `render`
  - `ended`
  - `transition`, `transitionEnd`
  - `slide`, `slideEnd`


> The `diaporama` object is an `EventEmitter` so it haves the same API: `on`, `once`, `removeListener`,... Refer to [Event Emitter](https://nodejs.org/api/events.html) documentation.

**For more details on Events, See [Diaporama Events](events.md) section.**
