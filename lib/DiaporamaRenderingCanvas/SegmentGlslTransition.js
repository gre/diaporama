var assign = require("object-assign");
var BezierEasing = require("bezier-easing");
var SegmentTimeline = require("../SegmentTimeline");

function SegmentTransition (renderChannel, data, segmentFrom, segmentTo) {
  SegmentTimeline.call(this, renderChannel, data);
  this.segmentFrom = segmentFrom;
  this.segmentTo = segmentTo;
  this._p = 0;
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
    this.from = function () {
      return ctx.getChannel(this.segmentFrom.channel);
    };
    this.to = function () {
      return ctx.getChannel(this.segmentTo.channel);
    };

    // ^ FIXME need to verify that channel has been rendered with latest frame?
    this.uniforms = assign({}, transition.uniforms, transitionNext.uniforms || {});
    this.duration = transitionNext.duration || 1000;
    this.easing = BezierEasing.apply(null, transitionNext.easing || [0, 0, 1, 1]);
    this.t = transition.t;
    return [ "transition", this.data, this.segmentFrom.data, this.segmentTo.data ];
  },

  resize: function () {
    this.t.render(this._p, this.from(), this.to(), this.uniforms);
  },

  leave: function () {
    return [ "transitionEnd", this.data, this.segmentFrom.data, this.segmentTo.data ];
  },

  render: function (currentTime, interval) {
    var p = this._p = this.easing(interval.interpolate(currentTime));
    this.t.render(p, this.from(), this.to(), this.uniforms);
  }
});

module.exports = SegmentTransition;
