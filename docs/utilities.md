# Global utilities

Diaporama also provide *Global Utilities*.

These are functions that can be used outside to simplify work to do with Diaporama.

## `Diaporama.localize(diaporamaData, localizeURL)`

This will mutate your `diaporamaData` to resolve all URLs with a given localizeURL function.
localizeURL will basically will be mapped over all URLs in the diaporama data.

If a string is given in localizeURL, it will be used as a prefix to the URL.
