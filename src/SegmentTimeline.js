
var noop = require("./noop");

function SegmentTimeline (startT, endT, renderChannel) {
  this.startT = startT;
  this.endT = endT;
  this.channel = renderChannel;
}

SegmentTimeline.prototype = {
  enter: noop,
  leave: noop,
  render: noop,
  resize: noop,
  timeInside: function (t) {
    return this.startT <= t && t < this.endT;
  }
};

module.exports = SegmentTimeline;
