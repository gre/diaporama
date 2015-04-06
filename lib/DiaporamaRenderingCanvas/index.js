var KenBurns = require("kenburns-webgl");

var SegmentTransition = require("./SegmentGlslTransition");
var SegmentKenBurns = require("../SegmentKenBurns");
var SegmentCanvas2d = require("../SegmentCanvas2d");
var StoreTransitions = require("./StoreTransitions");
var StoreImages = require("../StoreImages");
var Channels = require("../Channels");

function DiaporamaRenderingCanvas (container, bgColor) {
  this._container = container;
  this._container.style.backgroundColor = "rgb("+bgColor.map(function(v) { return ~~(v*255); })+")";
  this._canvases = {};
  this._ctxs = {};
  this.createDOM();
  this.images = new StoreImages();
  this.transitions = new StoreTransitions(this.getChannelContext(Channels.TRANSITION));
}

DiaporamaRenderingCanvas.prototype = {
  SegmentTransition: SegmentTransition,
  SegmentKenBurns: SegmentKenBurns,
  SegmentCanvas2d: SegmentCanvas2d,

  destroy: function () {
    this.emptyChild();
    this.images.destroy();
    this.transitions.destroy();
    for (var k in this._ctxs) {
      if (this._ctxs[k].destroy) {
        this._ctxs[k].destroy();
      }
    }
    this._canvases = null;
    this._ctxs = null;
  },

  resize: function (w, h, resolution) {
    var W = w * resolution, H = h * resolution;
    for (var k in this._canvases) {
      var canvas = this._canvases[k];
      canvas.style.width = w + "px";
      canvas.style.height = h + "px";
      canvas.width = W;
      canvas.height = H;
      // ^ FIXME: this is quite expensive. Should this be done only on current layer and post-pone for others?
    }
    this._container.style.width = w + "px";
    this._container.style.height = h + "px";
  },

  getChannel: function (c) {
    return this._canvases[c];
  },

  getChannelContext: function (c) {
    return this._ctxs[c];
  },

  switchChannel: function (c) {
    if (c !== this._c) {
      this._setChild(this._canvases[c]);
    }
  },

  createDOM: function () {
    var canvas, ctx;

    canvas = document.createElement("canvas");
    ctx = canvas.getContext("webgl");
    ctx.pixelStorei(ctx.UNPACK_FLIP_Y_WEBGL, true);
    this._attachChannel(Channels.TRANSITION, canvas, ctx);

    Channels.KENBURNS.forEach(function (c) {
      canvas = document.createElement("canvas");
      ctx = new KenBurns(canvas);
      this._attachChannel(c, canvas, ctx);
    }, this);

    Channels.CANVAS2D.forEach(function (c) {
      canvas = document.createElement("canvas");
      ctx = canvas.getContext("2d");
      this._attachChannel(c, canvas, ctx);
    }, this);

  },

  emptyChild: function () {
    return this._setChild();
  },

  _attachChannel: function (channel, canvas, ctx) {
    this._canvases[channel] = canvas;
    this._ctxs[channel] = ctx;
  },

  _setChild: function (c) {
    this._c = c;
    var elt = this._container;
    var child = elt.children[0];
    if (child) elt.removeChild(child);
    if (c) elt.appendChild(c);
  }
};


module.exports = DiaporamaRenderingCanvas;
