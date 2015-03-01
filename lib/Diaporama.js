var raf = require("raf");
var EventEmitter = require('events').EventEmitter;
var assign = require("object-assign");

var Channels = require("./Channels");
var findTransitionByName = require("./findTransitionByName");
var SegmentTransition = require("./SegmentTransition");
var SegmentKenBurns = require("./SegmentKenBurns");
var SegmentCanvas2d = require("./SegmentCanvas2d");
var DiaporamaRenderingCanvas = require("./DiaporamaRenderingCanvas");
var TimeInterval = require("./TimeInterval");
var DiaporamaFormatError = require("./DiaporamaFormatError");

var RENDER_NO_SEGMENTS = 0,
    RENDER_NOT_READY = 1,
    RENDER_READY = 2;

function sortSegment (a, b) {
  return Channels.sort(a[1].channel, b[1].channel);
}


function Diaporama (container, data, opts) {
  // Validate arguments
  if (!(this instanceof Diaporama))
    return new Diaporama(container, data, opts);
  
  if (!container || !container.nodeType)
    throw new Error("Diaporama: a DOM container is required.");

  // opts can be given at 2nd argument. We detect it if there is a "data" field.
  if (data && !opts && data.data) {
    opts = data;
    data = null;
  }
  if (!opts) {
    opts = {};
  }

  // Initial private state
  this._runningSegments = [];
  this._rendering = new DiaporamaRenderingCanvas(container, opts.backgroundColor || this.backgroundColor); // TODO: implement DOM rendering target. auto-fallback & option to force it
  this._handleResize_bounded = this._handleResize.bind(this);
  this._handleRender_bounded = this._handleRender.bind(this);
  this._container = container;

  // Opts
  for (var k in opts) {
    this[k] = opts[k];
  }
  if (data) this.data = data;

  if (this._width === null || this._height === null) // Hack.. needed?
    this.fitToContainer();

  var self = this;
  this.once("canplaythrough", function () {
    if (self._autoplay) {
      self._start();
    }
    else {
      self._requestRender();
    }
  });

  this._requestResize();
}

