
module.exports = function loadVideo (videos, success, failure) {

  var current = null;

  function onSourceError (e) {
    if (!current) current = null;
    if (video.networkState === NETWORK_NO_SOURCE) {
      failure(e);
    }
  }

  var NETWORK_NO_SOURCE = HTMLMediaElement.NETWORK_NO_SOURCE;
  var video = document.createElement("video");

  var onLoadEvent = function () {
    video.removeEventListener("canplaythrough", onLoadEvent);
    success(video);
  };

  video.crossOrigin = true;
  video.addEventListener("canplaythrough", onLoadEvent, false);
  var sources = [];
  for (var typ in videos) {
    var src = videos[typ];
    var source = document.createElement("source");
    source.addEventListener("error", onSourceError);
    if (typ!=="video") source.type = typ;
    source.src = src;
    sources.push(source);
    video.appendChild(source);
  }
  video.load();

  current = function () {
    sources.forEach(function () {
      source.removeEventListener("error", onSourceError);
      source.src = "";
    });
    video.removeEventListener("canplaythrough", onLoadEvent);
    video.pause();
    video.src = "";
    video.innerHTML = "";
    video = null;
    sources = null;
  };


  return function () {
    if (!current) return;
    current();
    current = null;
  };
};
