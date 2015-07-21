var assign = require("object-assign");
var EventEmitter = require("events").EventEmitter;
var hash = require("./hashResource");

/*
A wrapper on top of loader, that:
 - cache results
 - maximize parallel loading
 - provide events
*/
function MediaLoader (loader, parallelThreshold) {
  this.loader = loader;
  this.resources = {};
  this._loading = {};
  this._threshold = parallelThreshold || 3;
  this._queue = [];
}

MediaLoader.prototype = assign({}, EventEmitter.prototype, {
  destroy: function () {
    this.removeAllListeners();
    this.resources = {};
    for (var k in this._loading) {
      this._loading[k]();
    }
    this._loading = {};
    this._queue = [];

    this._imageResolver = function (url) {
      var res = this.get(url);
      return res && res.image || null;
    }.bind(this);
  },

  // TODO Split the semantic of "hasPending" and "hasReady". same for StoreTransitions
  has: function (descr) {
    return (hash(descr) in this.resources);
  },

  get: function (descr) {
    return this.resources[hash(descr)];
  },

  load: function (descr) {
    if (Object.keys(this._loading).length >= this._threshold)
      this._queue.push(descr);
    else
      this._load(descr);
  },

  getImageResolver: function () {
    return this._imageResolver;
  },

  _load: function (descr) {
    var key = hash(descr);
    if (key in this._loading) return; // Already pending
    var self = this;
    this._take(descr, this.loader(descr, function (res) {
      if (self._release(descr)) {
        self.resources[key] = res;
        self.emit("load", descr, res);
      }
    }, function (err) {
      self.emit("error", descr, err);
    }));
  },

  _take: function (descr, loadMeta) {
    this._loading[hash(descr)] = loadMeta;
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

module.exports = MediaLoader;
