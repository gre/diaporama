var KenBurns = require("kenburns-webgl");
var Slide2d = require("slide2d");
var createFBO = require("gl-fbo");
var createTexture = require("gl-texture2d");
var Post = require("./Post");
var SegmentTransition = require("./SegmentGlslTransition");
var SegmentKenBurns = require("./SegmentKenBurnsWebGL");
var SegmentSlide2d = require("../SegmentSlide2d");
var StoreTransitions = require("./StoreTransitions");
var Channels = require("../Channels");

function DiaporamaRenderingCanvas (media, container, bgColor) {
  this.media = media;
  this._container = container;
  this.bg = bgColor.concat([ 1 ]);
  this._canvas = null;
  this._canvases = {};
  this._textures = {};
  this._ctxs = {};
  this._fbos = {};
  this._currentChannel = null;
  var shape = this.shape = [ 1, 1 ];

  var resolveImage = media.getImageResolver();

  var canvas = document.createElement("canvas");
  var gl = canvas.getContext("webgl");
  gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, false);
  this.gl = gl;

  this._post = new Post(gl, bgColor);

  var fbo = createFBO(gl, shape);
  this._attachContext(Channels.TRANSITION, gl, fbo);

  Channels.KENBURNS.forEach(function (c) {
    var fbo = createFBO(gl, shape);
    var ctx = new KenBurns(gl);
    this._attachContext(c, ctx, fbo);
  }, this);

  Channels.SLIDE2D.forEach(function (c) {
    var canvas = document.createElement("canvas");
    var ctx = canvas.getContext("2d");
    this._canvases[c] = canvas;
    var texture = createTexture(gl, canvas);
    texture.minFilter = texture.magFilter = gl.LINEAR;
    this._textures[c] = texture;
    this._attachContext(c, Slide2d(ctx, resolveImage));
  }, this);

  this._container.appendChild(this._canvas = canvas);
  this.transitions = new StoreTransitions(this.getChannelContext(Channels.TRANSITION));
}

DiaporamaRenderingCanvas.prototype = {
  SegmentTransition: SegmentTransition,
  SegmentKenBurns: SegmentKenBurns,
  SegmentSlide2d: SegmentSlide2d,

  destroy: function () {
    this.media.destroy();
    this.transitions.destroy();
    for (var k in this._ctxs) {
      var ctx = this._ctxs[k];
      if (ctx.destroy) ctx.destroy();
      else if (ctx.dispose) ctx.dispose();
    }
    for (var f in this._fbos) {
      this._fbos[f].dispose();
    }
    for (var t in this._textures) {
      this._textures[t].dispose();
    }
    this._post.dispose();
    this._fbos = null;
    this._canvas = null;
    this._canvases = null;
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
    for (var c in this._canvases) {
      var canv = this._canvases[c];
      canv.width = W;
      canv.height = H;
    }
    for (var f in this._fbos)
      this._fbos[f].shape = shape;
    for (var t in this._textures)
      this._textures[t].shape = shape;
  },

  getChannel: function (c) {
    var fbo = this._fbos[c];
    if (fbo) {
      return fbo.color[0];
    }
    else {
      var canvas = this._canvases[c];
      var texture = this._textures[c];
      var gl = this.gl;
      gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
      // TODO: define a SegmentSlide2dWebGL refinement which do this only when _render
      texture.setPixels(canvas);
      gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, false);
      return texture;
    }
  },

  getChannelContext: function (c) {
    return this._ctxs[c];
  },

  switchChannel: function (c) {
    this._currentChannel = c;
  },

  _attachContext: function (c, ctx, fbo) {
    this._ctxs[c] = ctx;
    if (fbo) this._fbos[c] = fbo;
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
    var notReady = false;
    if (runningSegments.length > 0) {
      var channel;
      for (var s = runningSegments.length-1; s >= 0; s--) {
        var seg = runningSegments[s];
        var segment = seg[1];
        var interval = seg[0];
        channel = segment.channel;
        var fbo = this._fbos[segment.channel];
        if (fbo) fbo.bind();
        if (segment.render(currentTime, interval)) {
          notReady = true;
        }
      }
      this.preparePostRender();
      this._post.renderTexture(this.getChannel(channel));
    }
    else {
      this.preparePostRender();
      this._post.renderEmpty();
    }
    return notReady;
  }
};


module.exports = DiaporamaRenderingCanvas;
