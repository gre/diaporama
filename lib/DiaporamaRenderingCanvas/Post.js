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

  var positionLocation = this.positionLocation;
  gl.enableVertexAttribArray(positionLocation);
  gl.vertexAttribPointer(positionLocation, 2, gl.FLOAT, false, 0, 0);

  var rgba = bgColor.concat([ 1 ]);
  this.background = createTexture(gl, ndarray(new Float32Array(rgba.concat(rgba).concat(rgba).concat(rgba)), [ 2, 2, 4 ]));
}

Post.prototype = {
  dispose: function () {
    this.gl.deleteBuffer(this.buffer);
    this.background.dispose();
    this.shader.dispose();
  },
  renderFBO: function (fbo) {
    var gl = this.gl;
    this.shader.bind();
    this.shader.uniforms.buffer = fbo.color[0].bind();
    gl.drawArrays(gl.TRIANGLES, 0, 6);
  },
  renderEmpty: function () {
    var gl = this.gl;
    this.shader.bind();
    this.shader.uniforms.buffer = this.background.bind();
    gl.drawArrays(gl.TRIANGLES, 0, 6);
  }
};

module.exports = Post;
