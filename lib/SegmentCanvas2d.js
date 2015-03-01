var assign = require("object-assign");
var SegmentTimeline = require("./SegmentTimeline");
var rectCrop = require("rect-crop");

function SegmentCanvas2d (renderChannel, data, index) {
  SegmentTimeline.call(this, renderChannel);
  this.data = data;
  this.index = index;
  this._needRender = false;
}

SegmentCanvas2d.prototype = assign({}, SegmentTimeline.prototype, {
  ready: function () {
    return true;
  },

  enter: function (ctx) {
    this.ctx = ctx.getChannelContext(this.channel);
    this._render();
    return [ "slide", this.data, this.index ];
  },

  resize: function () {
    this._needRender = true;
  },

  leave: function () {
    return [ "slideEnd", this.data, this.index ];
  },

  render: function () {
    if (this._needRender) this._render();
  },

  _render: function () {
    this._needRender = false;

    var ctx = this.ctx;
    var canvas = ctx.canvas;
    var W = canvas.width;
    var H = canvas.height;
    var item = this.data.canvas2d;
    var size = item.size || [ 1000, 1000 ];
    var w = size[0];
    var h = size[1];
    var bg = item.background || "black";
    var draws = item.draws || [];

    ctx.save();
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, W, H);

    var rect = rectCrop.largest({ width: w, height: h }, canvas);

    ctx.translate(Math.round(rect[0]), Math.round(rect[1]));
    ctx.scale(rect[2] / w, rect[3] / h);

    for (var i=0; i<draws.length; ++i) {
      var draw = draws[i];
      if (draw instanceof Array) {
        var args = draw.slice(1);
        ctx[draw[0]].apply(ctx, args);
      }
      else {
        for (var k in draw) {
          ctx[k] = draw[k];
        }
      }
    }

    ctx.restore();
  }

});

module.exports = SegmentCanvas2d;
