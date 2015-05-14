var test = require("./test");
var IMAGES = require("./mock").IMAGES;

test("10: prev(duration), next(duration)",
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
      transitionNext: {
        duration: 200
      },
      slide2d: {
        background: "white",
        size: [ 100, 100 ],
        draws: []
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
  return api.wait("load")
  .then(function () {
    diaporama.play();
    api.assertTime(0);
    diaporama.next(300);
    api.assertTime(0);
    setTimeout(function () {
      api.assertTime(150);
    }, 150);
  })
  .delay(300)
  .then(function () {
    api.assertTime(300);
    diaporama.currentTime = 0;
  })
  .then(function () {
    api.assertTime(0);
    diaporama.next(300);
    diaporama.next(300);
    diaporama.next(300);
    diaporama.next(300);
  })
  .delay(300)
  .then(function () {
    api.assertTime(1200);
    diaporama.currentTime = 0;
  })
  .then(function () {
    api.assertTime(0);
    diaporama.next(300);
  })
  .delay(10)
  .then(function () {
    diaporama.next(300);
  })
  .delay(10)
  .then(function () {
    diaporama.next(300);
  })
  .delay(10)
  .then(function () {
    diaporama.next(300);
  })
  .delay(300)
  .then(function () {
    api.assertTime(1200);
    diaporama.currentTime = 1200;
  })
  .delay(10)
  .then(function () {
    api.assertTime(1200);
    diaporama.next(300);
  })
  .delay(10)
  .then(function () {
    diaporama.next(300);
  })
  .delay(300)
  .then(function () {
    t.equal(diaporama.paused, false, "the diaporama is not paused");
    console.log(diaporama.currentTime);
  });
});
