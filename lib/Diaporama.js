var raf = require("raf");
var EventEmitter = require("events").EventEmitter;
var assign = require("object-assign");
var BezierEasing = require("bezier-easing");
var croissant = require("croissant");
var MediaLoader = require("./MediaLoader");
var hash = require("./hashResource");
var Channels = require("./Channels");
var findTransitionByName = require("./findTransitionByName");
var DiaporamaRenderingCanvas = require("./DiaporamaRenderingCanvas");
var DiaporamaRenderingDOM = require("./DiaporamaRenderingDOM");
var SegmentTimeline = require("./SegmentTimeline");
var TimeInterval = require("./TimeInterval");
var DiaporamaFormatError = require("./DiaporamaFormatError");
var WebGLDetector = require("./WebGLDetector");
var forEachSlide2dImage = require("./forEachSlide2dImage");

var RENDER_EMPTY = 0,
  RENDER_WAITING = 1,
  RENDER_PLAYING = 2;

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
  else if (mode==="webgl" || mode==="canvas") {
    if (webglDetector.supported()) {
      return "webgl";
    }
    else {
      return null;
    }
  }
  return mode;
}

function createRendering (media, container, background, mode) {
  switch (mode) {
  case "webgl":
    return new DiaporamaRenderingCanvas(media, container, background);
  case "dom":
    return new DiaporamaRenderingDOM(media, container, background);
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
  this._segments = [];
  this._runningSegments = [];
  this._renderingMode = guessMode(opts.renderingMode);
  if (!this._renderingMode) {
    throw new Error("No rendering is suitable for renderingMode="+opts.renderingMode);
  }
  var media = new MediaLoader(
    croissant.fallbackBlack(
      croissant.timeout(
        croissant.loader,
        opts.networkTimeout || 60000)));
  this._rendering = createRendering(media, container, opts.backgroundColor || this._backgroundColor, this._renderingMode);

  // Delete handled options that are not possible to set.
  delete opts.renderingMode;
  delete opts.backgroundColor;
  this._handleResize = this._handleResize.bind(this);
  this._handleRender = this._handleRender.bind(this);
  this.node = container;

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
    if (this._destroyed) return;
    this._destroyed = true;
    this.emit("destroy");
    this.removeAllListeners();
    if (this._feedSubscription) {
      this._feedSubscription.dispose();
    }
    if (this._stopCurrentDiaporamaLoading) {
      this._stopCurrentDiaporamaLoading();
      this._stopCurrentDiaporamaLoading = null;
    }
    this._stop();
    this._destroySegments(this._segments);
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
      if (this._loop && !this._feeded) {
        i = 0;
      }
      else {
        return;
      }
    }
    this._slideToTime(this._slideTimes[i], duration, true);
  },

  prev: function (duration) {
    var i = this._slideIndexForTime(
      this._slidingTarget ?
      this._slidingTarget.to :
      this._currentTime);
    if (i === -1) return;
    i --;
    if (i < 0) {
      if (this._loop && !this._feeded) {
        i = this._slideTimes.length - 1;
      }
      else {
        return;
      }
    }
    this._slideToTime(this._slideTimes[i], duration, false);
  },

  jump: function (slideIndex, duration) {
    if (typeof slideIndex !== "number") throw new Error("Diaporama#jump requires the slide index number.");
    if (slideIndex < 0 || slideIndex >= this._slideTimes.length) return; // out of bound
    var i = this._slideIndexForTime(this._currentTime);
    if (i === slideIndex) return; // Already current slide
    this._slideToTime(this._slideTimes[slideIndex], duration);
  },

  fitToContainer: function () {
    var container = this.node;
    var bound = container.getBoundingClientRect();
    this._width = bound.width;
    this._height = bound.height;
    this._requestResize();
  },

  feed: function (observable, opts) {
    var self = this;
    if (self._feeded) throw new Error("feed can only work once at a time.");
    if (!opts) opts={};
    var freeSlideBehind = opts.freeSlideBehind || Infinity;
    self._feeded = true;
    self._feedSubscription = observable.subscribe(function (newContent) {
      var data = self.data;
      var slide = self.slide;
      var timeline = data.timeline.concat(newContent);
      var toFree = slide - freeSlideBehind;
      if (toFree > 0) {
        var d = 0;
        for (var i=0; i<toFree; i++) {
          var s = timeline[i];
          d += (s.duration||0) + (s.transitionNext && s.transitionNext.duration || 0);
        }
        timeline.splice(0, toFree);
        self.currentTime -= d;
      }
      self.data = assign({}, data, {
        timeline: timeline
      });
    }, function (error) {
      self.emit("error", error);
      self._feeded = false;
    }, function () {
      self._feeded = false;
    });

    return self._feedSubscription;
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
  _timeBuffered: 0,
  _feeded: false,

  // PRIVATE initial state
  _curLoop: null,
  _startLoopId: 0,
  _needResize: null,
  _needRender: null,
  _slidingTarget: null,

  // PRIVATE methods

  _loadMedia: function () {
    if (this._stopCurrentDiaporamaLoading) {
      this._stopCurrentDiaporamaLoading();
      this._stopCurrentDiaporamaLoading = null;
    }
    var self = this;
    self._timeBuffered = 0;

    var rendering = this._rendering;
    var media = rendering.media;
    var toload = {};
    var ready = [];

    function addSrc (src) {
      var key = hash(src);
      if (!(key in toload))
        toload[key] = src;
    }

    this._data.timeline.forEach(function (item) {
      if (item.video) {
        var video = self._resolve(item.video, "video");
        addSrc(video);
      }
      else if (item.image)
        addSrc({ "image": item.image });
      else if (item.slide2d)
        forEachSlide2dImage(item.slide2d.draws, function (src) {
          addSrc({ "image": src });
        });
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

    if (Object.keys(toload).length === 0) {
      setTimeout(function() {
        self._computeTimeBuffered();
        canplay();
        canplaythrough();
        load();
      }, 0);
      return;
    }

    var loadStart = Date.now();

    function watch () {
      self._requestRender();
      self._computeTimeBuffered();

      var timeBuffered = self.timeBuffered;

      self.emit("progress", {
        timeBuffered: timeBuffered,
        loaded: ready.length,
        total: Object.keys(toload).length
      });

      if (ready.length === Object.keys(toload).length) {
        canplay();
        canplaythrough();
        load();
        unbind();
      }
      else {
        if (!_canplay && timeBuffered > 0) {
          canplay();
        }

        if (_canplay && !_canplaythrough) {
          // Heuristic to trigger the canplaythrough (FIXME very naive)
          var totalDuration = self.duration;
          var playbackRate = self.playbackRate;
          var elapsed = Date.now() - loadStart;
          if (timeBuffered - 4000 > playbackRate * elapsed &&
            0.8 * ready.length / Object.keys(toload).length > playbackRate * elapsed / totalDuration) {
            canplaythrough();
          }
        }
      }
    }

    function onLoad (src) {
      if (!(hash(src) in toload)) return; // Don't care about this guy
      ready.push(src);
      watch();
    }

    function onError (src, error) {
      self.emit("error", new Error("Failure to load "+src), error);
      unbind();
    }

    setTimeout(watch, 0);
    var interval = setInterval(watch, 200);

    function unbind () {
      media.removeListener("load", onLoad);
      media.removeListener("error", onError);
      clearInterval(interval);
    }
    media.on("load", onLoad);
    media.on("error", onError);
    for (var key in toload) {
      media.load(toload[key]);
    }

    this._stopCurrentDiaporamaLoading = unbind;
  },

  _loadTransitions: function () {
    var store = this._rendering.transitions;
    if (!store) return;
    var transitionsDataset = this._data.transitions || {};
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
    if (this._destroyed) return;
    var w = this._width, h = this._height, resolution = this._resolution;
    this._rendering.resize(w, h, resolution);
    for (var i = 0; i < this._runningSegments.length; ++i) {
      this._runningSegments[i][1].resize(w, h, resolution);
    }
    this.emit("resize", w, h);
    this._requestRender();
  },

  _destroySegments: function (segs) {
    var segment;
    while ( (segment = segs.pop()) ) {
      if (segment[1].destroy) segment[1].destroy();
    }
  },

  _computeTimelineSegments: function () {
    // FIXME TODO For now we don't do "diff", we will just trash and recreate everything for now.
    // we should do that AT LEAST for _runningSegments, to not leave() them if it has just changed in position / duration
    var segment;
    while ( (segment = this._runningSegments.pop()) ) {
      var evtLeave = segment[1].leave();
      if (evtLeave) this.emit.apply(this, evtLeave); // The events here will be ugly until we have a proper diff implementation
    }

    this._destroySegments(this._segments);

    var loop = this.loop;
    var diaporama = this._data;
    var tlength = diaporama.timeline.length;

    var t = 0;
    var lastTransitionDuration = 0;
    var slideTimes = [];
    var segments = [];
    var transitions = [];
    // Iterate over elements to generate element segments and prepare transition infos in transitions
    for (var i = 0; i < tlength; i++) {
      slideTimes.push(t);

      var item = assign({}, diaporama.timeline[i]);
      var duration = item.duration || 0;
      var tnext = item.transitionNext;
      var tnextDuration = tnext && tnext.duration || 0;

      var channelIndex = i === tlength-1 ? 2 : ( i % 2 );
      if (item.video || item.image) {
        if (item.video)
          item.video = this._resolve(item.video, "video");
        if (item.image)
          item.image = this._resolve(item.image, "image");
        segment = new this._rendering.SegmentKenBurns(Channels.KENBURNS[channelIndex], item, this);
      }
      else if (item.slide2d) {
        segment = new this._rendering.SegmentSlide2d(Channels.SLIDE2D[channelIndex], item);
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
      // in loop-mode we create a final segment that render the first slide
      // in order to have a seamless slideshow.
      var firstSegment = segments[0][1];
      var timeInterval = new TimeInterval(dur, dur+lastTransitionDuration);
      var seg = Object.create(SegmentTimeline.prototype);
      assign(seg, firstSegment);
      // methods to proxy
      ["ready", "resize", "toString"].forEach(function (key) {
        seg[key] = firstSegment[key].bind(firstSegment);
      });
      // enter and leave should not return events (silently)
      ["enter", "leave"].forEach(function (key) {
        seg[key] = function () {
          firstSegment[key].apply(firstSegment, arguments);
        };
      });
      // render will always render at t=0
      seg.render = function () {
        return firstSegment.render(0, timeInterval);
      };
      segments.push([
        timeInterval,
        seg
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

  // direction: undefined mean no direction. true: right, false: left
  _slideToTime: function (to, duration, direction) {
    var from = this._currentTime;
    if (to===from) return;
    if (this._loop && !this._feeded) {
      var loopDuration = this.duration;
      var cur = Math.abs(to - from);
      var aft = Math.abs(to + loopDuration - from);
      var bef = Math.abs(to - loopDuration - from);
      if (direction === undefined) {
        // Find the closest 'to' assuming loop is enabled
        if (aft < cur || bef < cur) {
          if (aft < bef)
            to += loopDuration;
          else
            to -= loopDuration;
        }
      }
      else {
        if (direction) {
          if (aft < cur)
            to += loopDuration;
        }
        else {
          if (bef < cur)
            to -= loopDuration;
        }
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
    if (!this._loop || this._feeded) {
      return Math.max(0, Math.min(t, duration));
    }
    else {
      if (!duration) return 0;
      return (t+duration) % duration;
    }
  },

  _render: function () {
    if (this._destroyed) return;
    var rendering = this._rendering;
    this._handleResize();
    var segments = this._segments;
    if (segments.length===0) {
      rendering.render(0, []);
      this.emit("render", 0, RENDER_EMPTY);
      return RENDER_EMPTY;
    }
    var currentTime = this._normalizeTime(this._currentTime);
    var runningSegments = this._runningSegments;
    var notReady = false;

    var i, segment;
    var entering = [], leaving = [];
    var seglen = segments.length;
    var segsInTime = 0;
    for (i=0; i<seglen; ++i) {
      segment = segments[i];
      var runningIndex = runningSegments.indexOf(segment);
      var running = runningIndex !== -1;
      if (segment[0].timeInside(currentTime)) {
        segsInTime ++;
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

    if (currentTime === 0 || runningSegments.length > 0) {
      if (this._rendering.render(currentTime, runningSegments)) {
        notReady = true;
      }
    }
    var state = segsInTime > 0 ?
      (notReady ? RENDER_WAITING : RENDER_PLAYING) :
      RENDER_EMPTY;

    this._currentRenderState = state;
    this.emit("render", currentTime, state);
    if (this._userJump) {
      this._userJump = false;
      this.emit("seeked", currentTime, state);
    }
    return state;
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
      if (state === RENDER_EMPTY) {
        if (self._feeded) return;
        if (self.loop) {
          self.currentTime = 0;
        }
        else {
          self._stop(true);
        }
      }
      else if (state === RENDER_PLAYING) {
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
  },

  _resolve: function (descr, mime) {
    var data = this.data;

    descr = typeof descr === "string" &&
      data &&
      data.resources &&
      descr in data.resources &&
      data.resources[descr] ||
      descr;

    if (typeof descr === "string") {
      var obj = {};
      obj[mime] = descr;
      descr = obj;
    }

    return descr;
  },

  _computeTimeBuffered: function () {
    if (!this._data) return this._timeBuffered = 0;
    var rendering = this._rendering;
    var segments = this._segments;
    var seglen = segments.length;
    var unreachables = [];
    for (var i=0; i<seglen; ++i) {
      var segment = segments[i];
      if (!segment[1].ready(rendering)) {
        unreachables.push(segment[0].startT);
      }
    }
    if (unreachables.length > 0) return this._timeBuffered = Math.min.apply(Math, unreachables);
    return this._timeBuffered = this.duration;
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
          this._computeTimeBuffered();
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
      this._currentRenderState = RENDER_WAITING;
      this._data = data;
      this._computeTimelineSegments(prev);
      this._loadTransitions();
      this._loadMedia();
      this._requestRender();
      this.emit("data", data);
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
      this._userJump = true;
      this._currentTime = this._normalizeTime(t);
      this._requestRender();
    },
    get: function () {
      return this._currentTime;
    }
  },

  playbackRate: {
    set: function (playbackRate) {
      if (this._playbackRate === playbackRate) return;
      this._playbackRate = playbackRate;
      this.emit("ratechange", playbackRate);
    },
    get: function () {
      return this._playbackRate;
    }
  },

  slide: {
    set: function (slide) {
      var current = this._slideIndexForTime(this._currentTime);
      if (current === slide) return;
      this.jump(slide);
    },
    get: function () {
      return this._slideIndexForTime(this._currentTime);
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
      if (this._loop && !this._feeded)
        return duration + (this._lastTransitionDuration||0);
      else
        return duration;
    },
    set: function () {
      throw new Error("Diaporama: duration is a read-only value.");
    }
  },

  slides: {
    get: function () {
      var data = this._data;
      return data && data.timeline && data.timeline.length || 0;
    },
    set: function () {
      throw new Error("Diaporama: slides is a read-only value.");
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
  },

  currentRenderState: {
    get: function () {
      return this._currentRenderState;
    },
    set: function () {
      throw new Error("Diaporama: currentRenderState is a read-only value.");
    }
  },

  timeBuffered: {
    get: function () {
      return this._timeBuffered;
    },
    set: function () {
      throw new Error("Diaporama: timeBuffered is a read-only value.");
    }
  }

});

Diaporama.RENDER_EMPTY = RENDER_EMPTY;
Diaporama.RENDER_WAITING = RENDER_WAITING;
Diaporama.RENDER_PLAYING = RENDER_PLAYING;

module.exports = Diaporama;
