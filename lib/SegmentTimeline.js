
var noop = require("./noop");

function SegmentTimeline (renderChannel) {
  this.channel = renderChannel;
}

SegmentTimeline.prototype = {
  ready: function(){ return true; },
  enter: noop,
  leave: noop,
  render: noop,
  resize: noop
};

module.exports = SegmentTimeline;
