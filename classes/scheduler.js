'use strict'

import {Genetic} from './genetic.js'
import {TableGenerator} from './tableGenerator.js'
import {ExamData} from './examData.js'
import {Stochastic} from './stochastic.js'

class Scheduler {
  static DONE = false
  static TXTGO = "ZOEKEN"

  constructor(config, userData) {
    this.config = config
    this.userData = userData
    this.tableGenerator = new TableGenerator
    this.students = null
    this.exams = null
    this.studentSchedule = null
  }

  // result: list of exams [{code, size, slot}], {code, size, slot}, ...]
  // conflicts: list of conflicts [ {code1, code2}, {code1, code2}, ...]
  // generation: 1..20000 (int)
  // maxGenerations: set in config variable
  updateSolution(result, conflicts, generation, maxGenerations) {
    // compare exams by name for sorting
    const compareByCode = (a, b) => {
      var a = a["code"].toLowerCase();
      var b = b["code"].toLowerCase();
      return ((a < b) ? -1 : ((a > b) ? 1 : 0));
    }

    if (!Scheduler.DONE) {
      const getUniqueListBy = (arr, key) => [...new Map(arr.map(item => [item[key], item])).values()]

      this.studentSchedule.forEach(studentExam => {
        studentExam.exam.slot = result.find(e=>e.code==studentExam.exam.code).slot+1 //make it 1 based instead of 0 based
      })
      let examsInConflicts = conflicts.flatMap(conflict => [conflict.exam1, conflict.exam2])
      examsInConflicts = getUniqueListBy(examsInConflicts, 'code').sort(compareByCode)
      result.forEach(x=>examsInConflicts.some(ex=>ex.code == x.code)?x.inConflicts=true:'')      
      let examsByCode = result.sort(compareByCode)
      
      let self = this
      $('#generation').html(Number(generation+1) + " of " + maxGenerations)
      $('#solution').html(self.tableGenerator.examsToTable(examsByCode))
      $('#numConflicts').html(conflicts.length)
      $('#conflictsInSolution').html(this.tableGenerator.conflictsToTable(conflicts))
      $('#studentSchedule').html(this.tableGenerator.studentScheduleToTable(this.studentSchedule))

      const compareBySlot = (a, b) => a.slot - b.slot;
      let examsBySlot = result.sort(compareBySlot)
      $('#overview').html(self.tableGenerator.slotsToTables(result))
      $('.download').show()
    }
  }
  
  finalize(genetic) {
      Scheduler.DONE = true
      if (genetic)
        genetic.stop()
  }

  // https://en.wikipedia.org/wiki/Greedy_algorithm
  greedy(genetic) {
    // ** fill slots using greedy algorithm **
    // first sort by size descending (greedy=start with biggest)
    this.userData.exams.sort((a, b) => a.size > b.size ? -1 : 1);
    let currentSlot = 0
    let slots = []
    let hasConflicts = true
    let n = 0
    this.userData.exams.forEach(exam => {
      n++    
      currentSlot = 0
      do {  // find the first conflict free slot to put this exam in
        exam.slot = currentSlot
        slots = genetic.entityToSlots(this.userData.exams.slice(0,n))
        let conflicts = genetic.getConflicts(slots)
        hasConflicts = conflicts[currentSlot].length > 0
        currentSlot++
      } while (hasConflicts && currentSlot < this.userData.numSlots)
    })    
  }
  
  schedule() {
    let log = console.log
  
    //// read lines into student,exam form
    let data = new ExamData()
    this.studentExams = data.readdata($('#inschrijvingen').val()).studentExams
    this.studentSchedule = data.studentExams // list of {studentId, exam}
    this.students = data.students
    this.examsByStudent = data.examsByStudent
    this.conflicts = data.getConflicts()
    this.exams = data.exams
    $('#conflicts').html(this.conflicts.join('<br/>'))
  
    // now we have students, exams and conflicts. Time to make a schedule 
    this.userData.exams = this.exams
    this.userData.conflicts = this.conflicts
    let genetic = this.createGA()
  
    let prepare = $("select[name='prepare'] option:selected").val()  
    if (prepare=='true') {
      this.greedy(genetic)
    }
  
    this.userData.solution = genetic.seed()
    let solve = async () => genetic.evolve(this.config, this.userData)
    solve().then(() => {
      if (this.userData.done) {
        let solution = this.userData.solution;
        for (let exam of this.userData.solution) {
          let map = solution.map(exam => [exam.code, exam.slot, exam.size].join(","))
          $('#solution').html(map.join('<br/>'))
        }
      }
    })
  
    return genetic
  }

