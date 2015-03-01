var GlslTransitionCore = require("glsl-transition-core");
var KenBurns = require("kenburns-webgl");

var Channels = require("./Channels");
var StoreImages = require("./StoreImages");
var StoreTransitions = require("./StoreTransitions");

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
      this._c = c;
      this._setChild(this._canvases[c]);
    }
  },

  createDOM: function () {
    var canvas, ctx;

    canvas = document.createElement("canvas");
    ctx = GlslTransitionCore(canvas);
    this._attachChannel(Channels.TRANSITION, canvas, ctx);

    canvas = document.createElement("canvas");
    ctx = new KenBurns(canvas);
    this._attachChannel(Channels.KENBURNS_1, canvas, ctx);

    canvas = document.createElement("canvas");
    ctx = new KenBurns(canvas);
    this._attachChannel(Channels.KENBURNS_2, canvas, ctx);

    canvas = document.createElement("canvas");
    ctx = canvas.getContext("2d");
    this._attachChannel(Channels.CANVAS2D, canvas, ctx);
  },

  emptyChild: function () {
    return this._setChild();
  },

  _attachChannel: function (channel, canvas, ctx) {
    this._canvases[channel] = canvas;
    this._ctxs[channel] = ctx;
  },

  _setChild: function (c) {
    var elt = this._container;
    var child = elt.children[0];
    if (child) elt.removeChild(child);
    if (c) elt.appendChild(c);
  }
};


module.exports = DiaporamaRenderingCanvas;
