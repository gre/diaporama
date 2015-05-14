var test = require("./test");
var IMAGES = require("./mock").IMAGES;

test("06: check slide2d, fade, kenburns",
{
  timeline: [
    {
      duration: 1000,
      slide2d: {
        background: "#F00",
        size: [1000, 500],
        draws: [
          { fillStyle: "#0FF" },
          [ "beginPath" ],
          [ "moveTo", 0, 0 ],
          [ "lineTo", 1000, 500 ],
          [ "lineTo", 0, 500 ],
          [ "fill" ]
        ]
      },
      transitionNext: {
        duration: 1000
      }
    },
    {
      duration: 1000,
      image: IMAGES[0],
      transitionNext: {
        duration: 1000
      },
      kenburns: {
        from: [ 0.1, [0, 0] ],
        to: [ 1, [0.5, 0.5] ]
      }
    }
  ]
},
{
  width: 256,
  height: 256,
  resolution: 1,
  autoplay: false,
  renderingMode: "canvas"
},
function (t, api) {
  return api.wait("load")
  .then(api.renderAt.bind(null, 0))
  .then(function(){
    api.assertPixel(2, 50, [255, 0, 0, 255 ]);
    api.assertPixel(2, 70, [0, 255, 255, 255 ]);
  })
  .then(api.renderAt.bind(null, 1500))
  .then(function () {
    api.assertPixel(2, 50, [ 238, 98, 79, 255 ]);
    api.assertPixel(2, 70, [ 105, 230, 213, 255 ]);
  })
  .then(api.renderAt.bind(null, 2500))
  .then(function () {
    api.assertPixel(2, 50, [ 59, 49, 56, 255 ]);
    api.assertPixel(2, 70, [ 49, 42, 47, 255 ]);
  });
});
