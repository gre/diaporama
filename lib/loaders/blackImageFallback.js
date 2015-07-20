
var image = new Image();
image.src = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNg+A8AAQIBANEay48AAAAASUVORK5CYII=";

module.exports = function (loadingFunction, wrapped) {
  return function (arg, success) {
    return loadingFunction(arg, success, function () {
      success(wrapped ? { image: image } : image);
    });
  };
};
