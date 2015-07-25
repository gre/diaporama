
# JSON Description Format

The most interesting part of Diaporama is that the slideshow is described in a concise JSON.

> In the following documentation, we are going to describe the JSON format using pseudo-JSON where values are replaced by the expected type.
- **`"key": T`** means that the property "key" is of type T.
- **`T[]`** describes an Array of T.
- **`"key": T?`** means that the property "key" is optional.
- `T`, when not a JavaScript type, is a type alias that is described later in the document.
- **`Object<Key, Value>`** or **`Object<Value>`** describes a JavaScript object that have type Key as key (String if not precised) and Value as value.
- **`A | B`**: the type is either A or B.

> Other constraints are not formally documented but explain in English.

## The Format

```json
{
  "timeline": TimelineItem[],
  "resources": Object<ResourceRef, Resource>?,
  "transitions": GlslTransitionDefinition[]?
}
```

- **`timeline`** is a list of timeline items, ordered from the first to the last slide of the slideshow. (a timeline item can have text content, image, video,...)
- **`resources`** allows to define once the URLs of the diaporama resources (images, videos). They can be referenced by `ResourceRef`.
- **`transitions`** defines all the transitions used for the Diaporama between the timeline items. They are referenced by `"name"` from `timeline`. You might directly use [`glsl-transitions`](https://github.com/glslio/glsl-transitions) collection (or a subset of it).

### TimelineItem

```json
TimelineImageItem | TimelineVideoItem | TimelineCanvasItem
```

#### TimelineImageItem

> defines an image slide.

```json
{
  "image": String,
  "duration": Number,
  "kenburns": KenBurns?,
  "transitionNext": GlslTransition?
}
```

- **`image`** describes the URL to an Image. Cross Domain images are supported as soon as the hosting server implement CORS properly (this is the case for *imgur* for instance).
- **`duration`** is given in milliseconds. This duration doesn't includes the potential `transitionNext.duration`.
- **`kenburns`** configure the kenburns (or cropping) effect. If not defined, the Image is cropped to the biggest possible rectangle preserving the ratio.
- **`transitionNext`** defines the transition to use when moving to the next item. A transition between 2 slides cross-fade the animations of those 2 slides, it means that kenburns effect will continue to move during that transition.

#### TimelineVideoItem

> defines a video slide.

```json
{
  "video": VideoResource | ResourceRef[VideoResource],
  "position": Number?,
  "volume": Number?,
  "playbackRate": Number?,
  "loop": Boolean?,
  "duration": Number,
  "kenburns": KenBurns?,
  "transitionNext": GlslTransition?
}
```
- **`video`** describes the URL of the video or multiple URLs if using different video formats. You can also define an image as a fallback. You can use `ResourceRef`
- **`position`** is a time in milliseconds to start the video at (default is `0`, which means the video start at the beginning).
- **`volume`** is the audio volume to use when playing the video. (default is `0`, which means the video is muted)
- **`playbackRate`** is the playbackRate to play the video. Normal speed is `1` (default).
- **`loop`** is a boolean to describe if the video should loop or stop at the end (default is `true`).
- **`duration`** is given in milliseconds. It defines how long the video should be run.
- **`kenburns`** configure the kenburns (or cropping) effect. If not defined, the video is cropped to the biggest possible rectangle preserving the ratio.
- **`transitionNext`** defines the transition to use when moving to the next item. A transition between 2 slides cross-fade the animations of those 2 slides, it means that kenburns effect will continue to move during that transition.

### TimelineSlide2dItem

> defines a content slide.

```json
{
  "slide2d": Slide2d,
  "duration": Number,
  "transitionNext": GlslTransition?
}
```

- **`slide2d`**: the content described in a simple DSL on top of Canvas 2D to describe text slide content (but also any shapes that you can possibly do using Canvas 2D). See Slide2d type for more info.
- **`duration`** is given in milliseconds.
- **`transitionNext`** defines the transition to use when moving to the next item. A transition between 2 slides cross-fade the animations of those 2 slides, it means that kenburns effect will continue to move during that transition.

> N.B.: A `TimelineSlide2dItem` is designed to be scalable to any resolution.

### ResourceRef[T]

a String identifier that reference a resource of type T defined in `resources`.

### Resource

```json
VideoResource | ImageResource
```

### VideoResource

```json
String | Object<Mimetype, URL>
```

If a String is provided, it is the video URL.
An Object allows to define different video formats: the key of the object is the video format mimetype, the value is the video URL.

If you provide an image, it will be used as a fallback (if the video doesn't load, if not supported by the browser for instance).

Example:

```json
{
  "video/webm": "video.webm",
  "video/mp4": "video.mp4",
  "image/png": "video.fallback.png"
}
```

### KenBurns

```json
"kenburns": {
  "from": KenBurnsCrop,
  "to":   KenBurnsCrop,
  "easing": Easing?
}
```

A KenBurns effect moves between two crop area (from -> to) following an easing.

#### KenBurnsCrop

```json
[ Number, [Number, Number] ]
```

A KenBurnsCrop describes a crop area in an image.
The format is: `[ zoomRatio, [xCenter, yCenter] ]`.

For more information about this, please refer to [`kenburns` Documentation](https://github.com/gre/kenburns#utility-to-compute-the-cropping-rectangle).

### GlslTransition

```json
{
  "name": String,
  "duration": Number,
  "easing": Easing?,
  "uniforms": Object?
}
```

- **`name`** references a `GlslTransitionDefinition` defined in the root `"transitions"` property.
- **`duration`** is given in milliseconds.
- **`uniforms`** provides all uniforms to customize for the current transition.

### Easing

```json
[ Number, Number, Number, Number ]
```

**Easing** is an array containing the 2 handle positions of the bezier easing. They are defined in this order: `[ x1, y1, x2, y2 ]`. When an easing is optional, a linear fallback easing is used (identity).


### GlslTransitionDefinition

This statically defines a GlslTransition.

The easiest way to get a GlslTransition is to use
[`glsl-transitions`](https://github.com/glslio/glsl-transitions) which contains all GLSL Transitions that has been created on GLSL.io.

Here is the mandatory minimal format for Diaporama to work correctly:

```javascript
{
  "name" : String,
  "glsl" : String,
  "uniforms" : Object?
}
```

- `name` should uniquely identify the transition (by name).
- `glsl` is a fragment shader that valids the glsl-transition requirements: it must have following uniforms: `texture2D from, to; float progress; vec2 resolution;`.
- `uniforms` are default values for custom transition uniforms. A transition might not have any uniforms in input.

#### Slide2d

```json
{
  "background": String,
  "size": [ Number, Number ],
  "draws": (Object|Array)[]
}
```

- `draws` are an array of Canvas2D draw instructions. Instructions are executed sequentially.
- `size` is a reference dimension (`[ width, height ]`) related to the `draws` defined.

**For more information on the format, please look at [Slide2D API](https://github.com/gre/slide2d).**

The drawing rectangle where the shapes are drawn is the biggest rectangle that preserves the ratio of dimension `size`.

Important: **ratio is preserved**, **draws are vectorial**, **no draws that fits in the `size` are cropped** BUT consequently the drawing rectangle **IS NOT** the full viewport size.

**Example:**

```json
"slide2d": {
  "background": "#EDA",
  "size": [ 800, 600 ],
  "draws": [
    { "font": "bold 80px sans-serif", "fillStyle": "#000", "textBaseline": "middle", "textAlign": "center" },
    [ "fillText", "This is Text", 400, 300 ]
  ]
}
```
