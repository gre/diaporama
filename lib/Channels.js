
// values ordered with priority (lowest are displayed when there is multiple running channels)
module.exports = {
  TRANSITION: 0,
  KENBURNS: [ 1, 2, 3 ],
  CANVAS2D: [ 4, 5, 6 ],

  sort: function channelSort (a, b) {
    return a - b;
  }
};

