var assign = require("object-assign");
var BezierEasing = require("bezier-easing");
var mix = require("./mix");
var SegmentTimeline = require("./SegmentTimeline");

function SegmentTransition (start, end, renderChannel, fromToChannels, data, fromIndex, toIndex, fromImg, toImg) {
  SegmentTimeline.call(this, start, end, renderChannel);
  this.data = data;
  this.fromToChannels = fromToChannels;
  this.fromIndex = fromIndex;
  this.toIndex = toIndex;
  this.fromImg = fromImg;
  this.toImg = toImg;
}

SegmentTransition.prototype = assign({}, SegmentTimeline.prototype, {
  ready: function (ctx) {
    return ctx.images.has(this.fromImg) &&
           ctx.images.has(this.toImg) &&
           ctx.transitions.has(this.data.name);
  },

  enter: function (ctx) {
    var transitionNext = this.data;
    var from = ctx.getChannel(this.fromToChannels[0]);
    var to = ctx.getChannel(this.fromToChannels[1]);
    // ^ FIXME need to verify that channel has been rendered with latest frame?
    this.from = from;
    this.to = to;
    var transition = ctx.transitions.get(transitionNext.name);
    this.transition = transition.t;
    this.transition.load();
    this.duration = transitionNext.duration || 1000;
    this.easing = BezierEasing.apply(null, transitionNext.easing || [0, 0, 1, 1]);
    var allUniforms = assign({}, transition.uniforms || {}, transitionNext.uniforms || {});
    
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

  render: function (t) {
    var transition = this.transition;
    transition.setProgress(this.easing(mix(this.startT, this.endT, t)));
    transition.setUniform("from", this.from);
    transition.setUniform("to", this.to);
    transition.draw();
  }
});

module.exports = SegmentTransition;