  createGA() {
    // const Genetic = require("genetic-js"); // only in node-js
    let genetic = Genetic.create();
    let scheduler = this
    let config = this.config
    let userData = this.userData
    
    genetic.optimize = Genetic.Optimize.Minimize;
    genetic.select1 = Genetic.Select1.Tournament2;
    genetic.select2 = Genetic.Select2.Tournament2;
  
    for (const [key, value] of Object.entries(config)) {
      genetic.configuration[key] = value;  
    }
  
    for (const [key, value] of Object.entries(userData)) {
      genetic.userData[key] = value;  
    }

    // generate first pool of candidates
    // note: randomizing is silly since the items
    // are objects, still I'm leaving it here
    // in case they become different someday
    genetic.seed = function() {
        let exams = [...this.userData.exams.sort(x => .5 - Math.random())]
        return exams;
      };
    
    genetic.sigmoid = function(t) {
      return 1 / (1 + Math.pow(Math.E, -t));
    }
  
    genetic.random = function(low, high) {
      return Math.floor(Math.random() * (high - low) + low);
    }
  
    genetic.randomIndex = function(list) {
      let ret = this.random(0, list.length);
      return ret;
    }
  
    genetic.pick = function(list) {      
      let index = this.randomIndex(list);
      let ret = list[index];
      return ret;
    }
    
    genetic.swap = function(entity) {
      // swap two entities from random slots
      let a = this.randomIndex(entity);
      let b = this.randomIndex(entity);
      [entity[a].slot, entity[b].slot] = [entity[b].slot, entity[a].slot];
    }
  
    // mutate: move one exam to another slot
    genetic.mutate = function(entity) { 
      let slots = this.entityToSlots(entity);
      let conflicts = this.getConflictsAsList(slots);
      let index = 0;
      let randomConflict;
      index = this.randomIndex(entity);
      if (conflicts.length > 0 && Math.random() > 0.2) {
        randomConflict = this.pick(conflicts);
        let code = Math.random() > 0.5 ? randomConflict.exam1.code : randomConflict.exam2.code;
        index = entity.findIndex(item => item.code == code);
      }
      let randomSlot = this.randomIndex(slots);
      entity[index].slot = randomSlot;
      return entity;
    };
  
    /**
     * crossover is impossible, since e.g. abc crossover with abc 
     * would lead to acc and abb, no duplicates allowed
     * so we use "Parthenogenesis", which is reproducing witout 
     * fun^h^h^hsex, so we can ignore father, which suits him
     * right, cuz he always ignored us too 
     * in this case we don't actually crossover, but simply
     * move some random exams to another random slot
     */
    genetic.crossover = function(mother, father) {
      let len = mother.length;
      // start at random point
      let start = parseInt(Math.random() * len);
      let n = this.userData.slotSize;
      let done = false;
      let i = start;
      // move to next until we have modified slotSize elements, or randomly stop
      while (n > 0 && !done) {
        let randomSlot = parseInt(Math.random() * this.userData.numSlots);
        mother[i].slot = randomSlot;
        n--;
        done = Math.random() < 0.1;
      }
  
      return [mother, father];
    };
  
    genetic.getConflicts = slots => {
      let hasCode = (entity, code) => entity.some(x => x.code == code);
      let hasPair = (data, pair) => hasCode(data, pair.exam1.code) && hasCode(data, pair.exam2.code);
      let getConflictsInSlot = slot => genetic.userData.conflicts.filter(pair => hasPair(slot, pair));
  
      return slots.map(slot => getConflictsInSlot(slot));
    }
  
    genetic.getConflictsAsList = slots => {
      let conflicts = genetic.getConflicts(slots);
      let ret = Array.prototype.concat(...conflicts).filter(x => x !== undefined)
      return ret;
    }
  
    genetic.numConflicts = slots => {
      let hasCode = (entity, code) => entity.some(x => x.code == code);
      let hasPair = (data, pair) => hasCode(data, pair.exam1.code) && hasCode(data, pair.exam2.code);
      let numConflictsInSlot = slot => genetic.userData.conflicts.filter(pair => hasPair(slot, pair)).length;
      return slots.reduce((sum, slot) => sum + numConflictsInSlot(slot), 0);
    }
  
    genetic.stdevSlots = slots => {
      const sizes = slots.map(slot => slot.length);
      const n = sizes.length;
      const mean = sizes.reduce((a, b) => a + b) / n;
      const s = Math.sqrt(sizes.map(x => Math.pow(x - mean, 2)).reduce((a, b) => a + b) / n);
      return s;
    }
  
    genetic.stdevSizes = slots => {
      const sizes = slots.map(slot => slot.reduce((sum, exam) => sum + exam.size, 0));
      const n = sizes.length;
      const mean = sizes.reduce((a, b) => a + b) / n;
      const s = Math.sqrt(sizes.map(x => Math.pow(x - mean, 2)).reduce((a, b) => a + b) / n);
      return s;
    }
  
    genetic.distribution = entity => {
      let sum = entity.reduce((sum, exam, i) => sum + exam.slot * i, 0);
      return sum / 1000;
    }
  
    genetic.entityToSlots = entity => {
      let slots = [], i = 0, n = entity.length;
      for (let exam of entity) {
        if (!slots[exam.slot])
          slots[exam.slot] = [];
        slots[exam.slot].push(exam);
      }
      return slots;
    }
  
    /* fitness is a function of
    * 1. how compact is the schedule, measured by minimizing the distribution of exams on the left
    * 2. how many conflicts are in the schedule
    * 3. how many students are doing an exam in total per slot
    * NB: this fitness function is minimized by the genetic algorithm
    */
    genetic.fitness = function(entity) {
      let score = 0.0;
      let f = 0.0;
      let slots = this.entityToSlots(entity);
      let numConflicts = this.numConflicts(slots);
      let distribution = this.distribution(entity);
      f += Math.pow(numConflicts,2) * 10 + distribution / slots.length;
      // only start optimizing for stdev when there are no conflicts
      if (numConflicts == 0)
        f += this.stdevSizes(slots) / this.userData.numSlots;
      return f;
    };
  
    genetic.generation = function(pop, generation, stats) {
      let slots = this.entityToSlots(pop[0].entity);
      let numConflicts = this.numConflicts(slots);
      genetic.userData.improved = numConflicts < this.userData.numConflicts;
  
      let distribution = this.distribution(pop[0].entity);
      let stdev = this.stdevSizes(slots);
      genetic.userData.numConflicts = numConflicts;
      genetic.userData.numSlotsUsed = slots.length;
      genetic.userData.distribution = distribution;
      genetic.userData.stdev = stdev; //Math.min(stdev, userData.stdev);
  
      return (numConflicts > 0 || stdev > 1.0 || !genetic.isFinished);
    };
  
    genetic.entityToString = function(entity) {
      return entity.map(x => x.code).join(',');
    }
  
    genetic.slotsToString = function(slots) {
      return slots.map(slot => slot.map(item => item.code)).join("\n");
    }
  
    genetic.stop = function() {
      genetic.interrupt()
      genetic.isFinished = true
    }
  
    genetic.notification = function(pop, generation, stats, isFinished) {
      let solution = pop[0].entity;
      this.last = this.last || solution;
  
      let slots = this.entityToSlots(solution);
  
      const sizes = slots.map(slot => slot.reduce((sum, exam) => sum + exam.size, 0));
      // console.table(slots.map((x, i) => x.map(x => x.code).concat(sizes[i])));
      genetic.userData.numConflicts = genetic.numConflicts(slots)
      let conflicts = genetic.getConflictsAsList(slots)
      
      //if (genetic.userData.numConflicts > 0) {
      //  console.table(conflicts);
      //}
  
      scheduler.updateSolution(solution, conflicts, generation, this.configuration.iterations)
      
      let log = "";
      log += "gen: " + generation + "\n";
      log += "fitness: " + pop[0].fitness.toPrecision(5) + "\n";
      log += "conflicts: " + genetic.userData.numConflicts + "\n";
      log += "slots: " + genetic.userData.numSlotsUsed + "\n";
      log += "distribution: " + genetic.userData.distribution + "\n";
      log += "stdev: " + genetic.stdevSizes(slots) + "\n";
      log += "\n";
      // console.log(log);
  
      this.last = solution;
  
      if (isFinished) {
        scheduler.userData.done = true;
        this.stop()
        scheduler.finalize(this)
        document.dispatchEvent(new Event('Finished'))
      }
    };
  
    return genetic;
  }
}

export { Scheduler }