var createShader = require("gl-shader");
var ndarray = require("ndarray");
var createTexture = require("gl-texture2d");

var VERT = [
  "attribute vec2 position;",
  "varying vec2 uv;",
  "void main() {",
  "gl_Position = vec4(position,0.0,1.0);",
  "uv = 0.5 * (position+1.0);",
  "}"
].join("");

var FRAG = [
  "precision mediump float;",
  "uniform sampler2D buffer;",
  "varying vec2 uv;",
  "void main() {",
  "gl_FragColor = texture2D(buffer, uv);",
  "}"
].join("");

function Post (gl, bgColor) {
  this.gl = gl;
  this.shader = createShader(gl, VERT, FRAG);
  this.buffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, this.buffer);
  gl.bufferData(
    gl.ARRAY_BUFFER,
    new Float32Array([
      -1.0, -1.0,
      1.0, -1.0,
      -1.0,  1.0,
      -1.0,  1.0,
      1.0, -1.0,
      1.0,  1.0]),
    gl.STATIC_DRAW);

  var rgba = bgColor.concat([ 1 ]);
  this.background = createTexture(gl, ndarray(new Float32Array(rgba.concat(rgba).concat(rgba).concat(rgba)), [ 2, 2, 4 ]));
}

Post.prototype = {
  dispose: function () {
    this.gl.deleteBuffer(this.buffer);
    this.background.dispose();
    this.shader.dispose();
  },
  renderTexture: function (texture) {
    var gl = this.gl;
    var shader = this.shader;
    shader.bind();
    gl.bindBuffer(gl.ARRAY_BUFFER, this.buffer);
    shader.attributes.position.pointer();
    shader.uniforms.buffer = texture.bind();
    gl.drawArrays(gl.TRIANGLES, 0, 6);
  },
  renderFBO: function (fbo) {
    this.renderTexture(fbo.color[0]);
  },
  renderEmpty: function () {
    this.renderTexture(this.background);
  }
};

module.exports = Post;
