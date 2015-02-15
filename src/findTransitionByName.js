
module.exports = function findTransitionByName (name, Transitions) {
  for (var i=0; i<Transitions.length; ++i) {
    if (Transitions[i].name.toLowerCase() === name.toLowerCase()) {
      return Transitions[i];
    }
  }
};
