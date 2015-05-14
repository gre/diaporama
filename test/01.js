var Q = require("q");
var test = require("./test");

test("01: empty diaporama",
{
  timeline: []
},
{
  width: 190,
  height: 99,
  resolution: 2,
  paused: false,
  autoplay: true,
  loop: false
},
function (t, api, diaporama) {
  t.equal(diaporama.loop, false);
  t.equal(diaporama.autoplay, true);
  t.equal(diaporama.data.timeline.length, 0);
  t.equal(diaporama.width, 190);
  t.equal(diaporama.height, 99);
  t.equal(diaporama.resolution, 2);
  t.equal(diaporama.currentTime, 0);
  t.equal(diaporama.playbackRate, 1);
  t.equal(diaporama.duration, 0);
  return Q.delay(200).then(function () {
    t.equal(diaporama.duration, 0);
    t.equal(diaporama.currentTime, 0);
    t.equal(diaporama.loop, false);
    t.equal(diaporama.autoplay, true);
    t.equal(diaporama.paused, true, "After some time, the diaporama should pause because loop is disabled.");
  });
});
