var raf = require("raf");
var EventEmitter = require('events').EventEmitter;
var assign = require("object-assign");
var BezierEasing = require("bezier-easing");

var Channels = require("./Channels");
var findTransitionByName = require("./findTransitionByName");
var DiaporamaRenderingCanvas = require("./DiaporamaRenderingCanvas");
var DiaporamaRenderingDOM = require("./DiaporamaRenderingDOM");
var TimeInterval = require("./TimeInterval");
var DiaporamaFormatError = require("./DiaporamaFormatError");
var WebGLDetector = require("./WebGLDetector");

var RENDER_NO_SEGMENTS = 0,
    RENDER_NOT_READY = 1,
    RENDER_READY = 2;

function sortSegment (a, b) {
  return Channels.sort(a[1].channel, b[1].channel);
}

var webglDetector;

function guessMode (mode) {
  if (!webglDetector) {
    webglDetector = new WebGLDetector();
  }
  if (!mode) {
    mode = webglDetector.supported() ? "webgl" : "dom";
  }
  else if (mode==="webgl"||mode==="canvas") {
    if (webglDetector.supported()) {
      return "webgl";
    }
    else {
      return null;
    }
  }
  return mode;
}

function createRendering (container, background, mode) {
  switch (mode) {
    case "webgl":
      return new DiaporamaRenderingCanvas(container, background);
    case "dom":
      return new DiaporamaRenderingDOM(container, background);
  }
  return null;
}

