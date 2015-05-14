var assign = require("object-assign");
var SegmentTimeline = require("./SegmentTimeline");

function SegmentSlide2d (renderChannel, data) {
  SegmentTimeline.call(this, renderChannel, data);
  this._needRender = false;
}

SegmentSlide2d.prototype = assign({}, SegmentTimeline.prototype, {
  toString: function () {
    return "SegmentSlide2d("+this.channel+")";
  },

  ready: function () {
    return true;
  },

  enter: function (ctx) {
    this.ctx = ctx.getChannelContext(this.channel);
    this._render();
    return [ "slide", this.data ];
  },

  resize: function () {
    this._needRender = true;
  },

  leave: function () {
    return [ "slideEnd", this.data ];
  },

  render: function () {
    if (this._needRender) this._render();
  },

  _render: function () {
    this._needRender = false;
    this.ctx.render(this.data.slide2d);
  }

});

module.exports = SegmentSlide2d;
