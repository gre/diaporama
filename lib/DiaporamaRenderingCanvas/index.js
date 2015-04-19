var KenBurns = require("kenburns-webgl");
var createFBO = require("gl-fbo");
var Post = require("./Post");
var SegmentTransition = require("./SegmentGlslTransition");
var SegmentKenBurns = require("./SegmentKenBurnsWebGL");
var SegmentCanvas2d = require("../SegmentCanvas2d");
var StoreTransitions = require("./StoreTransitions");
var StoreImages = require("../StoreImages");
var Channels = require("../Channels");

function DiaporamaRenderingCanvas (container, bgColor) {
  this._container = container;
  this.bg = bgColor.concat([ 1 ]);
  this._canvas = null;
  this._ctxs = {};
  this._fbos = {};
  this._currentChannel = null;
  var shape = this.shape = [ 1, 1 ];

  var canvas = document.createElement("canvas");
  var gl = canvas.getContext("webgl");
  gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
  this.gl = gl;

  this._post = new Post(gl, bgColor);

  var fbo = createFBO(gl, shape);
  gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, false);
  this._attachContext(Channels.TRANSITION, gl, fbo);

  Channels.KENBURNS.forEach(function (c) {
    var fbo = createFBO(gl, shape);
    var ctx = new KenBurns(gl);
    this._attachContext(c, ctx, fbo);
  }, this);

  /*
  Channels.CANVAS2D.forEach(function (c) {
    var canvas = document.createElement("canvas");
    var ctx = canvas.getContext("2d");
    this._attachContext(c, ctx);
  }, this);
  */

  this._container.appendChild(this._canvas = canvas);
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
      var ctx = this._ctxs[k];
      if (ctx.destroy) ctx.destroy();
      else if (ctx.dispose) ctx.dispose();
    }
    for (var f in this._fbos) {
      this._fbos[f].dispose();
    }
    this._post.dispose();
    this._fbos = null;
    this._canvas = null;
    this._ctxs = null;
    this._post = null;
    this._currentChannel = null;
  },

  getSize: function () {
    var shape = this.shape;
    return {
      width: shape[0],
      height: shape[1]
    };
  },

  resize: function (w, h, resolution) {
    var W = w * resolution, H = h * resolution;
    var shape = this.shape = [ W, H ];
    var canvas = this._canvas;
    var container = this._container;
    canvas.style.width = w + "px";
    canvas.style.height = h + "px";
    canvas.width = W;
    canvas.height = H;
    container.style.width = w + "px";
    container.style.height = h + "px";
    for (var f in this._fbos) {
      this._fbos[f].shape = shape;
    }
  },

  getChannel: function (c) {
    return this._fbos[c];
  },

  getChannelContext: function (c) {
    return this._ctxs[c];
  },

  switchChannel: function (c) {
    this._currentChannel = c;
  },

  _attachContext: function (c, ctx, fbo) {
    this._ctxs[c] = ctx;
    this._fbos[c] = fbo;
  },

  preparePostRender: function () {
    var gl = this.gl;
    var bg = this.bg;
    var shape = this.shape;
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    gl.viewport(0, 0, shape[0], shape[1]);
    gl.clearColor.apply(gl, bg);
    gl.clear(gl.COLOR_BUFFER_BIT);
  },

  render: function (currentTime, runningSegments) {
    if (runningSegments.length > 0) {
      var fbo;
      for (var s = runningSegments.length-1; s >= 0; s--) {
        var seg = runningSegments[s];
        var segment = seg[1];
        var interval = seg[0];
        fbo = this._fbos[segment.channel];
        fbo.bind();
        segment.render(interval.interpolate(currentTime));
      }
      this.preparePostRender();
      this._post.renderFBO(fbo);
    }
    else {
      this.preparePostRender();
      this._post.renderEmpty();
    }
  }
};


module.exports = DiaporamaRenderingCanvas;
