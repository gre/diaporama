
function DiaporamaFormatError (msg, data) {
  var temp = Error.call(this, msg);
  this.name = temp.name = "DiaporamaFormatError";
  this.stack = temp.stack;
  this.message = temp.message;
  this.data = data;
}
DiaporamaFormatError.prototype = Object.create(Error.prototype, {
  constructor: {
    value: DiaporamaFormatError,
    writable: true,
    configurable: true
  }
});

module.exports = DiaporamaFormatError;
