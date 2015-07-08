var assign = require("object-assign");
var EventEmitter = require('events').EventEmitter;

function ResourceLoader (parallelThreshold) {
  this.resources = {};
  this._loading = [];
  this._threshold = parallelThreshold || 3;
  this._queue = [];
}

ResourceLoader.prototype = assign({}, EventEmitter.prototype, {
  destroy: function () {
    this.removeAllListeners();
    this.resources = {};
    this._loading = [];
    this._queue = [];
  },

  // TODO Split the semantic of "hasPending" and "hasReady". same for StoreTransitions
  has: function (url) {
    return (url in this.resources);
  },

  get: function (url) {
    return this.resources[url];
  },

  load: function (url) {
    if (this._loading.length >= this._threshold)
      this._queue.push(url);
    else {
      this._load(url);
    }
  },

  _load: function (url) {
    // FIXME FIXME FIXME very weak:
    // the type of the resource should not be guessed but we should trust the initial context
    if (url.match(/.mpeg$|.mp4$|.avi$|.mpg$|.webm$/)) {
      this._loadVideo(url);
    }
    else {
       this._loadImage(url);
    }
  },

  _loadVideo: function (src) {
    if (this._loading.indexOf(src) !== -1) return; // Already pending
    var self = this;
    this._take(src);

    var video = document.createElement('video');
    video.addEventListener("canplaythrough", function onLoadEvent () {
      video.removeEventListener("canplaythrough", onLoadEvent);
      if (self._release(src)) {
        self.resources[src] = video;
        self.emit("load", src, video);
      }
    }, false);
    video.onerror = function (e) {
      self.emit("error", src, e);
    };
    video.src = src;
    video.load();
  },

  _loadImage: function (src) {
    if (this._loading.indexOf(src) !== -1) return; // Already pending
    var self = this;
    var img = new window.Image();
    img.crossOrigin = true;
    this._take(src);
    img.onload = function () {
      if (self._release(src)) {
        self.resources[src] = img;
        self.emit("load", src, img);
      }
    };
    img.onabort = img.onerror = function (e) {
      if (self._release(src)) {
        self.resources[src] = null;
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
      this._load(newImageSrc);
    }
    return true;
  }

});

module.exports = ResourceLoader;
