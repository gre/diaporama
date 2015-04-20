var test = require("./test");
var IMAGES = require("./mock").IMAGES;

test("prev(), next(), jump(slideIndex)",
{
  timeline: [
    {
      image: IMAGES[0],
      duration: 100,
      transitionNext: {
        duration: 200
      },
      kenburns: {
        from: [ 0.1, [0, 0] ],
        to: [ 1, [0.5, 0.5] ]
      }
    },
    {
      duration: 300,
      canvas2d: {
        background: "white",
        size: [ 100, 100 ],
        draws: []
      }
    },
    {
      image: IMAGES[0],
      duration: 400,
      transitionNext: {
        duration: 500
      },
      kenburns: {
        from: [ 0.1, [0, 0] ],
        to: [ 1, [0.5, 0.5] ]
      }
    }
  ]
},
{
  width: 200,
  height: 200,
  loop: true,
  autostart: false
},
function (t, api, diaporama) {
  api.assertTime(0);
  diaporama.next();
  api.assertTime(300);
  diaporama.next();
  api.assertTime(600);
  diaporama.next();
  api.assertTime(0);
  diaporama.prev();
  api.assertTime(600);
  diaporama.prev();
  api.assertTime(300);
  diaporama.jump(0);
  api.assertTime(0);
  diaporama.jump(2);
  api.assertTime(600);
  diaporama.loop = false;
  api.assertTime(600);
  diaporama.next();
  api.assertTime(600);
  diaporama.prev();
  api.assertTime(300);
  diaporama.prev();
  api.assertTime(0);
  diaporama.prev();
  api.assertTime(0);
});
