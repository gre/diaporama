
function localizeObject (obj, localizeURL) {
  switch (typeof obj) {
  case "string":
    return localizeURL(obj);

  case "object":
    if (obj instanceof Array) {
      return obj.map(function (item) {
        return localizeObject(item, localizeURL);
      });
    }
    var clone = {};
    for (var k in obj) {
      clone[k] = localizeObject(obj[k], localizeURL);
    }
    return clone;

  default:
    return obj;
  }
}

function localizeSlide2dDraws (draws, localizeURL) {
  draws.forEach(function (op) {
    if (op instanceof Array) {
      if (typeof op[0] === "object")
        localizeSlide2dDraws(op, localizeURL);
      else if (op[0]==="drawImage") {
        op[1] = localizeURL(op[1]);
      }
    }
  });
}

module.exports = function (diaporamaData, localizeURL) {
  if (!diaporamaData) return;
  if (typeof localizeURL === "string") {
    var prefix = localizeURL;
    localizeURL = function (url) {
      return prefix + url;
    };
  }
  if (diaporamaData.resources) {
    diaporamaData.resources = localizeObject(diaporamaData.resources, localizeURL);
  }
  diaporamaData.timeline.forEach(function (item) {
    if (item.image) {
      item.image = localizeObject(item.image, localizeURL);
    }
    if (item.video) {
      item.video = diaporamaData.resources[item.video] || localizeObject(item.video, localizeURL);
    }
    if (item.slide2d) {
      localizeSlide2dDraws(item.slide2d.draws, localizeURL);
    }
  });
};
