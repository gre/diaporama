
module.exports = function (loadingFunction, timeoutInMs) {
  return function (arg, success, failure) {
    var cancellation;
    var timeout = setTimeout(function () {
      cancellation();
      failure(new Error("Timeout reached"));
    }, timeoutInMs);
    cancellation = loadingFunction(arg, function (data) {
      clearTimeout(timeout);
      success(data);
    }, function (e) {
      clearTimeout(timeout);
      failure(e);
    });
    return function () {
      clearTimeout(timeout);
      cancellation();
    };
  };
};
