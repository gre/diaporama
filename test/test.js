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
  div.style.position = "fixed";
  div.style.top = 0;
  div.style.left = 0;
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
  return function (value, t, key) {
    t.ok(value > bound, key+": "+value+" should be greater than "+bound);
  };
}
function countLower (bound) {
  return function (value, t, key) {
    t.ok(value < bound, key+": "+value+" should be lower than "+bound);
  };
}
function recordEvents (t) {
  var diaporama = current.diaporama;
  var events = {
    canplay: 0,
    canplaythrough: 0,
    load: 0,
    progress: 0,
    render: 0,
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
  function copy (keys) {
    var snap = {};
    (keys||Object.keys(events)).forEach(function (k) {
      snap[k] = events[k];
    });
    return snap;
  }

  return {
    get: copy,
    expect: function (expected, msg) {
      var keys = Object.keys(expected);
      var snap = copy(keys);
      console.log("# "+msg);
      keys.forEach(function (k) {
        var e = expected[k];
        if (typeof e === "number")
          e = countValue(e);
        e(snap[k], t, k);
      });
    }
  };
}

function allElementsFromPoint (x, y, stop) {
  var res = [];
  var displays = [];
  var ele = document.elementFromPoint(x,y);
  while(ele && ele !== stop && ele.tagName !== "BODY" && ele.tagName !== "HTML"){
    res.push(ele);
    displays.push(ele.style.display);
    ele.style.display = "none";
    ele = document.elementFromPoint(x,y);
  }
  for(var i = 0; i < res.length; i++){
    res[i].style.display = displays[i];
  }
  return res;
}
function centerElements () {
  var div = current.div;
  var rect = div.getBoundingClientRect();
  return allElementsFromPoint(
    rect.left + rect.width / 2,
    rect.top + rect.height / 2,
    div);
}
function assertTime (t, time) {
  var diaporama = current.diaporama;
  t.ok(Math.abs(diaporama.currentTime - time) < 200 , "time should be around "+time+". currentTime="+diaporama.currentTime);
}

function wait (event) {
  var d = Q.defer();
  current.diaporama.once(event, d.resolve);
  current.diaporama.once("error", d.reject);
  return d.promise;
}

function renderAt (t) {
  current.diaporama.currentTime = t;
  current.diaporama.renderNow(); // lazy version for now ...
  return Q.resolve(t);
  /*
  if (current.diaporama.currentTime === t) {
    return Q.resolve(t);
  }
  var promise = wait("render");
  current.diaporama.currentTime = t;
  return promise;
  */
}

function capturePixel (x, y) {
  var gl = current.diaporama._rendering.gl;
  var pixel = new Uint8Array(4);
  gl.readPixels(x, y, 1, 1, gl.RGBA, gl.UNSIGNED_BYTE, pixel);
  return pixel;
}

function colorDiff (a, b) {
  var diff = 0;
  for (var i=0; i<4; ++i) {
    diff += Math.pow(a[i]-b[i], 2);
  }
  return Math.sqrt(diff);
}

function colorMatches (a, b) {
  return colorDiff(a, b) < 8;
}

function assertPixel (t, x, y, expected, msg) {
  var pixel = capturePixel(x, y);
  t.ok(colorMatches(pixel, expected), (!msg ? "" : msg+": ")+"pixel at "+[x,y]+" should be "+expected);
}

function assertProps (t, expected, msg) {
  var diaporama = current.diaporama;
  var keys = Object.keys(expected);
  var values = keys.map(function (k) {
    return diaporama[k];
  });
  console.log("# "+msg);
  keys.map(function (k, i) {
    t.equal(values[i], expected[k], "diaporama."+k+" must be "+expected[k]);
  });
}

module.exports = function (description, data, options, f) {
  if (arguments.length !== 4) throw new Error("usage: description data options f");
  test(description, function (t) {
    var diaporama = create(data, options);
    var api = {
      countGreater: countGreater,
      countLower: countLower,
      countValue: countValue,
      capturePixel: capturePixel,
      assertPixel: assertPixel.bind(null, t),
      renderAt: renderAt,
      wait: wait,
      recordEvents: recordEvents.bind(null, t),
      centerElements: centerElements,
      assertTime: assertTime.bind(null, t),
      assertProps: assertProps.bind(null, t)
    };
    Q.fcall(f, t, api, diaporama).then(function () {
      destroy();
    }).done(t.end);
  });
};
