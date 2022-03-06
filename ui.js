'use strict'

import { Scheduler } from './classes/scheduler.js';
import { TableExport } from './classes/tableExport.js'

$(function () {

  const TXTSTOP = "STOPPEN"

  let config = {
    "iterations": 1000
    , "size": 20
    , "crossover": 0.1
    , "mutation": 0.5
    , "skip": 100
    , "webWorkers": true
  };

  /* assert: numSlots * slotSize >= numExams */
  let userData = {
    "solution": []
    , "conflicts": []
    , "numSlots": 8
    , "slotSize": 50
    , "exams": []
    , "done": false
  };

  let genetic
  let scheduler
  
  $('#run').on('click', function () {
    if ($(this).text() == TXTSTOP) {
      scheduler.finalize(genetic)
      document.dispatchEvent(new Event('Finished'))
    }
    else {
      if ($('#inschrijvingen').val()=='') {
        alert('Geen examens gevonden. Kopieer eerst de lijst met examens')
        return false;
      }
      config.size = Number($("input[name='populationSize']").val())
      config.mutation = Number($("input[name='mutationProbability']").val())/100
      config.iterations = Number($("input[name='generations']").val())

      let days = Number($('input[name = days]').val())
      let examsPerDay = Number($('input[name = examsPerDay]').val())
      let maxSlots = days * examsPerDay
      userData.numSlots = maxSlots
      $(this).html(TXTSTOP)
      $(this).toggleClass("active")
      scheduler = new Scheduler(config, userData)
      genetic = scheduler.schedule()
    }
  })

  $('#showHelp').on('click', function () {
     $('.intro').toggleClass('hide')
  })

  $('#showTechnical').on('click', function () {
     $('.technical').toggleClass('hide')
  })
  
  $('#downloadSolution').on('click', function () {
    let objExport = new TableExport('.solution table.exams')
    objExport.toCSV().download('solution', true) // with timestamp, e.g. solution-1234.csv
  })

  $('#downloadStudentList').on('click', function () {
    let objExport = new TableExport('#studentSchedule')
    objExport.toCSV().download('studentSchedule', true) // with timestamp, e.g. studentSchedule-1234.csv
  })

    // Add an event listener.
  $(document).on('Finished', function(e, opts) {
    $('#run').html(Scheduler.TXTGO)
    $('#run').toggleClass("active")
    console.log("finished")
  });

})
