var assign = require("object-assign");
var EventEmitter = require('events').EventEmitter;

function StoreImages (parallelThreshold) {
  this.imgs = {};
  this._loading = [];
  this._threshold = parallelThreshold || 3;
  this._queue = [];
}

StoreImages.prototype = assign({}, EventEmitter.prototype, {
  destroy: function () {
    this.removeAllListeners();
    this.imgs = {};
    this._loading = [];
    this._queue = [];
  },

  // TODO Split the semantic of "hasPending" and "hasReady". same for StoreTransitions
  has: function (url) {
    return (url in this.imgs);
  },

  get: function (url) {
    return this.imgs[url];
  },

  load: function (url) {
    if (this._loading.length >= this._threshold)
      this._queue.push(url);
    else
      this._loadImage(url);
  },

  _loadImage: function (src) {
    if (this._loading.indexOf(src) !== -1) return; // Already pending
    var self = this;
    var img = new window.Image();
    img.crossOrigin = true;
    this._take(src);
    img.onload = function () {
      if (self._release(src)) {
        self.imgs[src] = img;
        self.emit("load", src, img);
      }
    };
    img.onabort = img.onerror = function (e) {
      if (self._release(src)) {
        self.imgs[src] = null;
        self.emit("error", src, e);
      }
    };
    img.src = src;
  },

  _take: function (src) {
    this._loading.push(src);
  },

  _release: function (src) {
    var i = this._loading.indexOf(src);
    if (i === -1) return false;
    this._loading.splice(i, 1);
    if (this._queue.length > 0) {
      var newImageSrc = this._queue.shift();
      this._loadImage(newImageSrc);
    }
    return true;
  }

});

module.exports = StoreImages;
