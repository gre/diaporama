var webglew = require("webglew");

function WebGLDetector () {
  this.canvas = document.createElement("canvas");
  this.canvas.addEventListener("webglcontextlost", function (e) {
    e.preventDefault();
    this.gl = null;
  }.bind(this), false);
}

WebGLDetector.prototype = {
  supported: function () {
    if (!this.gl) {
      this.gl = this.canvas.getContext("webgl");
    }
    if (!this.gl) return false;
    var ext = webglew(this.gl);
    return ext.OES_texture_float;
  }
};

module.exports = WebGLDetector;
