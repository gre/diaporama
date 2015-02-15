
module.exports = function mix (min, max, value) {
  return Math.max(0, Math.min(1, (value-min)/(max-min)));
};
