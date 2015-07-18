var assign = require("object-assign");
var EventEmitter = require("events").EventEmitter;
var MediaTypes = require("./MediaTypes");
var hash = require("./loaders/hash");

var loaders = {};
loaders[MediaTypes.VIDEO] = require("./loaders/video");
loaders[MediaTypes.IMAGE] = require("./loaders/image");

function ResourceLoader (parallelThreshold) {
  this.resources = {};
  this.types = {};
  this._loading = {};
  this._threshold = parallelThreshold || 3;
  this._queue = [];
}

ResourceLoader.prototype = assign({}, EventEmitter.prototype, {
  destroy: function () {
    this.removeAllListeners();
    this.resources = {};
    this.types = {};
    this._loading = {};
    this._queue = [];
  },

  // TODO Split the semantic of "hasPending" and "hasReady". same for StoreTransitions
  has: function (descr) {
    return (hash(descr) in this.resources);
  },

  get: function (descr) {
    return this.resources[hash(descr)];
  },

  load: function (descr, type) {
    var key = hash(descr);
    this.types[key] = type;
    if (Object.keys(this._loading).length >= this._threshold)
      this._queue.push(descr);
    else
      this._load(descr);
  },

  _load: function (descr) {
    var key = hash(descr);
    if (key in this._loading) return; // Already pending
    var type = this.types[key];
    this._take(descr);
    var self = this;
    loaders[type].call(this, descr, function (res) {
      if (self._release(descr)) {
        self.resources[key] = res;
        self.emit("load", descr, res);
      }
    }, function (err) {
      self.emit("error", descr, err);
    });
  },

  _take: function (descr) {
    this._loading[hash(descr)] = descr;
  },

  _release: function (descr) {
    var key = hash(descr);
    if (key in this._loading) {
      delete this._loading[key];
      if (this._queue.length > 0)
        this._load(this._queue.shift());
      return true;
    }
    else {
      return false;
    }
  }

});

module.exports = ResourceLoader;
