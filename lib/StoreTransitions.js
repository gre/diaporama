
var FADE_GLSL = "#ifdef GL_ES\nprecision highp float;\n#endif\nuniform vec2 resolution;uniform sampler2D from, to;uniform float progress;void main() {vec2 p = gl_FragCoord.xy / resolution;gl_FragColor = mix(texture2D(from, p), texture2D(to, p), progress);}";


function StoreTransitions (transitionContext) {
  this.T = transitionContext;
  this.ts = {
    fade: { t: transitionContext(FADE_GLSL), uniforms: {} }
  };
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
    var t = this.T(transition.glsl);
    this.ts[name] = {
      t: t,
      uniforms: transition.uniforms
    };
  },

  get: function (name) {
    return this.ts[name] || this.ts.fade;
  }
};

module.exports = StoreTransitions;
