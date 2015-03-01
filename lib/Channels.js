
// values ordered with priority (lowest are displayed when there is multiple running channels)
module.exports = {
  TRANSITION: 0,
  KENBURNS_1: 1,
  KENBURNS_2: 2,
  CANVAS2D: 3,

  sort: function channelSort (a, b) {
    return a - b;
  }
};

