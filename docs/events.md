

## Events

### Loading events

  - `canplay`: the first image of the diaporama is loaded.
  - `canplaythrough`: there is enough images loaded to probably not having the slideshow to pause during the play.
  - `load`: all the images are loaded, the diaporama is fully ready.
  - `progress` **{timeBuffered, loaded, total}**: triggered recurrently during load time.

### Diaporama Lifecycle
  - `destroy`: Diaporama is about to destroy.
  - `error` **e** : an Error occured.
  - `resize` **w** **h**: a resize occured.
  - `play`: diaporama has started.
  - `pause`: diaporama has stopped.
  - `ended`: diaporama reach the end (only occurs if no loop).
  - `transition` **transitionObject**: a transition has started.
  - `transitionEnd` **transitionObject**: a transition has ended.
  - `slide` **slideObject**: a new slide has started.
  - `slideEnd` **slideObject**: a slide has ended.
  - `seeked` **currentTime** **renderStatus**: a manual set of currentTime has been rendered.
  - `ratechange` **playbackRate**: playbackRate has been changed.
  - `render` **currentTime** **renderStatus**: an event triggered everytime a render is performed (be careful with this event, do not do intensive work). `renderStatus` can be on of: `Diaporama.RENDER_EMPTY`, `Diaporama.RENDER_WAITING`, `Diaporama.RENDER_PLAYING`.
  - `data` **data**: data have changed.
