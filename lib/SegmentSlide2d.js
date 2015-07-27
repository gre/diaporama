var assign = require("object-assign");
var SegmentTimeline = require("./SegmentTimeline");
var forEachSlide2dImage = require("./forEachSlide2dImage");

function SegmentSlide2d (renderChannel, data) {
  SegmentTimeline.call(this, renderChannel, data);
  this.imgs = [];
  forEachSlide2dImage(data.slide2d.draws, this.imgs.push, this.imgs);
  this._needRender = false;
}

SegmentSlide2d.prototype = assign({}, SegmentTimeline.prototype, {
  toString: function () {
    return "SegmentSlide2d("+this.channel+")";
  },

  ready: function (ctx) {
    for (var i=0; i<this.imgs.length; ++i) {
      if (!ctx.media.has({ image: this.imgs[i] })) {
        return false;
      }
    }
    return true;
  },

  enter: function (ctx) {
    this._needRender = true;
    this.ctx = ctx.getChannelContext(this.channel);
    return [ "slide", this.data ];
  },

  resize: function () {
    this._needRender = true;
  },

  leave: function () {
    return [ "slideEnd", this.data ];
  },

  render: function () {
    if (this._needRender) {
      this._needRender = false;
      this.ctx.render(this.data.slide2d);
    }
  }

});

module.exports = SegmentSlide2d;
