var assign = require("object-assign");
var SegmentKenBurns = require("../SegmentKenBurns");

function SegmentKenBurnsWebGL (renderChannel, data) {
  SegmentKenBurns.call(this, renderChannel, data);
}

SegmentKenBurnsWebGL.prototype = assign({}, SegmentKenBurns.prototype, {

  enter: function (ctx) {
    this.getSize = ctx.getSize.bind(ctx);
    SegmentKenBurns.prototype.enter.apply(this, arguments);
  }

});

module.exports = SegmentKenBurnsWebGL;
