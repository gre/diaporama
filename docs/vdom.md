# Using with Virtual DOM

**Diaporama is easily interoperable with Virtual DOM libraries.**

Diaporama is designed to be performant and that each property changes have the minimal impact (if a property doesn't change, nothing happens).


## React

[`diaporama-react`](https://github.com/glslio/diaporama-react) defines Diaporama for React.

## Other Virtual DOM libraries

What you essentially have to do is to instanciate a Diaporama "on mount", to destroy() it "on unmount", and to affect properties to any props changes.

You can inspire from [`diaporama-react`](https://github.com/glslio/diaporama-react).
