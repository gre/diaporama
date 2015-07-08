var assign = require("object-assign");
var SegmentTimeline = require("./SegmentTimeline");

var createTexture = require("gl-texture2d");
var rectClamp = require("rect-clamp");
var rectCrop = require("rect-crop");
var rectMix = require("rect-mix");
var BezierEasing = require("bezier-easing");

function SegmentVideo (renderChannel, data) {
  SegmentTimeline.call(this, renderChannel, data);
}

SegmentVideo.prototype = assign({}, SegmentTimeline.prototype, {
  toString: function () {
    return "SegmentVideo("+this.channel+")";
  },

  ready: function (ctx) {
    if (!ctx.media.has(this.data.video))
      return false;
    return true;
  },

  getMediaSize: function () {
    var video = this.video;
    return {
      width: video.videoWidth,
      height: video.videoHeight
    };
  },

  enter: function (ctx) {
    this.getSize = ctx.getSize.bind(ctx);
    var item = this.data;
    var video = this.video = ctx.media.get(item.video);
    var size = this.getMediaSize();

    video.currentTime = 0;
    video.play();

    var kenburns = ctx.getChannelContext(this.channel);
    this.kenburns = kenburns;
    var from = rectCrop.largest;
    var to = rectCrop.largest;
    if (item.kenburns) {
      if (item.kenburns.from) from = rectCrop.apply(null, item.kenburns.from);
      if (item.kenburns.to) to = rectCrop.apply(null, item.kenburns.to);
    }
    this.from = from;
    this.to = to;

    this.easing = BezierEasing.apply(null, item.kenburns && item.kenburns.easing || [0, 0, 1, 1]);
    this.viewport = [ 0, 0, size.width, size.height ];

    this.computeBounds();
    if (kenburns.runStart) kenburns.runStart(video);

    this.texture = createTexture(ctx.gl, [size.width, size.height]);
    this.texture.minFilter = this.texture.magFilter = ctx.gl.LINEAR;
    return [ "slide", item ];
  },

  resize: function () {
    this.computeBounds();
  },

  render: function (p) {
    var video = this.video;
    var bound = rectMix(this.fromCropBound, this.toCropBound, this.easing(p));
    bound = rectClamp(bound, this.viewport);
    this.draw(video, bound);
  },

  cropBound: function (crop) {
    var bnds = crop(this.getSize(), this.getMediaSize());
    bnds = rectClamp(bnds, this.viewport);
    return bnds;
  },

  computeBounds: function () {
    this.fromCropBound = this.cropBound(this.from);
    this.toCropBound = this.cropBound(this.to);
  },

  leave: function () {
    var video = this.video;
    video.pause();

    this.texture.dispose();
    var kenburns = this.kenburns;
    if (kenburns.runEnd) kenburns.runEnd();
    return [ "slideEnd", this.data ];
  },

  draw: function (video, bound) {
    this.texture.setPixels(video);
    this.kenburns.render(this.texture, bound);
  }

});

module.exports = SegmentVideo;
