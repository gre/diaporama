
# JSON Description Format

The most interesting part of Diaporama is that the slideshow is described in a concise JSON.

> In the following documentation, we are going to describe the JSON using pseudo-JSON where values are replaced by the expected type of the values.
- **`"key": T`** means that the property "key" is of type T.
- **`T[]`** describes an Array of T.
- **`"key": T?`** means that the property "key" is optional.
- `T`, when not a JavaScript type, is a type alias that is described later in the document.

> Other constraints are not formally documented by explain in English.

## The Format

```json
{
  "timeline": TimelineItem[],
  "transitions": GlslTransitionDefinition[]?
}
```

- **`timeline`** is ordered from the first to the last slide of the slideshow.
- **`transitions`** defines all the transitions to use for the Diaporama. They are referenced by `"name"` from `timeline`.

### TimelineItem

There are currently 2 kind of `TimelineItem`: `TimelineImageItem` and `TimelineCanvasItem`.

> TimelineCanvasItem is advanced and experimental (not editable in the current diaporama-maker), so is described at the end of this page.

#### TimelineImageItem

```json
{
  "image": String,
  "duration": Number,
  "kenburns": KenBurns?,
  "transitionNext": GlslTransition?
}
```

- **`image`** is an URL to a valid Image. Cross Domain images are supported as soon as the hosting server implement CORS properly (this is the case for *imgur* for instance).
- **`duration`** is given in milliseconds. This duration doesn't includes the potential `transitionNext.duration`.
- **`kenburns`** configure the kenburns (or cropping) effect. If not define, the Image is cropped to the biggest possible rectangle preserving the ratio.
- **`transitionNext`** defines the transition to use when moving to the next item. A transition between 2 slides cross-fade the animations of those 2 slides, it means that kenburns effect will continue to move during that transition.

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

## Experimental

### TimelineCanvasItem

The TimelineCanvasItem is a simple DSL on top of Canvas2D to describe text slide content (but also any shapes that you can possibly do using Canvas2D).

A `TimelineCanvasItem` is designed to be scalable to any resolution.

```json
{
  "canvas2d": CanvasShapes,
  "duration": Number,
  "transitionNext": GlslTransition?
}
```

#### CanvasShapes

```json
"canvas2d": {
  "background": String,
  "size": [ Number, Number ],
  "draws": (Object|Array)[]
},
```

- `draws` are an array of Canvas2D draw instructions. Instructions are executed sequentially, and for each element:
  - an Object describes properties to set to the Canvas 2D Context.
  - an Array describes a function call (first parameter is the Canvas 2D Context function name).
- `size` is a reference dimension (`[ width, height ]`) related to the `draws` defined.

The drawing rectangle where the shapes are drawn is the biggest rectangle that preserves the ratio of dimension `size`.

Important: **ratio is preserved**, **draws are vectorial**, **no draws that fits in the `size` are cropped** BUT consequently the drawing rectangle **IS NOT** the full viewport size.

**Example:**

```json
"canvas2d": {
  "background": "#EDA",
  "size": [ 800, 600 ],
  "draws": [
    { "font": "bold 80px sans-serif", "fillStyle": "#000", "textBaseline": "middle", "textAlign": "center" },
    [ "fillText", "This is Text", 400, 300 ]
  ]
}
```
