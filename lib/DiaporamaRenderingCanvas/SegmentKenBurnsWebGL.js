var assign = require("object-assign");
var createTexture = require("gl-texture2d");
var SegmentKenBurns = require("../SegmentKenBurns");

function SegmentKenBurnsWebGL (renderChannel, data) {
  SegmentKenBurns.call(this, renderChannel, data);
}

SegmentKenBurnsWebGL.prototype = assign({}, SegmentKenBurns.prototype, {

  enter: function (ctx) {
    this.getSize = ctx.getSize.bind(ctx);
    var res = SegmentKenBurns.prototype.enter.apply(this, arguments);
    this.texture = createTexture(ctx.gl, this.image);
    this.texture.minFilter = this.texture.magFilter = ctx.gl.LINEAR;
    return res;
  },

  leave: function () {
    this.texture.dispose();
    return SegmentKenBurns.prototype.leave.apply(this, arguments);
  },

  draw: function (image, bound) {
    this.kenburns.render(this.texture, bound);
  }

});

module.exports = SegmentKenBurnsWebGL;
