var Q = require("q");
var SC = window.SC;

function fallbackNoSoundCloud () {
  function noop () {}
  return {
    load: noop,
    play: noop,
    stop: noop
  };
}

function SoundCloud(options) {

  var q_loaded_sound = Q.defer();

  SC.initialize({
    client_id: options.client_id
  });

  function load(track_url) {
    SC.get('/resolve', { url: track_url }, function(track) {
      SC.stream("/tracks/" + track.id, function(sound) {
        q_loaded_sound.resolve(sound);
      });
    });
  }

  function play() {
    q_loaded_sound.promise.then(function(sound) {
      console.log("Play!");
      sound.play();
    });
  }

  function stop() {
    q_loaded_sound.promise.then(function(sound) {
      console.log("Stop!");
      sound.stop();
    });
  }

  return {
    load: load,
    play: play,
    stop: stop
  };
}


module.exports = SC ? SoundCloud : fallbackNoSoundCloud;
