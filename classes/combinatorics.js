'use strict'

// Return an array of combinations
// author: https://stackoverflow.com/users/2721685/jokkebk
// ref: https://stackoverflow.com/questions/43241174/javascript-generating-all-combinations-of-elements-in-a-single-array-in-pairs
class Combinatorics {
  static pairs(a, k) {
    if (a.length === k) {
      return [a]
    }
    else if (k === 0) {
      return [[]]
    }
    else {
      return [...Combinatorics.pairs(a.slice(1), k - 1).map(c => [a[0], ...c]),
      ...Combinatorics.pairs(a.slice(1), k)];
    }
  }
}

if (typeof module != "undefined") {
	module.exports = Combinatorics;
}
export { Combinatorics }