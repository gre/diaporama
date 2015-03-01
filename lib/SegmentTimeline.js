
var noop = require("./noop");

function SegmentTimeline (renderChannel, data) {
  this.channel = renderChannel;
  this.data = data;
}

SegmentTimeline.prototype = {
  ready: function(){ return true; },
  enter: noop,
  leave: noop,
  render: noop,
  resize: noop
};

module.exports = SegmentTimeline;
