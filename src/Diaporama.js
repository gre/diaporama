var raf = require("raf");
var Q = require("q");
var EventEmitter = require('events').EventEmitter;
var assign = require("object-assign");

var Channels = require("./Channels");
var findTransitionByName = require("./findTransitionByName");
var SegmentTransition = require("./SegmentTransition");
var SegmentKenBurns = require("./SegmentKenBurns");
var DiaporamaRenderingCanvas = require("./DiaporamaRenderingCanvas");


function Diaporama (container, data, opts) {
  // Validate arguments
  if (!(this instanceof Diaporama))
    return new Diaporama(container, data, opts);
  
  if (!container || !container.nodeType)
    throw new Error("Diaporama: a DOM container is required.");

  if (typeof data !== "object")
    throw new Error("Diaporama: a second argument is required. It must be either the diaporama.json data or the options object (with a data field).");

  if (!opts && data.data) {
    opts = data;
    data = null;
  }

  // Initial private state
  this._runningSegments = [];
  this._rendering = new DiaporamaRenderingCanvas(container); // TODO: implement DOM rendering target. auto-fallback & option to force it
  this._handleResize_bounded = this._handleResize.bind(this);

  // Opts
  for (var k in opts) {
    this[k] = opts[k];
  }
  if (data) this.data = data;

  if (!this._width || !this._height) // Hack.. needed?
    this.fitToContainer();

  if (this.autoplay) {
    this.once("loaded", this._start.bind(this));
  }

  this._requestResize();
}

Diaporama.prototype = assign({}, EventEmitter.prototype, {

  /// PUBLIC API

  play: function () {
    this.paused = false;
  },

  pause: function () {
    this.paused = true;
  },

  next: function () {
    var i = this._slideIndexForTime(this._currentTime);
    if (i === -1) return;
    i ++;
    if (i >= this._slideTimes.length) {
      if (this.loop) {
        i = 0;
      }
      else {
        return;
      }
    }
    this.currentTime = this._slideTimes[i];
  },

  prev: function () {
    var i = this._slideIndexForTime(this._currentTime);
    if (i === -1) return;
    i --;
    if (i < 0) {
      if (this.loop) {
        i = this._slideTimes.length - 1;
      }
      else {
        return;
      }
    }
    this.currentTime = this._slideTimes[i];
  },

  jump: function (slideIndex) {
    if (typeof slideIndex !== "number") throw new Error("Diaporama#jump requires the slide index number.");
    if (slideIndex < 0 || slideIndex >= this._slideTimes.length) return; // out of bound
    var i = this._slideIndexForTime(this._currentTime);
    if (i === slideIndex) return; // Already current slide
    this.currentTime = this._slideTimes[slideIndex];
  },

  fitToContainer: function () {
    var container = this._container;
    var bound = container.getBoundingClientRect();
    this._width = bound.width;
    this._height = bound.height;
    this._requestResize();
  },
 
  // PRIVATE defaults
  _loop: false,
  _autoplay: false,
  _curLoop: null,
  _currentTime: 0,
  _startLoopId: 0,
  _needResize: null,
  _resolution: window.devicePixelRatio || 1,

  // PRIVATE methods

  _loadImages: function () {
    var store = this._rendering.images;
    var ready = Q.all(this._data.timeline.map(function (item) {
      return store.add(item.image);
    }));
    var self = this;
    ready.then(function () {
      self.emit("loaded");
      self._ready = 1;
    }).done();
  },

  _loadTransitions: function () {
    var self = this;
    var store = this._rendering.transitions;
    this._data.timeline.forEach(function (item) {
      var name = item.transitionNext && item.transitionNext.name;
      if (name && !store.has(name)) {
        var transitionObject = self.findTransitionByName(name);
        if (transitionObject) {
          store.set(name, transitionObject);
        }
      }
    });
  },

  _requestResize: function () {
    if (this._needResize !== null) return; // already pending request
    this._needResize = raf(this._handleResize_bounded);
  },

  _handleResize: function () {
    if (this._needResize === null) return;
    this._needResize = null;
    this._resize();
  },

  _resize: function () {
    var w = this._width, h = this._height, resolution = this._resolution;
    this._rendering.resize(w, h, resolution);
    for (var i = 0; i < this._runningSegments.length; ++i) {
      this._runningSegments[i].resize(w, h, resolution);
    }
    this.emit("resize", w, h);
    if (this._ready && this._curLoop === null)
      this._render();
  },

  findTransitionByName: function (name) {
    return findTransitionByName(name, this.GlslTransitions || this._data && this._data.transitions || {});
  },

  _computeTimelineSegments: function () {
    // FIXME TODO For now we don't do "diff", we will just trash and recreate everything for now.
    var segment;
    while ( (segment = this._runningSegments.pop()) ) {
      var evtLeave = segment.leave();
      if (evtLeave) this.emit.apply(this, evtLeave); // The events here will be ugly until we have a proper diff implementation
    }

    var slideTimes = [];
    var segments = [];
    var diaporama = this._data;
    var t = 0;
    var lastTransitionDuration = 0;

    var altKenburns = false;
    for (var i = 0; i < diaporama.timeline.length; i++) {
      slideTimes.push(t);
      var kenburnsChannels = [ Channels.KENBURNS_1, Channels.KENBURNS_2 ];
      if (altKenburns) kenburnsChannels.reverse();
      altKenburns = !altKenburns;

      var item = diaporama.timeline[i];
      var tnext = item.transitionNext;
      var tnextDuration = tnext && tnext.duration || 0;
      segments.push(new SegmentKenBurns(t - lastTransitionDuration, t + item.duration + tnextDuration, kenburnsChannels[0], item, i));
      lastTransitionDuration = tnextDuration;
      t += item.duration;

      if (tnext) {
        var j = i+1 < diaporama.timeline.length ? i+1 : 0;
        if (j !== 0 || this.loop) {
          segments.push(new SegmentTransition(t, t + tnextDuration, Channels.TRANSITION, kenburnsChannels, tnext, i, j));
        }
        t += tnextDuration;
      }
    }

    segments.sort(Channels.sort);

    this._slideTimes = slideTimes;
    this._segments = segments;
    this._duration = t - lastTransitionDuration;
  },

  _slideIndexForTime: function (t) {
    var slideTimes = this._slideTimes;
    if (!slideTimes) return -1;
    if (t < 0 || t >= this._duration) return -1;
    var slideTimesLength = slideTimes.length;
    for (var i=0; i<slideTimesLength; ++i) {
      if (t < slideTimes[i])
        return i-1;
    }
    return slideTimesLength-1;
  },

  _render: function () {
    this._handleResize();
    var segments = this._segments;
    if (segments.length===0) return;
    var currentTime = this._currentTime;
    var runningSegments = this._runningSegments;

    for (var i=0; i<segments.length; ++i) {
      var segment = segments[i];
      var runningIndex = runningSegments.indexOf(segment);
      var running = runningIndex !== -1;
      if (segment.timeInside(currentTime)) {
        if (!running) {
          runningSegments.push(segment);
          var evt = segment.enter(this._rendering);
          if (evt) this.emit.apply(this, evt);
        }
      }
      else {
        if (running) {
          runningSegments.splice(runningIndex, 1);
          var evtLeave = segment.leave();
          if (evtLeave) this.emit.apply(this, evtLeave);
        }
      }
    }
    runningSegments.sort(Channels.sort);

    if (runningSegments.length > 0) {
      for (var s = runningSegments.length-1; s >= 0; s--) {
        runningSegments[s].render(currentTime);
      }
      this._rendering.switchChannel(runningSegments[0].channel);
      return true;
    }
    
    return false;
  },

  _start: function () {
    var self = this;
    var loopId = ++this._startLoopId;
    var last;
    this._curLoop = raf(function loop (t) {
      if (self._startLoopId !== loopId) return;
      raf(loop);
      if (!last) {
        // First tick
        last = t;
        self.emit("play");
      }
      var dt = t - last;
      last = t;
      self._currentTime += dt;
      var continuing = self._render();
      if (!continuing) {
        if (self.loop) {
          self.currentTime = 0;
        }
        else {
          self._stop(true);
        }
      }
    });
  },

  _stop: function (endReached) {
    this._startLoopId++;
    if (this._curLoop !== null) {
      raf.cancel(this._curLoop);
      this._curLoop = null;
      this.emit("pause");
      if (endReached) this.emit("ended");
    }
  }

});

