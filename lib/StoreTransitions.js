
var GlslTransitionFade = require("glsl-transition-fade");

function StoreTransitions (transitionContext) {
  this.T = transitionContext;
  this.ts = {};
  this.set("fade", GlslTransitionFade);
}

StoreTransitions.prototype = {
  destroy: function () {
    for (var t in this.ts) {
      this.ts[t].t.destroy();
    }
    this.ts = null;
  },

  has: function (name) {
    return (name in this.ts);
  },

  set: function (name, transition) {
    // TODO: schedule that asynchronously
    var t = this.T(transition.glsl);
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
