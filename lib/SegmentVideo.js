var assign = require("object-assign");
var SegmentTimeline = require("./SegmentTimeline");

var loadVideo = require("./loaders/video");
var createTexture = require("gl-texture2d");
var rectClamp = require("rect-clamp");
var rectCrop = require("rect-crop");
var rectMix = require("rect-mix");
var BezierEasing = require("bezier-easing");

function SegmentVideo (renderChannel, data) {
  SegmentTimeline.call(this, renderChannel, data);
  var self = this;
  this._ready = false;

  this.opts = assign({
    position: 0,
    volume: 0,
    playbackRate: 1,
    loop: false
  }, data);

  // we reload the video here, hoping the browser do caching,
  // as the only way to have an exclusive <video> that can be mutated in this segment.
  var video = this.video = loadVideo(data.video, function () {
    self._ready = true;
    self.videoDuration = video.duration;
    self.videoSize = {
      width: video.videoWidth,
      height: video.videoHeight
    };
  });
}

SegmentVideo.prototype = assign({}, SegmentTimeline.prototype, {
  toString: function () {
    return "SegmentVideo("+this.channel+")";
  },

  ready: function () {
    return this._ready;
  },

  getMediaSize: function () {
    return this.videoSize;
  },

  enter: function (ctx) {
    this.getSize = ctx.getSize.bind(ctx);
    var item = this.data;
    var video = this.video;
    var opts = this.opts;
    var size = this.getMediaSize();

    video.loop = opts.loop;
    video.volume = opts.volume;

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

  leave: function () {
    var video = this.video;
    video.pause();

    this.texture.dispose();
    var kenburns = this.kenburns;
    if (kenburns.runEnd) kenburns.runEnd();
    return [ "slideEnd", this.data ];
  },

  resize: function () {
    this.computeBounds();
  },

  getPlaybackRate: function () {
    return this.opts.playbackRate; // FIXME need to multiply with current playbackRate
  },

  computeCurrentTime: function (relativeTime) {
    var opts = this.opts;
    var playbackRate = this.getPlaybackRate();
    return ((opts.position + relativeTime * playbackRate) / 1000) % this.videoDuration;
  },

  render: function (t, interval) {
    var p = this.easing(interval.interpolate(t));
    var video = this.video;
    var dur = this.videoDuration;
    var currentTime = this.computeCurrentTime(interval.relative(t));

    // keep time in sync
    var timeOutOfSync = Math.abs((currentTime - video.currentTime + dur) % dur) > 0.3;
    if (timeOutOfSync) {
      // TODO: smarter 'catchup' using the playbackRate ?
      console.log("catchup");
      video.currentTime = currentTime;
    }

    // keep paused state in sync
    var now = Date.now();
    var diaporamaPlaying = (now - this._lastRender||0) < 100; // TODO WHAT AN HACK!! access diaporama object ?
    this._lastRender = now;

    var playingStateOutOfSync = video.paused !== diaporamaPlaying;

    // TODO: need to keep playbackRate in sync
    // ? access diaporama object?
    var playbackRate = this.getPlaybackRate();
    if (playbackRate !== video.playbackRate) {
      video.playbackRate = playbackRate;
    }

    if (timeOutOfSync || playingStateOutOfSync) {
      if (diaporamaPlaying)
        video.play();
      else
        video.pause();
    }

    var bound = rectMix(this.fromCropBound, this.toCropBound, p);
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

  draw: function (video, bound) {
    this.texture.setPixels(video);
    this.kenburns.render(this.texture, bound);
  }

});

module.exports = SegmentVideo;