// Public fields

Object.defineProperty(Diaporama.prototype, "loop", {
  set: function (loop) {
    this._loop = loop;
  },
  get: function () {
    return this._loop;
  }
});

Object.defineProperty(Diaporama.prototype, "autoplay", {
  set: function (autoplay) {
    this._autoplay = autoplay;
  },
  get: function () {
    return this._autoplay;
  }
});

Object.defineProperty(Diaporama.prototype, "data", {
  set: function (data) {
    var prev = this._data;
    this._data = data;
    if (data.timeline.length === 0)
      this._rendering.emptyChild();
    this._computeTimelineSegments(prev);
    this._loadImages();
    this._loadTransitions();
    if (this._ready)
      this._render();
  },
  get: function () {
    return this._data;
  }
});

Object.defineProperty(Diaporama.prototype, "resolution", {
  set: function (resolution) {
    if (resolution !== this._resolution) {
      this._resolution = resolution;
      this._requestResize();
    }
  },
  get: function () {
    return this._resolution;
  }
});

Object.defineProperty(Diaporama.prototype, "width", {
  set: function (width) {
    if (width !== this._width) {
      this._width = width;
      this._requestResize();
    }
  },
  get: function () {
    return this._width;
  }
});

Object.defineProperty(Diaporama.prototype, "height", {
  set: function (height) {
    if (height !== this._height) {
      this._height = height;
      this._requestResize();
    }
  },
  get: function () {
    return this._height;
  }
});

Object.defineProperty(Diaporama.prototype, "currentTime", {
  set: function (t) {
    this._currentTime = Math.max(0, t);
    if (this._curLoop === null)
      this._render();
  },
  get: function () {
    return this._currentTime;
  }
});

Object.defineProperty(Diaporama.prototype, "paused", {
  set: function (paused) {
    var _paused = this._curLoop === null;
    if (paused !== _paused) {
      if (paused) this._stop();
      else this._start();
    }
  },
  get: function () {
    return this._curLoop === null;
  }
});

module.exports = Diaporama;

