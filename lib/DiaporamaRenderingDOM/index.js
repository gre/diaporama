var GlslTransitionCore = require("glsl-transition-core");
var KenBurnsDOM = require("kenburns-dom");

var Channels = require("../Channels");
var StoreImages = require("../StoreImages");

var SegmentTransition = require("./SegmentDomTransition");
var SegmentKenBurns = require("../SegmentKenBurns");
var SegmentCanvas2d = require("../SegmentCanvas2d");

function DiaporamaRenderingDOM (container, bgColor) {
  this._container = container;
  this._container.style.backgroundColor = "rgb("+bgColor.map(function(v) { return ~~(v*255); })+")";
  this._nodes = {};
  this._ctxs = {};
  this.createDOM();
  this.images = new StoreImages();
}

DiaporamaRenderingDOM.prototype = {
  // FIXME: implement them
  SegmentTransition: SegmentTransition,
  SegmentKenBurns: SegmentKenBurns,
  SegmentCanvas2d: SegmentCanvas2d,

  destroy: function () {
    this.emptyChild();
    this.images.destroy();
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

  createDOM: function () {
    var div = document.createElement("div");
    this._attachChannel(Channels.TRANSITION, div, div);

    Channels.KENBURNS.forEach(function (c) {
      var div = document.createElement("div");
      var ctx = new KenBurnsDOM(div);
      ctx.getViewport = this.getSize.bind(this);
      this._attachChannel(c, div, ctx);
    }, this);

    Channels.CANVAS2D.forEach(function (c) {
      var canvas = document.createElement("canvas");
      var ctx = canvas.getContext("2d");
      this._attachChannel(c, canvas, ctx);
    }, this);

  },

  emptyChild: function () {
    return this._setChild();
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
