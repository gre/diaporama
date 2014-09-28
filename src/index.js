var Q = require("q");
var Qimage = require("qimage");
var Qajax = require("qajax");
var GlslTransition = require("glsl-transition");
var GlslTransitions = require("glsl-transitions");
var BezierEasing = require("bezier-easing");
var Soundcloud = require("./soundcloud");

function findTransitionByName (name) {
  for (var i=0; i<GlslTransitions.length; ++i) {
    if (GlslTransitions[i].name === name) {
      return GlslTransitions[i];
    }
  }
}

function extend (obj) {
  var source, prop;
  for (var i = 1, length = arguments.length; i < length; i++) {
    source = arguments[i];
    for (prop in source) {
      if (source.hasOwnProperty(prop)) {
        obj[prop] = source[prop];
      }
    }
  }
  return obj;
}

var GLSL_IDENTITY_FROM = "#ifdef GL_ES\nprecision highp float;\n#endif\nuniform sampler2D from, to;\nuniform float progress;\nuniform vec2 resolution;\nvoid main() {vec2 p = gl_FragCoord.xy / resolution.xy;gl_FragColor = texture2D(from, p);}";

function Viewer (json, canvas, opts) {
  if (!opts) opts = {};
  this.data = json;
  this.cursor = 0;
  this.canvas = canvas;
  this.T = GlslTransition(this.canvas);
  this.identity = this.T(GLSL_IDENTITY_FROM);
  this.images = {};
  this.scPlayer = Soundcloud({client_id: opts.soundcloudClientId });
  json.timeline.forEach(function (item) {
    var url = item.image;
    this.images[url] = Qimage.anonymously(url);
  }, this);
  this.transitions = {};
  json.timeline.forEach(function (item) {
    var name = item.transitionNext && item.transitionNext.name;
    if (name && !(name in this.transitions)) {
      var transitionObject = findTransitionByName(name);
      if (transitionObject) {
        this.transitions[name] = {
          t: this.T(transitionObject.glsl),
          uniforms: transitionObject.uniforms
        };
      }
    }
  }, this);
  this._preloadAudio(json.music);
  console.log(json);
}

Viewer.prototype = {
  start: function () {
    var self = this;
    var data = this.data;
    var item = data.timeline[0];
    this._startAudio();
    return this.images[item.image]
      .then(this.displayImage.bind(this))
      .then(function () {
        return self.prepareNext();
      });
  },
  end: function () {
    this._stopAudio();
  },
  displayImage: function (img) {
    return this.identity({ from: img, to: img }, 100);
  },
  prepareNext: function () {
    var self = this;
    var data = this.data;
    var from = this.cursor;
    var endReached = from+1 === data.timeline.length;
    if (endReached && !data.loop) return this.end();
    var to = endReached ? 0 : from + 1;
    this.cursor = to;

    var itemDuration = data.timeline[from].duration;
    var transitionNext = data.timeline[from].transitionNext;
    var transition = transitionNext && transitionNext.name ?
      this.transitions[transitionNext.name] :
      { t: this.identity, uniforms: {} };
    var transitionDuration = transitionNext && transitionNext.duration || 0;
    var transitionUniforms = transitionNext && transitionNext.uniforms || {};
    var transitionEasing = BezierEasing.apply(null, transitionNext && transitionNext.easing || [0, 0, 1, 1]);

    return Q.all([
      this.images[data.timeline[from].image],
      this.images[data.timeline[to].image]
    ])
    .delay(itemDuration)
    .spread(function (fromImage, toImage) {
      if (transitionDuration)
        return transition.t(extend({ from: fromImage, to: toImage }, transition.uniforms, transitionUniforms), transitionDuration, transitionEasing);
      else
        return self.displayImage(toImage);
    })
    .then(function () {
      return self.prepareNext();
    });
  },
  _preloadAudio: function (url) {
    this.scPlayer.load(url);
  },
  _startAudio: function () {
    this.scPlayer.play();
  },
  _stopAudio: function () {
    this.scPlayer.stop();
  }
};

module.exports = Viewer;
