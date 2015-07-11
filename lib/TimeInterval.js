var mix = require("./mix");

function TimeInterval (startT, endT) {
  this.startT = startT;
  this.endT = endT;
}

TimeInterval.prototype = {
  toString: function () {
    return "TimeInterval("+this.startT+","+this.endT+")";
  },
  clone: function () {
    return new TimeInterval(this.startT, this.endT);
  },
  add: function (scalar) {
    this.startT += scalar;
    this.endT += scalar;
  },
  timeInside: function (t) {
    return this.startT <= t && t < this.endT;
  },
  interpolate: function (t) {
    return mix(this.startT, this.endT, t);
  },
  relative: function (t) {
    return t - this.startT;
  }
};

module.exports = TimeInterval;
