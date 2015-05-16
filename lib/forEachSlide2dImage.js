
module.exports = function forEachSlide2dImage (draws, cb, ctx) {
  draws.forEach(function (op) {
    if (op instanceof Array) {
      if (typeof op[0] === "object")
        forEachSlide2dImage(op, cb, ctx);
      else if (op[0]==="drawImage")
        cb.call(ctx, op[1]);
    }
  });
};
