var createGlslTransition = require("glsl-transition");
var GlslTransitionFade = require("glsl-transition-fade");

function StoreTransitions (transitionContext) {
  this.gl = transitionContext;
  this.ts = {};
  this.set("fade", GlslTransitionFade);
}

StoreTransitions.prototype = {
  destroy: function () {
    for (var t in this.ts) {
      this.ts[t].t.dispose();
    }
    this.ts = null;
  },

  has: function (name) {
    return (name in this.ts);
  },

  set: function (name, transition) {
    // TODO: schedule that asynchronously
    var t = createGlslTransition(this.gl, transition.glsl);
    this.ts[name] = {
      t: t,
      uniforms: transition.uniforms || {}
    };
  },

  get: function (name) {
    return this.ts[name];
  },

  getOrFade: function (name) {
    return name && this.ts[name] || this.ts.fade;
  }
};

module.exports = StoreTransitions;
