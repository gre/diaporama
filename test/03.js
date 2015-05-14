var test = require("./test");
var IMAGES = require("./mock").IMAGES;

test("03: diaporama, 5 images, loop",
{
timeline:
  IMAGES.map(function (src, i) {
    if (i % 2 === 0)
      return {
        image: src,
        duration: 100,
        transitionNext: { duration: 100 }
      };
    else
      return {
        image: src,
        duration: 100
      };
  })
},
{
  width: 600,
  height: 50,
  autoplay: false,
  loop: true
},
function (t, api, diaporama) {
  var evts = api.recordEvents();
  var countGreater = api.countGreater;
  return api.wait("load")
  .then(function () {
    evts.expect({
      canplay: 1,
      canplaythrough: 1,
      load: 1
    }, "load event");
  })
  .delay(200)
  .then(function () {
    t.equal(diaporama.paused, true, "diaporama has not auto started");
    diaporama.play();
    diaporama.pause();
  })
  .delay(100)
  .then(function () {
    t.equal(diaporama.paused, true, "diaporama has not auto started");
    diaporama.play();
  })
  .delay(4000)
  .then(function () {
    t.equal(diaporama.paused, false, "diaporama is still running.");
    diaporama.destroy();
    diaporama.destroy();
    diaporama.destroy();
  })
  .then(function () {
    var minimalSlideCount = 16;
    evts.expect({
      canplay: 1,
      canplaythrough: 1,
      load: 1,
      error: 0,
      progress: countGreater(0),
      render: countGreater(40),
      destroy: 1,
      resize: api.countLower(2),
      play: 1,
      pause: 1,
      ended: 0,
      transition: countGreater(minimalSlideCount/2),
      transitionEnd: countGreater(minimalSlideCount/2),
      slide: countGreater(minimalSlideCount),
      slideEnd: countGreater(minimalSlideCount)
    }, "final");
  });
});
