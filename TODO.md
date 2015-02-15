Bugfixes
------
- in loop mode: fix the last transition "to" when timeline has even items

Features
-------
- smarter images load. "canplaythrough"-like event + pause when reach a not loaded item & continue onload
- Write README.md
- Implement DOM fallback. use webglew

New kind of timeline items
--------------------------
- Canvas "Slide" with texts and various content: DSL for describing a canvas2d (canvas instead of image field). e.g: canvas: [ ["fillText", "foo" ] ]
- Video
