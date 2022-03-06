'use strict'

class Stochastic {
  // used to reverse minimum fitness to maximum fitness 0..1
  static sigmoid = function(t) {
    return 1 / (1 + Math.pow(Math.E, -t));
  }

  static random = function(low, high) {
    return Math.floor(Math.random() * (high - low) + low);
  }

  static randomIndex = function(list) {
    let ret = this.random(0, list.length);
    return ret;
  }

  static pick = function(list) {      
    let index = this.randomIndex(list);
    let ret = list[index];
    return ret;
  }

}

export { Stochastic }