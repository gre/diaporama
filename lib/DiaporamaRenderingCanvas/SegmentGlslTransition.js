var assign = require("object-assign");
var createTexture = require("gl-texture2d");
var BezierEasing = require("bezier-easing");
var SegmentTimeline = require("../SegmentTimeline");

function SegmentTransition (renderChannel, data, segmentFrom, segmentTo) {
  SegmentTimeline.call(this, renderChannel, data);
  this.segmentFrom = segmentFrom;
  this.segmentTo = segmentTo;
}

SegmentTransition.prototype = assign({}, SegmentTimeline.prototype, {
  toString: function () {
    return "SegmentTransition("+this.channel+","+this.segmentFrom.channel+"~>"+this.segmentTo.channel+")";
  },

  ready: function (ctx) {
    return this.segmentFrom.ready(ctx) &&
           this.segmentTo.ready(ctx) &&
           (!this.data.name || ctx.transitions.has(this.data.name));
  },

  enter: function (ctx) {
    var transitionNext = this.data;
    var transition = ctx.transitions.getOrFade(transitionNext.name);
    var gl = ctx.getChannelContext(this.channel);
    this.gl = gl;
    this.from = ctx.getChannel(this.segmentFrom.channel);
    this.to = ctx.getChannel(this.segmentTo.channel);
    this.fromTexture = createTexture(gl, this.from);
    this.toTexture = createTexture(gl, this.to);
    // ^ FIXME need to verify that channel has been rendered with latest frame?
    this.uniforms = assign({}, transition.uniforms, transitionNext.uniforms || {});
    this.duration = transitionNext.duration || 1000;
    this.easing = BezierEasing.apply(null, transitionNext.easing || [0, 0, 1, 1]);
    this.t = transition.t;
    return [ "transition", this.data, this.segmentFrom.data, this.segmentTo.data ];
  },

  resize: function () {
    if (this.fromTexture) this.fromTexture.dispose();
    if (this.toTexture) this.toTexture.dispose();
    this.fromTexture = createTexture(this.gl, this.from);
    this.toTexture = createTexture(this.gl, this.to);
    this.t.render(
      this.easing(this._p||0),
      this.fromTexture,
      this.toTexture,
      this.uniforms);
  },

  leave: function () {
    if (this.fromTexture) this.fromTexture.dispose();
    if (this.toTexture) this.toTexture.dispose();
    this.fromTexture = null;
    this.toTexture = null;
    return [ "transitionEnd", this.data, this.segmentFrom.data, this.segmentTo.data ];
  },

  render: function (p) {
    this._p = p;
    this.fromTexture.setPixels(this.from);
    this.toTexture.setPixels(this.to);
    this.t.render(
      this.easing(p),
      this.fromTexture,
      this.toTexture,
      this.uniforms);
  }
});

module.exports = SegmentTransition;
