var assign = require("object-assign");
var SegmentKenBurns = require("../SegmentKenBurns");

function SegmentKenBurnsDOM (renderChannel, data) {
  SegmentKenBurns.call(this, renderChannel, data);
}

SegmentKenBurnsDOM.prototype = assign({}, SegmentKenBurns.prototype, {

  getSize: function () {
    return this.div;
  },

  enter: function (ctx) {
    this.div = ctx.getChannel(this.channel);
    return SegmentKenBurns.prototype.enter.apply(this, arguments);
  },

  draw: function (image, bound) {
    this.kenburns.draw(image, bound);
  }

});



module.exports = SegmentKenBurnsDOM;
