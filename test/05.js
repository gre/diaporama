var test = require("./test");
var IMAGES = require("./mock").IMAGES;

test("05: diaporama resize",
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
  var resizes = 0;
  return api.wait("load")
  .then(function() {
    resizes = evts.get().resize;
    diaporama.width = 399;
    diaporama.height = 399;
    diaporama.width = 400;
    diaporama.height = 400;
    t.equal(diaporama.width, 400, "width is set");
    t.equal(diaporama.height, 400, "height is set");
    diaporama.width = 401;
    diaporama.height = 401;
    diaporama.height = 400;
    diaporama.height = 400;
    diaporama.width = 400;
  })
  .delay(100)
   .then(function () {
     var before = resizes;
     resizes = evts.get().resize;
     t.equal(resizes - before, 1, "only one resize event happened");
     diaporama.width = diaporama.width;
     diaporama.height = diaporama.height;
   })
   .delay(100)
  .then(function () {
    var before = resizes;
    resizes = evts.get().resize;
    t.equal(resizes - before, 0, "no resize event happened");
  });
});