var slideEase = BezierEasing(0.4, 0, 0.8, 1);
function slidingEasing (from, to, time, duration, initialPlaybackRate) {
  var p = slideEase(time / duration) + time * initialPlaybackRate / (to - from);
  return from + (to - from) * Math.max(0, Math.min(p, 1));
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
  this._renderingMode = guessMode(opts.renderingMode);
  this._rendering = createRendering(container, opts.backgroundColor || this._backgroundColor, this._renderingMode);
  // Delete handled options that are not possible to set.
  delete opts.renderingMode;
  delete opts.backgroundColor;
  this._handleResize = this._handleResize.bind(this);
  this._handleRender = this._handleRender.bind(this);
  this._container = container;

  // Opts
  for (var k in opts) {
    this[k] = opts[k];
  }
  if (data) this.data = data;

  if (this._width === null || this._height === null) // Hack.. needed?
    this.fitToContainer();

  var self = this;
  this.once("canplay", function () {
    self.renderNow();
  });
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

  next: function (duration) {
    var i = this._slideIndexForTime(
      this._slidingTarget ?
      this._slidingTarget.to :
      this._currentTime);
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
    this._slideToTime(this._slideTimes[i], duration);
  },

  prev: function (duration) {
    var i = this._slideIndexForTime(
      this._slidingTarget ?
      this._slidingTarget.to :
      this._currentTime);
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
    this._slideToTime(this._slideTimes[i], duration);
  },

  jump: function (slideIndex, duration) {
    if (typeof slideIndex !== "number") throw new Error("Diaporama#jump requires the slide index number.");
    if (slideIndex < 0 || slideIndex >= this._slideTimes.length) return; // out of bound
    var i = this._slideIndexForTime(this._currentTime);
    if (i === slideIndex) return; // Already current slide
    this._slideToTime(this._slideTimes[slideIndex], duration);
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
  _backgroundColor: [0,0,0],

  // PRIVATE initial state
  _curLoop: null,
  _startLoopId: 0,
  _needResize: null,
  _needRender: null,
  _slidingTarget: null,

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
      self._requestRender();
    }

    var _canplaythrough;
    function canplaythrough () {
      if (_canplaythrough) return;
      _canplaythrough = 1;
      self.emit("canplaythrough");
      self._requestRender();
    }

    function load () {
      self.emit("load");
      self._requestRender();
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
          var totalDuration = self.duration;
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
    if (!store) return;
    var transitionsDataset = this._data.transitions || this.GlslTransitions || {}; // FIXME: GlslTransitions deprecated
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
    this._needResize = raf(this._handleResize);
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

    var loop = this.loop;
    var diaporama = this._data;
    var tlength = diaporama.timeline.length;

    var extraLoopSegment;
    var t = 0;
    var lastTransitionDuration = 0;
    var slideTimes = [];
    var segments = [];
    var transitions = [];
    // Iterate over elements to generate element segments and prepare transition infos in transitions
    for (var i = 0; i < tlength; i++) {
      slideTimes.push(t);

      var item = diaporama.timeline[i];
      var duration = item.duration || 0;
      var tnext = item.transitionNext;
      var tnextDuration = tnext && tnext.duration || 0;

      var channelIndex = i === tlength-1 ? 2 : ( i % 2 );
      if (item.image) {
        if (i===0) {
          var staticItem = assign({}, item);
          staticItem.kenburns = assign({}, staticItem.kenburns);
          staticItem.kenburns.to = staticItem.kenburns.from;
          extraLoopSegment = new this._rendering.SegmentKenBurns(Channels.KENBURNS[channelIndex], staticItem);
        }
        segment = new this._rendering.SegmentKenBurns(Channels.KENBURNS[channelIndex], item);
        // ^ TODO: if there is no kenburns effect, we might have a different segment? alternatively SegmentKenBurns should do less work if the image is static
      }
      else if (item.canvas2d) {
        if (i===0) extraLoopSegment = new this._rendering.SegmentCanvas2d(Channels.CANVAS2D[channelIndex], item);
        segment = new this._rendering.SegmentCanvas2d(Channels.CANVAS2D[channelIndex], item);
      }
      else {
        throw new DiaporamaFormatError("timeline item can't be understood as a segment.", item);
      }

      segments.push([
        new TimeInterval(
          t - lastTransitionDuration,
          !loop && i===tlength-1 ? t + duration : t + duration + tnextDuration),
        segment
        ]);
      lastTransitionDuration = tnextDuration;
      t += duration;

      if (tnextDuration) {
        transitions.push({
          interval: new TimeInterval(t, t + tnextDuration),
          index: i
        });
        t += tnextDuration;
      }
    }
    var dur = t - lastTransitionDuration;

    var transitionsSegments = [];

    for (var k = 0; k < transitions.length; ++k) {
      var tr = transitions[k];
      var index = tr.index;
      var j = index+1 < diaporama.timeline.length ? index+1 : 0;
      var segmentFrom = segments[index][1];
      var segmentTo = segments[j][1];
      var next = diaporama.timeline[index].transitionNext;
      if (j!==0 || loop) {
        transitionsSegments.push([
          tr.interval,
          new this._rendering.SegmentTransition(Channels.TRANSITION, next, segmentFrom, segmentTo)
        ]);
      }
    }

    if (loop && segments.length) {
      var timeInterval = segments[0][0].clone();
      timeInterval.add(dur);
      segments.push([
        timeInterval,
        extraLoopSegment
      ]);
    }

    segments = transitionsSegments.concat(segments);
    segments.sort(sortSegment);

    this._slideTimes = slideTimes;
    this._segments = segments;
    this._duration = dur;
    this._lastTransitionDuration = lastTransitionDuration;
  },

  _slideIndexForTime: function (t) {
    var slideTimes = this._slideTimes;
    if (!slideTimes) return -1;
    t = this._normalizeTime(t);
    var slideTimesLength = slideTimes.length;
    for (var i=0; i<slideTimesLength; ++i) {
      if (t < slideTimes[i])
        return i-1;
    }
    return slideTimesLength-1;
  },

  _slideToTime: function (to, duration) {
    var from = this._currentTime;
    if (to===from) return;
    if (this._loop) {
      // Find the closest 'to' assuming loop is enabled
      var loopDuration = this.duration;
      var cur = Math.abs(to - from);
      var aft = Math.abs(to + loopDuration - from);
      var bef = Math.abs(to - loopDuration - from);
      if (aft < cur || bef < cur) {
        if (aft < bef)
          to += loopDuration;
        else
          to -= loopDuration;
      }
    }
    if (this.paused || !duration) {
      this._currentTime = to;
      this._requestRender();
    }
    else {
      var playbackRate = this._playbackRate;
      this._slidingTarget = {
        from: from,
        to: to,
        startTime: null, // will be set in the render loop
        duration: duration,
        initialPlaybackRate: (to>from) === (playbackRate>0) ? playbackRate : 0
      };
    }
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
    this._needRender = raf(this._handleRender);
  },

  _handleRender: function () {
    if (this._needRender === null) return;
    this._needRender = null;
    this._render();
  },

  _normalizeTime: function (t) {
    var duration = this.duration;
    if (!this._loop) {
      return Math.max(0, Math.min(t, duration));
    }
    else {
      if (!duration) return 0;
      return (t+duration) % duration;
    }
  },

  _render: function () {
    this._handleResize();
    var segments = this._segments;
    if (segments.length===0) return RENDER_NO_SEGMENTS;
    var currentTime = this._normalizeTime(this._currentTime);
    var runningSegments = this._runningSegments;
    var rendering = this._rendering;
    var notReady = false;

    var i, segment;
    var entering = [], leaving = [];
    var seglen = segments.length;
    for (i=0; i<seglen; ++i) {
      segment = segments[i];
      var runningIndex = runningSegments.indexOf(segment);
      var running = runningIndex !== -1;
      if (segment[0].timeInside(currentTime)) {
        if (!running) {
          if (!segment[1].ready(rendering)) {
            notReady = true;
            continue;
          }
          runningSegments.push(segment);
          entering.push(segment[1]);
        }
      }
      else {
        if (running) {
          runningSegments.splice(runningIndex, 1);
          leaving.push(segment[1]);
        }
      }
    }
    runningSegments.sort(sortSegment);

    for (i=leaving.length-1; i>=0; i--) {
      segment = leaving[i];
      var evtLeave = segment.leave();
      if (evtLeave) this.emit.apply(this, evtLeave);
    }
    for (i=entering.length-1; i>=0; i--) {
      segment = entering[i];
      var evt = segment.enter(rendering);
      if (evt) this.emit.apply(this, evt);
    }

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
        var slidingTarget = self._slidingTarget;
        if (slidingTarget !== null) {
          if (slidingTarget.startTime===null) slidingTarget.startTime = t;
          var relativeTime = t - slidingTarget.startTime;
          var to = slidingEasing(slidingTarget.from, slidingTarget.to, relativeTime, slidingTarget.duration, slidingTarget.initialPlaybackRate);
          if (Math.abs(slidingTarget.to - to) < 10 || relativeTime >= slidingTarget.duration) {
            self._currentTime = slidingTarget.to;
            self._slidingTarget = null;
          }
          else {
            self._currentTime = to;
          }
        }
        else {
          self._currentTime = self._normalizeTime(self._currentTime + dt * self._playbackRate);
        }
      }
    });
  },

  _stop: function (endReached) {
    this._startLoopId++;
    if (this._slidingTarget) {
      this.currentTime = this._slidingTarget.endAt;
      this._slidingTarget = null;
    }
    if (this._curLoop !== null) {
      raf.cancel(this._curLoop);
      this._curLoop = null;
      this.emit("pause");
      if (endReached) this.emit("ended");
    }
  }

});

