var test = require("./test");
var IMAGES = require("./mock").IMAGES;

test("08: supports data update",
{
  timeline: []
},
{
  width: 200,
  height: 200,
  loop: true
},
function (t, api, diaporama) {

  t.equal(diaporama.duration, 0);
  t.equal(diaporama.data.timeline.length, 0);
  diaporama.data = {
    timeline: [
      {
        image: IMAGES[0],
        duration: 1337
      }
    ]
  };
  t.equal(diaporama.duration, 1337);
  t.equal(diaporama.data.timeline.length, 1);

  return api.wait("load").then(function () {
    diaporama.data = {
      timeline: [
        {
          image: IMAGES[0],
          duration: 1337,
          transitionNext: {
            duration: 1000
          }
        }
      ]
    };
    t.equal(diaporama.duration, 2337);
    t.equal(diaporama.data.timeline.length, 1);
    diaporama.loop = false;
    t.equal(diaporama.loop, false);
    t.equal(diaporama.duration, 1337);
    t.equal(diaporama.data.timeline.length, 1);
    return api.wait("load");
  })
  .then(function() {
    diaporama.data = {
      timeline: [
        {
          image: IMAGES[0],
          duration: 1337,
          transitionNext: {
            duration: 1000
          },
          kenburns: {
            from: [ 0.1, [0, 0] ],
            to: [ 1, [0.5, 0.5] ]
          }
        },
        {
          duration: 2000,
          slide2d: {
            background: "white",
            size: [ 100, 100 ],
            draws: []
          }
        }
      ]
    };
    t.equal(diaporama.duration, 4337);
    t.equal(diaporama.data.timeline.length, 2);
  });
});
