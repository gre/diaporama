var assign = require("object-assign");
var rectClamp = require("rect-clamp");
var rectCrop = require("rect-crop");
var rectMix = require("rect-mix");
var BezierEasing = require("bezier-easing");
var SegmentTimeline = require("./SegmentTimeline");

function SegmentKenBurns (renderChannel, data) {
  SegmentTimeline.call(this, renderChannel, data);
  this.clamped = true; // TODO make property of data
}

SegmentKenBurns.prototype = assign({}, SegmentTimeline.prototype, {
  toString: function () {
    return "SegmentKenBurns("+this.channel+")";
  },

  ready: function (ctx) {
    return ctx.media.has(this.data.image);
  },

  enter: function (ctx) {
    var item = this.data;
    var image = ctx.media.get(item.image);
    var kenburns = ctx.getChannelContext(this.channel);
    this.kenburns = kenburns;
    this.image = image;
    var from = rectCrop.largest;
    var to = rectCrop.largest;
    if (item.kenburns) {
      if (item.kenburns.from) from = rectCrop.apply(null, item.kenburns.from);
      if (item.kenburns.to) to = rectCrop.apply(null, item.kenburns.to);
    }
    this.from = from;
    this.to = to;

    this.easing = BezierEasing.apply(null, item.kenburns && item.kenburns.easing || [0, 0, 1, 1]);
    this.viewport = [ 0, 0, image.width, image.height ];

    this.computeBounds();
    if (kenburns.runStart) kenburns.runStart(image);
    return [ "slide", item ];
  },

  resize: function () {
    this.computeBounds();
  },

  leave: function () {
    var kenburns = this.kenburns;
    if (kenburns.runEnd) kenburns.runEnd();
    return [ "slideEnd", this.data ];
  },

  render: function (currentTime, interval) {
    var p = this.easing(interval.interpolate(currentTime));
    var image = this.image;
    var bound = rectMix(this.fromCropBound, this.toCropBound, p);
    if (this.clamped) bound = rectClamp(bound, this.viewport);
    this.draw(image, bound);
  },

  cropBound: function (crop) {
    var image = this.image;
    var bnds = crop(this.getSize(), image);
    if (this.clamped) bnds = rectClamp(bnds, this.viewport);
    return bnds;
  },

  computeBounds: function () {
    this.fromCropBound = this.cropBound(this.from);
    this.toCropBound = this.cropBound(this.to);
  }
});

module.exports = SegmentKenBurns;
