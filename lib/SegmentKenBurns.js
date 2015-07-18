var assign = require("object-assign");
var SegmentTimeline = require("./SegmentTimeline");

var loadImage = require("./loaders/image");
var loadVideo = require("./loaders/video");
var rectClamp = require("rect-clamp");
var rectCrop = require("rect-crop");
var rectMix = require("rect-mix");
var BezierEasing = require("bezier-easing");

function SegmentKenBurns (renderChannel, data, diaporama) {
  SegmentTimeline.call(this, renderChannel, data);
  this.diaporama = diaporama;
  var self = this;
  this._ready = false;
  this.awaiting = 0;

  this.opts = assign({
    position: 0,
    volume: 0,
    playbackRate: 1,
    loop: false
  }, data);

  function ldImg () {
    self.video = null;
    self.image = loadImage(data.image, function () {
      self._ready = true;
    });
  }

  function ldVid () {
    self.image = null;
    // we reload the video here, hoping the browser do caching,
    // as the only way to have an exclusive <video> that can be mutated in this segment.
    var video = self.video = loadVideo(data.video, function () {
      self._ready = true;
      self.videoDuration = video.duration;
      self.videoSize = {
        width: video.videoWidth,
        height: video.videoHeight
      };
    }, function () {
      // fallback on image
      if (data.image) {
        ldImg();
      }
    });
  }

  if (data.video) ldVid();
  else ldImg();

  this.onVideoSeeked = this.onVideoSeeked.bind(this);
  this.onDiaporamaPause = this.onDiaporamaPause.bind(this);
}

SegmentKenBurns.prototype = assign({}, SegmentTimeline.prototype, {
  toString: function () {
    return "SegmentKenBurns("+this.channel+")";
  },

  ready: function () {
    return this._ready;
  },

  getMediaSize: function () {
    return this.image || this.videoSize;
  },

  onDiaporamaPause: function () {
    this.video.pause();
  },

  onVideoSeeked: function () {
    this.awaiting = 0;
    this.diaporama._requestRender();
  },

  enter: function (ctx) {
    this.enteredNoRender = true;
    this.getSize = ctx.getSize.bind(ctx);
    var item = this.data;
    var video = this.video;
    var image = this.image;
    var opts = this.opts;
    var size = this.getMediaSize();

    if (video) {
      video.loop = opts.loop;
      video.volume = opts.volume;

      video.addEventListener("seeked", this.onVideoSeeked);
      this.diaporama.on("pause", this.onDiaporamaPause);
    }

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
    if (kenburns.runStart) kenburns.runStart(video || image);

    return [ "slide", item ];
  },

  leave: function () {
    var video = this.video;
    if (video) {
      video.pause();
      video.removeEventListener("seeked", this.onVideoSeeked);
      this.diaporama.removeListener("pause", this.onDiaporamaPause);
    }

    var kenburns = this.kenburns;
    if (kenburns.runEnd) kenburns.runEnd();
    return [ "slideEnd", this.data ];
  },

  resize: function () {
    this.computeBounds();
  },

  getPlaybackRate: function () {
    return this.opts.playbackRate * this.diaporama.playbackRate;
  },

  computeCurrentTime: function (relativeTime) {
    var opts = this.opts;
    var playbackRate = this.getPlaybackRate();
    return ((opts.position + relativeTime * playbackRate) / 1000) % this.videoDuration;
  },

  render: function (t, interval) {
    var p = this.easing(interval.interpolate(t));
    var video = this.video;
    var image = this.image;

    if (video) {
      var dur = this.videoDuration;
      var currentTime = this.computeCurrentTime(interval.relative(t));
      var diaporamaPaused = this.diaporama.paused;

      var diff = Math.abs((currentTime - video.currentTime + dur) % dur);

      var playingStateOutOfSync = video.paused !== diaporamaPaused;

      var playbackRate = this.getPlaybackRate();
      if (playbackRate !== video.playbackRate) {
        video.playbackRate = playbackRate;
      }

      if (!this.awaiting) {
        if (this.enteredNoRender ||
          playingStateOutOfSync ||
          // diff > 0.5 || // FIXME: very bad heuristic. creates lot of jumps
          diaporamaPaused && diff > 0.01) {
          this.awaiting = Date.now();
          video.currentTime = currentTime;
        }
        if (playingStateOutOfSync) {
          if (!diaporamaPaused)
            video.play();
          else
            video.pause();
        }
      }
    }

    var bound = rectMix(this.fromCropBound, this.toCropBound, p);
    bound = rectClamp(bound, this.viewport);
    this.draw(video || image, bound);

    this.enteredNoRender = false;

    return this.awaiting;
  },

  cropBound: function (crop) {
    var bnds = crop(this.getSize(), this.getMediaSize());
    bnds = rectClamp(bnds, this.viewport);
    return bnds;
  },

  computeBounds: function () {
    this.fromCropBound = this.cropBound(this.from);
    this.toCropBound = this.cropBound(this.to);
  }

});

module.exports = SegmentKenBurns;
