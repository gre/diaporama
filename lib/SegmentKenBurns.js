var assign = require("object-assign");
var SegmentTimeline = require("./SegmentTimeline");

var rectClamp = require("rect-clamp");
var rectCrop = require("rect-crop");
var rectMix = require("rect-mix");
var BezierEasing = require("bezier-easing");
var hash = require("./hashResource");

var firstInstanceKey = "__skb_fi";

function SegmentKenBurns (renderChannel, data, diaporama) {
  SegmentTimeline.call(this, renderChannel, data);
  this.diaporama = diaporama;
  this.outOfSync = false;
  this.syncing = false;
  this.video = null;
  this.image = null;
  this.opts = assign({
    position: 0,
    volume: 0,
    playbackRate: 1,
    loop: false
  }, data);

  this.onVideoSeeked = this.onVideoSeeked.bind(this);
  this.onDiaporamaPause = this.onDiaporamaPause.bind(this);
  this.onDiaporamaPlay = this.onDiaporamaPlay.bind(this);
  this.onDiaporamaRateChange = this.onDiaporamaRateChange.bind(this);
  this.onDiaporamaSeeked = this.onDiaporamaSeeked.bind(this);

  this.resKey = hash(data.video || data.image);

  if (!diaporama[firstInstanceKey]) diaporama[firstInstanceKey] = {};
  if (!diaporama[firstInstanceKey][this.resKey]) {
    this.isFirstInstance = true;
    diaporama[firstInstanceKey][this.resKey] = true;
  }
}

SegmentKenBurns.prototype = assign({}, SegmentTimeline.prototype, {
  toString: function () {
    return "SegmentKenBurns("+this.channel+")";
  },

  destroy: function () {
    if (this.isFirstInstance) {
      // release the media, for the next time
      delete this.diaporama[firstInstanceKey][this.resKey];
    }
    else {
      // the resource is not from media, we can free it
      if (this._res) this._res();
    }
    this._res = null;
  },

  _computeVideoMeta: function () {
    var video = this.video;
    this.videoDuration = video.duration;
    this.videoSize = {
      width: video.videoWidth,
      height: video.videoHeight
    };
  },

  _setRes: function (result) {
    if (result.video) {
      this.video = result.video;
      this._computeVideoMeta();
    }
    else if (result.image) {
      this.image = result.image;
    }
  },

  _load: function (ctx) {
    var media = ctx.media;
    var data = this.data;
    if (this._loadHandled) return;
    if (this.isFirstInstance) {
      var res = media.get(data.image || data.video);
      if (res) {
        this._loadHandled = true;
        this._setRes(res);
      }
      return;
    }
    this._loadHandled = true;
    this._res = media.loader(data.video || data.image, this._setRes.bind(this));
  },

  ready: function (ctx) {
    this._load(ctx);
    return this.image || this.video;
  },

  getMediaSize: function () {
    return this.image || this.videoSize;
  },

  enter: function (ctx) {
    this.outOfSync = true;
    this.syncing = false;
    this.getSize = ctx.getSize.bind(ctx);
    var item = this.data;
    var video = this.video;
    var image = this.image;
    var opts = this.opts;
    var size = this.getMediaSize();

    if (video) {
      video.loop = opts.loop;
      video.volume = opts.volume;
      video.playbackRate = this.getPlaybackRate();

      video.addEventListener("seeked", this.onVideoSeeked);
      this.diaporama.on("pause", this.onDiaporamaPause);
      this.diaporama.on("play", this.onDiaporamaPlay);
      this.diaporama.on("ratechange", this.onDiaporamaRateChange);
      this.diaporama.on("seeked", this.onDiaporamaSeeked);
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
      this.diaporama.removeListener("play", this.onDiaporamaPlay);
      this.diaporama.removeListener("ratechange", this.onDiaporamaRateChange);
      this.diaporama.removeListener("seeked", this.onDiaporamaSeeked);
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

  onDiaporamaRateChange: function () {
    this.video.playbackRate = this.getPlaybackRate();
    // this.outOfSync = true; // NOTE: we are not syncing to not create video jumps
  },

  onDiaporamaSeeked: function () {
    this.outOfSync = true;
  },

  onDiaporamaPause: function () {
    this.outOfSync = true;
    this.video.pause();
  },

  onDiaporamaPlay: function () {
    this.outOfSync = true;
  },

  onVideoSeeked: function () {
    this.syncing = false;
    this.diaporama._requestRender();
  },

  setVideoTime: function (t) {
    this.video.currentTime = t;
  },

  getCurrentTimeDiff: function (currentTime) {
    var video = this.video;
    var dur = this.videoDuration;
    var diff = Math.abs((currentTime - video.currentTime + dur) % dur);
    return diff;
  },

  render: function (t, interval) {
    var p = this.easing(interval.interpolate(t));
    var video = this.video;
    var image = this.image;

    if (video) {
      var currentTime = this.computeCurrentTime(interval.relative(t));
      var diaporamaPaused = this.diaporama.paused;
      var diff = this.getCurrentTimeDiff(currentTime);

      if (diaporamaPaused) {
        if (diff > 0.01) {
          this.setVideoTime(currentTime);
        }
      }
      else if (!this.syncing) {
        if (this.outOfSync) {
          this.outOfSync = false;
          this.syncing = true;
          this.startSyncingTime = Date.now();
          this.setVideoTime(currentTime);

          if (diaporamaPaused !== video.paused) {
            if (diaporamaPaused)
              video.pause();
            else
              video.play();
          }
        }
        else {
          // WORKAROUND:
          // If the video.paused is STILL not in sync,
          // force the currentTime (e.g: iPhone / iPad doesn't allow to .play())
          if (diaporamaPaused !== video.paused) {
            this.setVideoTime(currentTime);
          }
        }
      }
    }

    var bound = rectMix(this.fromCropBound, this.toCropBound, p);
    bound = rectClamp(bound, this.viewport);
    this.draw(video || image, bound);

    return this.syncing && Date.now()-this.startSyncingTime > 300;
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
