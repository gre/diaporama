var blackImageFallback = require("./blackImageFallback");
var image = require("./image");
var video = require("./video");

module.exports = {
  image: blackImageFallback(image),
  video: blackImageFallback(video, true)
};
