var test = require("tape");
var Diaporama = require("..");
var Q = require("q");

var current;
function destroy () {
  if (current) {
    document.body.removeChild(current.div);
    current.diaporama.destroy();
    current = null;
  }
}
function create (data, options) {
  destroy();
  var div = document.createElement("div");
  document.body.appendChild(div);
  var diaporama = Diaporama(div, data, options);
  current = { div: div, diaporama: diaporama };
  return diaporama;
}

function countValue (expected) {
  return function (value, t, key, msg) {
    t.equal(value, expected, (msg ? msg+": " : "")+key+" should be exactly "+expected);
  };
}

function countGreater (bound) {
  return function (value, t, key, msg) {
    t.ok(value > bound, (msg ? msg+": " : "")+key+": "+value+" should be greater than "+bound);
  };
}

function recordEventsCount (diaporama, t) {
  var events = {
    canplay: 0,
    canplaythrough: 0,
    load: 0,
    progress: 0,
    destroy: 0,
    error: 0,
    resize: 0,
    play: 0,
    pause: 0,
    ended: 0,
    transition: 0,
    transitionEnd: 0,
    slide: 0,
    slideEnd: 0
  };
  var eventsKeys = Object.keys(events);
  eventsKeys.forEach(function (k) {
    diaporama.on(k, function () {
      events[k] ++;
    });
  });
  return {
    expect: function (expected, msg) {
      var keys = Object.keys(expected);
      t.test(function (st) {
        st.plan(keys.length);
        keys.forEach(function (k) {
          var e = expected[k];
          if (typeof e === "number")
            e = countValue(e);
          e(events[k], st, k, msg);
        });
      });
    }
  };
}

test("empty diaporama", function (t) {
  t.plan(14);
  var diaporama = create({
    timeline: []
  }, {
    width: 190,
    height: 99,
    resolution: 2,
    paused: false,
    autoplay: true,
    loop: false
  });
  t.equal(diaporama.loop, false);
  t.equal(diaporama.autoplay, true);
  t.equal(diaporama.data.timeline.length, 0);
  t.equal(diaporama.width, 190);
  t.equal(diaporama.height, 99);
  t.equal(diaporama.resolution, 2);
  t.equal(diaporama.currentTime, 0);
  t.equal(diaporama.playbackRate, 1);
  t.equal(diaporama.duration, 0);
  setTimeout(function () {
    t.equal(diaporama.duration, 0);
    t.equal(diaporama.currentTime, 0);
    t.equal(diaporama.loop, false);
    t.equal(diaporama.autoplay, true);
    t.equal(diaporama.paused, true, "After some time, the diaporama should pause because loop is disabled.");
  }, 200);
});

test("simple diaporama with 2 images, no loop", function (t) {
  t.plan(7);
  var diaporama = create({
  timeline: [
      "http://i.imgur.com/MyyS4vK.jpg",
      "http://i.imgur.com/fhNYTX4.jpg"
    ].map(function (src) {
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
  }, {
    width: 200,
    height: 150,
    autoplay: true,
    loop: false
  });
  t.equal(diaporama.duration, 5000);
  diaporama.once("canplaythrough", function () {
    setTimeout(function () {
      t.ok(Math.abs(diaporama.currentTime - 1000) < 200, "at 1s: should be around currentTime=1000");
      t.equal(diaporama.paused, false);
    }, 1000);
    setTimeout(function () {
      t.ok(Math.abs(diaporama.currentTime - 4500) < 200, "at 4.5s: should be around currentTime=4500");
      t.equal(diaporama.paused, false, "at 4.5s: still running");
    }, 4500);
    setTimeout(function () {
      t.ok(diaporama.currentTime, 5000);
      t.equal(diaporama.paused, true, "at 5.5s: should have stopped");
    }, 5500);
  });
});


test("diaporama, 5 images, loop", function (t) {
  t.plan(5);
  var diaporama = create({
  timeline: [
      "http://i.imgur.com/MQtLWbD.jpg",
      "http://i.imgur.com/N8a9CkZ.jpg",
      "http://i.imgur.com/adCmISK.jpg",
      "http://i.imgur.com/MyyS4vK.jpg",
      "http://i.imgur.com/fhNYTX4.jpg"
    ].map(function (src, i) {
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
  }, {
    width: 600,
    height: 50,
    autoplay: false,
    loop: true
  });
  var evts = recordEventsCount(diaporama, t);

  diaporama.on("load", function () {
    evts.expect({
      canplay: 1,
      canplaythrough: 1,
      load: 1
    }, "load event");
    Q.delay(200)
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
    .delay(100)
    .then(function () {
      var approxSlideCount = 24;
      evts.expect({
        canplay: 1,
        canplaythrough: 1,
        load: 1,
        error: 0,
        progress: countGreater(0),
        destroy: 1,
        resize: 1,
        play: 1,
        pause: 1,
        ended: 0,
        transition: countGreater(approxSlideCount/2),
        transitionEnd: countGreater(approxSlideCount/2),
        slide: countGreater(approxSlideCount),
        slideEnd: countGreater(approxSlideCount)
      }, "final");
    })
    .delay(100)
    .done();
  });
});

// MORE TESTS TO COME:
// test each method one by one
// test each property one by one
// different diaporama format
// [advanced] we should have a way to check that the DOM displays something (and not black)
