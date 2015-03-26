

## Events

### Loading events

  - `canplay`: the first image of the diaporama is loaded.
  - `canplaythrough`: there is enough images loaded to probably not having the slideshow to pause during the play.
  - `load`: all the images are loaded, the diaporama is fully ready.
  - `progress` **percentage**: Loading in progress.

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
