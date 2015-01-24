var Q = require("q");
var Qimage = require("qimage");
var GlslTransition = require("glsl-transition");
var BezierEasing = require("bezier-easing");
var KenBurns = require("kenburns");

function defaultFindTransitionByName (name, GlslTransitions) {
  for (var i=0; i<GlslTransitions.length; ++i) {
    if (GlslTransitions[i].name.toLowerCase() === name.toLowerCase()) {
      return GlslTransitions[i];
    }
  }
}

// Module?
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

function Viewer (params) {
  var self = this;
  if (!params) throw new Error("params are required");
  ["container", "data"].forEach(function (attr) {
    if (!(attr in params))
      throw new Error("params."+attr+" is required.");
  });
  
  // Initial states
  self.cursor = 0;
  for (var attr in params) {
    self[attr] = params[attr];
  }
  if (self.GlslTransitions) {
    self.findTransitionByName = function (name) {
      return defaultFindTransitionByName(name, self.GlslTransitions);
    };
  }

  self._initDOM();

  var T = GlslTransition(self.canvasT);
  var fade = T("#ifdef GL_ES\nprecision highp float;\n#endif\nuniform vec2 resolution;uniform sampler2D from, to;uniform float progress;void main() {vec2 p = gl_FragCoord.xy / resolution;gl_FragColor = mix(texture2D(from, p), texture2D(to, p), progress);}");
  
  self.kenBurns = self.canvases.map(function (c) {
    return new KenBurns.Canvas2D(c); // Currently using Canvas2D because waiting a fix on Chrome
  });
  self.curKen = 0;

  self.images = {};
  self.data.timeline.forEach(function (item) {
    var url = item.image;
    self.images[url] = Qimage.anonymously(url);
  }, self);

  self.fadeTransition = fade;
  self.transitions = {};
  self.data.timeline.forEach(function (item) {
    var name = item.transitionNext && item.transitionNext.name;
    if (name && !(name in self.transitions)) {
      var transitionObject = self.findTransitionByName(name);
      if (transitionObject) {
        self.transitions[name] = {
          t: T(transitionObject.glsl),
          uniforms: transitionObject.uniforms
        };
      }
    }
  }, self);
}

Viewer.prototype = {

  start: function () {
    var self = this;
    var data = this.data;
    var item = data.timeline[0];
    this._switchCanvas(this.canvases[this.curKen]);
    return this._prepareNext();
  },

/////////////////////////////////////////////////////////////////

  _initDOM: function () {
    var elt = this.container;
    var dim = elt.getBoundingClientRect();
    function createCanvas () {
      var c = document.createElement("canvas");
      c.width = dim.width;
      c.height = dim.height;
      return c;
    }
    this.canvasT = createCanvas();
    this.canvases = [ createCanvas(), createCanvas() ];
  },

  _switchCanvas: function (c) {
    var elt = this.container;
    var child = elt.children[0];
    if (child) elt.removeChild(child);
    elt.appendChild(c);
  },

  _endReached: function () {
    // TODO event
  },
  _performSingleImage: function (item) {
    var self = this;
    var cur = self.curKen;
    self.curKen = cur ? 0 : 1;
    return this.images[item.image]
      .then(function (img) {
        var from = KenBurns.crop.largest;
        var to = KenBurns.crop.largest;
        if (item.kenburns) {
          if (item.kenburns.from) from = KenBurns.crop.apply(KenBurns, item.kenburns.from);
          if (item.kenburns.to) to = KenBurns.crop.apply(KenBurns, item.kenburns.to);
        }
        var duration = item.duration;
        var durationBeforeTransition = duration - (item.transitionNext && item.transitionNext.duration || 0) / 2;
        var easing = BezierEasing.apply(null, item.kenburns.easing || [0, 0, 1, 1]);
        return Q.race([
          self.kenBurns[cur].run(img, from, to, duration, easing),
          Q.delay(durationBeforeTransition)
        ]);
      });
  },

  _prepareNext: function () {
    // Current implementation is a bit crazy and I'm sure we can clarify it.

    var self = this;
    var data = this.data;
    var from = this.cursor;
    var endReached = from+1 === data.timeline.length;
    var to = endReached ? 0 : from + 1;
    this.cursor = to;

    var fromItem = data.timeline[from];
    var toItem = data.timeline[to];

    var cur = self.curKen;
    var oth = cur ? 0 : 1;
    var fromCanvas = self.canvases[cur];
    var toCanvas = self.canvases[oth];

    // first, perform the current image.
    var chain = this._performSingleImage(fromItem);

    // optionally, chain a glsl transition
    var transitionNext = fromItem.transitionNext;
    if (transitionNext) {
      var transition = this.transitions[transitionNext.name] || { t: fade };
      var transitionDuration = transitionNext.duration || 1000;
      var transitionEasing = BezierEasing.apply(null, transitionNext.easing || [0, 0, 1, 1]);
      chain = chain
        .thenResolve(Q.all([
          this.images[fromItem.image],
          this.images[toItem.image]
        ]))
        .spread(function (fromImage, toImage) {
          var transitionUniforms = extend({ from: fromCanvas, to: toCanvas }, transition.uniforms || {}, transitionNext.uniforms || {});
          self._switchCanvas(self.canvasT);
          return Q.all([
            transition.t(transitionUniforms, transitionDuration, transitionEasing).then(function () {
              self._switchCanvas(toCanvas);
            }),
            self._prepareNext()
          ]);
        });
    }

    if (endReached && !data.loop)
      chain = chain.then(this._endReached.bind(this));

    return chain;
  }
};

module.exports = Viewer;
