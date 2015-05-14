var Q = require("q");
var test = require("./test");
var IMAGES = require("./mock").IMAGES;

test("02: simple diaporama with 2 images, no loop",
{
timeline: IMAGES.slice(0, 2).map(function (src) {
    return {
      image: src,
      duration: 2000,
      kenburns: {
        from: [0.8, [0.5,0.5]],
        to: [1, [0.5,0.5]],
        easing: [ 0, 0.1, 0.9, 1 ]
      },
      transitionNext: {
        duration: 1000
      }
    };
  })
},
{
  width: 200,
  height: 150,
  autoplay: true,
  loop: false
},
function (t, api, diaporama) {
  t.equal(diaporama.duration, 5000);
  return api.wait("canplaythrough")
  .then(function () {
    return Q.all([
      Q.delay(1000).then(function () {
        t.ok(Math.abs(diaporama.currentTime - 1000) < 200, "at 1s: should be around currentTime=1000");
        t.equal(diaporama.paused, false);
      }),
      Q.delay(4500).then(function() {
        t.ok(Math.abs(diaporama.currentTime - 4500) < 200, "at 4.5s: should be around currentTime=4500");
        t.equal(diaporama.paused, false, "at 4.5s: still running");
      }),
      Q.delay(5500).then(function () {
        t.ok(diaporama.currentTime, 5000);
        t.equal(diaporama.paused, true, "at 5.5s: should have stopped");
      })
    ]);
  });
});
