var assign = require("object-assign");
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
           this.segmentTo.ready(ctx);
  },

  enter: function (ctx) {
    var transitionNext = this.data;
    var from = ctx.getChannel(this.segmentFrom.channel);
    var to = ctx.getChannel(this.segmentTo.channel);
    var container = ctx.getChannel(this.channel);
    from.style.position = "absolute";
    from.style.top = 0;
    from.style.left = 0;
    to.style.position = "absolute";
    to.style.top = 0;
    to.style.left = 0;
    container.appendChild(to);
    container.appendChild(from);
    // FIXME: this seems to produce a small lag here. We might find another way to touch less DOM.
    this.container = container;
    this.from = from;
    this.to = to;
    this.duration = transitionNext.duration || 1000;
    this.easing = BezierEasing.apply(null, transitionNext.easing || [0, 0, 1, 1]);
    return [ "transition", transitionNext, this.segmentFrom.data, this.segmentTo.data ];
  },

  resize: function () {
  },

  leave: function () {
    this.container.removeChild(this.from);
    this.container.removeChild(this.to);
    this.from.style.opacity = 1;
    this.to.style.opacity = 1;
    return [ "transitionEnd", this.data, this.segmentFrom.data, this.segmentTo.data ];
  },

  render: function (currentTime, interval) {
    var progress = this.easing(interval.interpolate(currentTime));
    this.from.style.opacity = 1-progress;
  }
});

module.exports = SegmentTransition;
