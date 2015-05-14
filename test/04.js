var test = require("./test");
var IMAGES = require("./mock").IMAGES;

test("04: diaporama loop",
{
  timeline:
    IMAGES.slice(0, 2).map(function(src){
      return {
        image: src,
        duration: 500
      };
    })
},
{
  width: 190,
  height: 99,
  autoplay: false,
  loop: false
},
function (t, api, diaporama) {
  var evts = api.recordEvents();
  return api.wait("load")
  .then(function () {
    evts.expect({
      play: 0
    }, "no played yet");
    diaporama.play();
  })
  .delay(500)
  .then(function(){
    t.equal(diaporama.paused, false, "Diaporama is running");
  })
  .delay(500)
  .delay(100) // security
  .then(function(){
    t.equal(diaporama.paused, true, "Diaporama has ended");
    evts.expect({
      ended: 1
    }, "ended event");
    diaporama.currentTime = 0;
    diaporama.loop = true;
    diaporama.play();
  })
  .then(function() {
    t.equal(diaporama.paused, false, "Diaporama is running again");
  })
  .delay(2500)
  .then(function() {
    t.equal(diaporama.paused, false, "Diaporama is still running");
  });
});
