var assign = require("object-assign");
var BezierEasing = require("bezier-easing");
var SegmentTimeline = require("./SegmentTimeline");

function SegmentTransition (renderChannel, data, fromIndex, toIndex, segmentFrom, segmentTo) {
  SegmentTimeline.call(this, renderChannel);
  this.data = data;
  this.fromIndex = fromIndex;
  this.toIndex = toIndex;
  this.segmentFrom = segmentFrom;
  this.segmentTo = segmentTo;
}

SegmentTransition.prototype = assign({}, SegmentTimeline.prototype, {
  ready: function (ctx) {
    return this.segmentFrom.ready(ctx) &&
           this.segmentTo.ready(ctx) &&
           (!this.data.name || ctx.transitions.has(this.data.name));
  },

  enter: function (ctx) {
    var transitionNext = this.data;
    var from = ctx.getChannel(this.segmentFrom.channel);
    var to = ctx.getChannel(this.segmentTo.channel);
    // ^ FIXME need to verify that channel has been rendered with latest frame?
    this.from = from;
    this.to = to;
    var transition = ctx.transitions.getOrFade(transitionNext.name);
    this.transition = transition.t;
    this.transition.load();
    this.duration = transitionNext.duration || 1000;
    this.easing = BezierEasing.apply(null, transitionNext.easing || [0, 0, 1, 1]);
    var allUniforms = assign({}, transition.uniforms, transitionNext.uniforms || {});
    
    this.transition.bind();
    for (var name in allUniforms) {
      this.transition.setUniform(name, allUniforms[name]);
    }
    this.transition.syncViewport();

    return [ "transition", this.data, this.fromIndex, this.toIndex ];
  },

  resize: function () {
    this.transition.syncViewport();
  },

  leave: function () {
    return [ "transitionEnd", this.data, this.fromIndex, this.toIndex ];
  },

  render: function (p) {
    var transition = this.transition;
    transition.setProgress(this.easing(p));
    transition.setUniform("from", this.from);
    transition.setUniform("to", this.to);
    transition.draw();
  }
});

module.exports = SegmentTransition;
