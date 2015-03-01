
function DiaporamaFormatError (message, obj) {
  this.message = message;
  this.stack = (new Error()).stack;
}
DiaporamaFormatError.prototype = new Error();
DiaporamaFormatError.prototype.name = "DiaporamaFormatError";

module.exports = DiaporamaFormatError;
