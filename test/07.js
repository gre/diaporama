var test = require("./test");
var IMAGES = require("./mock").IMAGES;

test("07: DOM rendering fallback",
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
          [ "lineTo", 500, 250 ],
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
      }
    }
  ]
}, {
  width: 200,
  height: 100,
  resolution: 2,
  paused: true,
  autoplay: false,
  loop: false,
  renderingMode: "dom"
},
function (t, api, diaporama) {
  function nodeName (el) {
    return el.nodeName;
  }
  function currentlyHaveNodes (required, forbidden) {
    var nodes = api.centerElements().map(nodeName);
    try {
      (required||[]).forEach(function (n) {
        if (nodes.indexOf(n) === -1)
          throw new Error(n+" must be visible. nodes="+nodes);
      });
      (forbidden||[]).forEach(function (n) {
        if (nodes.indexOf(n) !== -1)
          throw new Error(n+" must not be visible. nodes="+nodes);
      });
    } catch (e) {
      return e;
    }
  }

  return api.wait("load")
  .then(diaporama.play.bind(diaporama))
  .delay(500)
  .then(function () {
    api.assertTime(500);
    t.error(currentlyHaveNodes(["CANVAS"], ["IMG"]), "canvas");
  })
  .delay(1000)
  .then(function () {
    api.assertTime(1500);
    t.error(currentlyHaveNodes(["CANVAS", "IMG"]), "transition");
  })
  .delay(1000)
  .then(function () {
    api.assertTime(2500);
    t.error(currentlyHaveNodes(["IMG"], ["CANVAS"]), "image");
  });
});
