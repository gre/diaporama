var assign = require("object-assign");
var EventEmitter = require('events').EventEmitter;
var MediaTypes = require('./MediaTypes');

function ResourceLoader (parallelThreshold) {
  this.resources = {};
  this.types = {};
  this._loading = [];
  this._threshold = parallelThreshold || 3;
  this._queue = [];
}

var loaders = {};

loaders[MediaTypes.VIDEO] = function (src, success, failure) {
  var video = document.createElement('video');
  video.addEventListener("canplaythrough", function onLoadEvent () {
    video.removeEventListener("canplaythrough", onLoadEvent);
    success(video);
  }, false);
  video.onerror = failure;
  video.src = src;
  video.load();
};

loaders[MediaTypes.IMAGE] = function (src, success, failure) {
  var img = new window.Image();
  img.crossOrigin = true;
  img.onload = function () {
    success(img);
  };
  img.onabort = img.onerror = failure;
  img.src = src;
};


ResourceLoader.prototype = assign({}, EventEmitter.prototype, {
  destroy: function () {
    this.removeAllListeners();
    this.resources = {};
    this.types = {};
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

  load: function (url, type) {
    this.types[url] = type;
    if (this._loading.length >= this._threshold)
      this._queue.push(url);
    else
      this._load(url);
  },

  _load: function (url) {
    if (this._loading.indexOf(url) !== -1) return; // Already pending
    var type = this.types[url];
    this._take(url);
    var self = this;
    loaders[type].call(this, url, function (res) {
      if (self._release(url)) {
        self.resources[url] = res;
        self.emit("load", url, res);
      }
    }, function (err) {
      self.emit("error", url, err);
    });
  },

  _take: function (src) {
    this._loading.push(src);
  },

  _release: function (src) {
    var i = this._loading.indexOf(src);
    if (i === -1) return false;
    this._loading.splice(i, 1);
    if (this._queue.length > 0) {
      var newSrc = this._queue.shift();
      this._load(newSrc);
    }
    return true;
  }

});

module.exports = ResourceLoader;
