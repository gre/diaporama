var KenBurnsDOM = require("kenburns-dom");
var Slide2d = require("slide2d");

var Channels = require("../Channels");
var SegmentTransition = require("./SegmentDomTransition");
var SegmentKenBurns = require("./SegmentKenBurnsDOM");
var SegmentSlide2d = require("../SegmentSlide2d");

function DiaporamaRenderingDOM (media, container, bgColor) {
  this.media = media;
  this._container = container;
  var curPos = this._container.style.position;
  if (!curPos || curPos==="static")
    this._container.style.position = "relative";
  this._container.style.backgroundColor = "rgb("+bgColor.map(function(v) { return ~~(v*255); })+")";
  this._nodes = {};
  this._ctxs = {};
  this.createDOM();
  this.resolveImage = media.getImageResolver();
}

DiaporamaRenderingDOM.prototype = {
  SegmentTransition: SegmentTransition,
  SegmentKenBurns: SegmentKenBurns,
  SegmentSlide2d: SegmentSlide2d,

  destroy: function () {
    this._setChild(null);
    this.media.destroy();
    for (var k in this._ctxs) {
      if (this._ctxs[k].destroy) {
        this._ctxs[k].destroy();
      }
    }
    this._nodes = null;
    this._ctxs = null;
  },

  resize: function (w, h, resolution) {
    this._w = w;
    this._h = h;
    var W = w * resolution, H = h * resolution;
    for (var k in this._nodes) {
      var el = this._nodes[k];
      el.style.width = w + "px";
      el.style.height = h + "px";
      if (el.nodeName === "CANVAS") {
        el.width = W;
        el.height = H;
      }
    }
    this._container.style.width = w + "px";
    this._container.style.height = h + "px";
  },

  getSize: function () {
    return {
      width: this._w,
      height: this._h
    };
  },

  getChannel: function (c) {
    return this._nodes[c];
  },

  getChannelContext: function (c) {
    return this._ctxs[c];
  },

  switchChannel: function (c) {
    if (c !== this._c) {
      this._c = c;
      this._setChild(this._nodes[c]);
    }
  },

  render: function (currentTime, runningSegments) {
    var notReady = false;
    if (runningSegments.length > 0) {
      for (var s = runningSegments.length-1; s >= 0; s--) {
        var seg = runningSegments[s];
        var segment = seg[1];
        var interval = seg[0];
        if (segment.render(currentTime, interval)) {
          notReady = true;
        }
      }
      this.switchChannel(runningSegments[0][1].channel);
    }
    else {
      this.switchChannel(null);
    }
    return notReady;
  },

  createDOM: function () {
    var resolveImage = this.resolveImage;
    var div = document.createElement("div");
    this._attachChannel(Channels.TRANSITION, div, div);

    Channels.KENBURNS.forEach(function (c) {
      var div = document.createElement("div");
      var ctx = new KenBurnsDOM(div);
      ctx.getViewport = this.getSize.bind(this);
      this._attachChannel(c, div, ctx);
    }, this);

    Channels.SLIDE2D.forEach(function (c) {
      var canvas = document.createElement("canvas");
      var ctx = canvas.getContext("2d");
      this._attachChannel(c, canvas, Slide2d(ctx, resolveImage));
    }, this);

  },

  _attachChannel: function (channel, node, ctx) {
    this._nodes[channel] = node;
    this._ctxs[channel] = ctx;
  },

  _setChild: function (c) {
    var elt = this._container;
    var child = elt.children[0];
    if (child) elt.removeChild(child);
    if (c) elt.appendChild(c);
  }
};


module.exports = DiaporamaRenderingDOM;
