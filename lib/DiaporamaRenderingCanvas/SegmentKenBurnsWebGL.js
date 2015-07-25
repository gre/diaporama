var assign = require("object-assign");
var createTexture = require("gl-texture2d");
var SegmentKenBurns = require("../SegmentKenBurns");

function SegmentKenBurnsWebGL (renderChannel, data, diaporama) {
  SegmentKenBurns.call(this, renderChannel, data, diaporama);
}

SegmentKenBurnsWebGL.prototype = assign({}, SegmentKenBurns.prototype, {

  enter: function (ctx) {
    //this.getSize = ctx.getSize.bind(ctx);
    var size = this.getMediaSize();
    var res = SegmentKenBurns.prototype.enter.apply(this, arguments);
    this.texture = createTexture(ctx.gl, [size.width, size.height]);
    this.texture.minFilter = this.texture.magFilter = ctx.gl.LINEAR;
    if (this.image) this.texture.setPixels(this.image);
    return res;
  },

  leave: function () {
    this.texture.dispose();
    return SegmentKenBurns.prototype.leave.apply(this, arguments);
  },

  draw: function (imageOrVideo, bound) {
    if (this.video) this.texture.setPixels(imageOrVideo);
    this.kenburns.render(this.texture, bound);
  }

});

module.exports = SegmentKenBurnsWebGL;