Diaporama.prototype = assign({}, EventEmitter.prototype, {

  // Static public defaults
  backgroundColor: [0,0,0],

  /// PUBLIC API

  destroy: function () {
    this.emit("destroy");
    this.removeAllListeners();
    if (this._stopCurrentDiaporamaLoading) {
      this._stopCurrentDiaporamaLoading();
      this._stopCurrentDiaporamaLoading = null;
    }
    this._stop();
    this._rendering.destroy();
  },

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
      if (this._loop) {
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
      if (this._loop) {
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
 
  // PRIVATE initial defaults
  _playbackRate: 1,
  _loop: false,
  _autoplay: false,
  _paused: true,
  _width: null,
  _height: null,
  _resolution: window.devicePixelRatio || 1,
  _currentTime: 0,
  _duration: 0,

  // PRIVATE initial state
  _curLoop: null,
  _startLoopId: 0,
  _needResize: null,
  _needRender: null,

  // PRIVATE methods

  _loadImages: function () {
    if (this._stopCurrentDiaporamaLoading) {
      this._stopCurrentDiaporamaLoading();
      this._stopCurrentDiaporamaLoading = null;
    }
    var self = this;

    var store = this._rendering.images;
    var toload = [];
    var ready = [];
    this._data.timeline.forEach(function (item) {
      var src = item.image;
      if (!src) return;
      if (!store.has(src)) {
        toload.push(src);
      }
    });

    var _canplay;
    function canplay () {
      if (_canplay) return;
      _canplay = 1;
      self.emit("canplay");
    }

    var _canplaythrough;
    function canplaythrough () {
      if (_canplaythrough) return;
      _canplaythrough = 1;
      self.emit("canplaythrough");
    }

    function load () {
      self.emit("load");
    }

    if (toload.length === 0) {
      canplay();
      canplaythrough();
      load();
      return;
    }

    var loadStart = Date.now();
    var first = toload[0];

    function watch () {
      if (ready.length === toload.length) {
        canplay();
        canplaythrough();
        load();
        unbind();
      }
      else {
        if (!_canplay) {
          if (!first || ready.indexOf(first) !== -1) {
            canplay();
          }
        }
        
        if (_canplay && !_canplaythrough) {
          // Heuristic to trigger the canplaythrough (FIXME very naive)
          var elapsed = Date.now() - loadStart;
          var totalDuration = self._duration;
          if (0.8 * ready.length / toload.length > elapsed / totalDuration) {
            canplaythrough();
          }
        }
      }
    }

    function onLoad (src) {
      if (toload.indexOf(src) === -1) return; // Don't care about this guy
      self.emit("progress", ready.length/toload.length);
      ready.push(src);
      watch();
    }

    function onError (src, error) {
      self.emit("error", new Error("Failure to load "+src), error);
      unbind();
    }

    var interval = setInterval(watch, 200);

    function unbind () {
      store.removeListener("load", onLoad);
      store.removeListener("error", onError);
      clearInterval(interval);
    }
    store.on("load", onLoad);
    store.on("error", onError);
    for (var i=0; i<toload.length; ++i) {
      store.load(toload[i]);
    }

    this._stopCurrentDiaporamaLoading = unbind;
  },

  _loadTransitions: function () {
    var store = this._rendering.transitions;
    var transitionsDataset = this._data.transitions || this.GlslTransitions || {};
    this._data.timeline.forEach(function (item) {
      var name = item.transitionNext && item.transitionNext.name;
      if (name && !store.has(name)) {
        var transitionObject = findTransitionByName(name, transitionsDataset);
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
      this._runningSegments[i][1].resize(w, h, resolution);
    }
    this.emit("resize", w, h);
    this._requestRender();
  },

  _computeTimelineSegments: function () {
    // FIXME TODO For now we don't do "diff", we will just trash and recreate everything for now.
    var segment;
    while ( (segment = this._runningSegments.pop()) ) {
      var evtLeave = segment[1].leave();
      if (evtLeave) this.emit.apply(this, evtLeave); // The events here will be ugly until we have a proper diff implementation
    }

    var slideTimes = [];
    var segments = [];
    var transitions = [];
    var diaporama = this._data;
    var t = 0;
    var lastTransitionDuration = 0;

    var altKenburns = false;
    for (var i = 0; i < diaporama.timeline.length; i++) {
      slideTimes.push(t);

      var item = diaporama.timeline[i];
      var duration = item.duration || 0;
      var tnext = item.transitionNext;
      var tnextDuration = tnext && tnext.duration || 0;
      var channel;

      if (item.image) {
        channel = altKenburns ? Channels.KENBURNS_1 : Channels.KENBURNS_2;
        // ^ TODO : for last item, we might use a third channel to fix the loop issue
        altKenburns = !altKenburns;
        segment = new SegmentKenBurns(channel, item, i);
        // ^ TODO: if there is no kenburns effect, we might have a different segment? alternatively SegmentKenBurns should do less work if the image is static
      }
      else if (item.canvas2d) {
        channel = Channels.CANVAS2D;
        segment = new SegmentCanvas2d(channel, item, i);
      }
      else {
        throw new DiaporamaFormatError("no valid format.", item);
      }

      segments.push([
        new TimeInterval(t - lastTransitionDuration, t + duration + tnextDuration),
        segment
      ]);
      lastTransitionDuration = tnextDuration;
      t += duration;

      if (tnextDuration) {
        transitions.push({
          interval: new TimeInterval(t, t + tnextDuration),
          i: i
        });
        t += tnextDuration;
      }
    }

    var transitionsSegments = [];

    for (var k = 0; k < transitions.length; ++k) {
      var tr = transitions[k];
      var i = tr.i;
      var j = i+1 < diaporama.timeline.length ? i+1 : 0;
      var segmentFrom = segments[i][1];
      var segmentTo = segments[j][1];
      var tnext = diaporama.timeline[i].transitionNext;
      if (j !== 0 || this._loop) {
        transitionsSegments.push([
          tr.interval,
          new SegmentTransition(Channels.TRANSITION, tnext, i, j, segmentFrom, segmentTo)
        ]);
      }
    }

    segments = transitionsSegments.concat(segments);
    segments.sort(sortSegment);

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

  /**
   * Use only if you programmatically need to retrieve the result of properties changes now!
   */
  renderNow: function () {
    this._needRender = true;
    this._handleRender();
  },

  _requestRender: function () {
    if (this._curLoop !== null) return; // We skip if there is a loop because it is useful to render otherwise.
    if (this._needRender !== null) return; // already pending request
    this._needRender = raf(this._handleRender_bounded);
  },

  _handleRender: function () {
    if (this._needRender === null) return;
    this._needRender = null;
    this._render();
  },

  _render: function () {
    this._handleResize();
    var segments = this._segments;
    if (segments.length===0) return;
    var currentTime = this._currentTime;
    var runningSegments = this._runningSegments;
    var rendering = this._rendering;

    var notReady = false;

    for (var i=0; i<segments.length; ++i) {
      var segment = segments[i];
      var runningIndex = runningSegments.indexOf(segment);
      var running = runningIndex !== -1;
      if (segment[0].timeInside(currentTime)) {
        if (!running) {
          if (!segment[1].ready(rendering)) {
            notReady = true;
            continue;
          }
          runningSegments.push(segment);
          var evt = segment[1].enter(rendering);
          if (evt) this.emit.apply(this, evt);
        }
      }
      else {
        if (running) {
          runningSegments.splice(runningIndex, 1);
          var evtLeave = segment[1].leave();
          if (evtLeave) this.emit.apply(this, evtLeave);
        }
      }
    }
    runningSegments.sort(sortSegment);

    if (runningSegments.length > 0) {
      for (var s = runningSegments.length-1; s >= 0; s--) {
        var seg = runningSegments[s];
        seg[1].render(seg[0].interpolate(currentTime));
      }
      this._rendering.switchChannel(runningSegments[0][1].channel);
      return notReady ? RENDER_NOT_READY : RENDER_READY;
    }
    
    return RENDER_NO_SEGMENTS;
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
      var state = self._render();
      if (state === RENDER_NO_SEGMENTS) {
        if (self.loop) {
          self.currentTime = 0;
        }
        else {
          self._stop(true);
        }
      }
      else if (state === RENDER_READY) {
        self._currentTime += dt * self._playbackRate;
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
    if (prev === data) return;
    this._data = data;
    if (data.timeline.length === 0)
      this._rendering.emptyChild();
    this._computeTimelineSegments(prev);
    this._loadTransitions();
    this._loadImages();
    this._requestRender();
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
    if (t === this._currentTime) return;
    this._currentTime = Math.max(0, t);
    this._requestRender();
  },
  get: function () {
    return this._currentTime;
  }
});

Object.defineProperty(Diaporama.prototype, "playbackRate", {
  set: function (playbackRate) {
    this._playbackRate = playbackRate;
  },
  get: function () {
    return this._playbackRate;
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

Object.defineProperty(Diaporama.prototype, "duration", {
  get: function () {
    return this._duration;
  },
  set: function () {
    throw new Error("Diaporama: duration is a read-only value.");
  }
});

module.exports = Diaporama;