// Public fields

Object.defineProperties(Diaporama.prototype, {

  loop: {
    set: function (value) {
      var loop = !!value;
      if (this._loop !== loop) {
        this._loop = loop;
        if (this._data) {
          this._computeTimelineSegments(this._data);
          this._requestRender();
        }
      }
    },
    get: function () {
      return this._loop;
    }
  },

  autoplay: {
    set: function (autoplay) {
      this._autoplay = autoplay;
    },
    get: function () {
      return this._autoplay;
    }
  },

  data: {
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
  },

  resolution: {
    set: function (resolution) {
      if (resolution !== this._resolution) {
        this._resolution = resolution;
        this._requestResize();
      }
    },
    get: function () {
      return this._resolution;
    }
  },

  width: {
    set: function (width) {
      if (width !== this._width) {
        this._width = width;
        this._requestResize();
      }
    },
    get: function () {
      return this._width;
    }
  },

  height: {
    set: function (height) {
      if (height !== this._height) {
        this._height = height;
        this._requestResize();
      }
    },
    get: function () {
      return this._height;
    }
  },

  currentTime: {
    set: function (t) {
      if (t === this._currentTime) return;
      this._currentTime = this._normalizeTime(t);
      this._requestRender();
    },
    get: function () {
      return this._currentTime;
    }
  },

  playbackRate: {
    set: function (playbackRate) {
      this._playbackRate = playbackRate;
    },
    get: function () {
      return this._playbackRate;
    }
  },

  paused: {
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
  },

  duration: {
    get: function () {
      var duration = this._duration || 0;
      if (this._loop)
        return duration + (this._lastTransitionDuration||0);
      else
        return duration;
    },
    set: function () {
      throw new Error("Diaporama: duration is a read-only value.");
    }
  },

  renderingMode: {
    get: function () {
      return this._renderingMode;
    },
    set: function () {
      throw new Error("Diaporama: setting renderingMode afterwards is not supported.");
    }
  },

  backgroundColor: {
    get: function () {
      return this._backgroundColor;
    },
    set: function () {
      throw new Error("Diaporama: setting backgroundColor afterwards is not supported.");
    }
  }
});

module.exports = Diaporama;
