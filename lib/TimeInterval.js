var mix = require("./mix");

function TimeInterval (startT, endT) {
  this.startT = startT;
  this.endT = endT;
}

TimeInterval.prototype = {
  timeInside: function (t) {
    return this.startT <= t && t < this.endT;
  },
  interpolate: function (t) {
    return mix(this.startT, this.endT, t);
  }
};

module.exports = TimeInterval;

