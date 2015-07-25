var assign = require("object-assign");
var SegmentKenBurns = require("../SegmentKenBurns");

function SegmentKenBurnsDOM (renderChannel, data, diaporama) {
  SegmentKenBurns.call(this, renderChannel, data, diaporama);
}

SegmentKenBurnsDOM.prototype = assign({}, SegmentKenBurns.prototype, {

  enter: function (ctx) {
    this.div = ctx.getChannel(this.channel);
    this.getSize = ctx.getSize.bind(ctx);
    return SegmentKenBurns.prototype.enter.apply(this, arguments);
  },

  draw: function (image, bound) {
    this.kenburns.draw(image, bound);
  }

});



module.exports = SegmentKenBurnsDOM;
