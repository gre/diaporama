var Qimage = require("qimage");
var assign = require("object-assign");
var EventEmitter = require('events').EventEmitter;

function StoreImages () {
  this.imgs = {};
  this.p = {};
}

StoreImages.prototype = assign({}, EventEmitter.prototype, {
  has: function (url) {
    return (url in this.imgs);
  },

  add: function (url) {
    var self = this;
    if (this.has(url)) return this.p[url];
    return (this.p[url] =
      Qimage.anonymously(url)
      .then(function (img) {
        self.emit("load", img);
        self.imgs[url] = img;
        return img;
      })
      .fail(function (error) {
        self.emit("error", error);
        self.imgs[url] = null;
        throw error;
      }));
  },

  get: function (url) {
    return this.imgs[url];
  },

  promise: function (url) {
    return this.p[url];
  }
});

module.exports = StoreImages;
