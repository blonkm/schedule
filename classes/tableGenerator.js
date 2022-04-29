'use strict'

class TableGenerator {
  constructor(selector) {
    this.selector = selector
    this.csv = ''
  }  
    // obj is in form [{code, size, slot}, {code, size, slot, ...]
  // generates the big table in the middle, with all exams alphabetically
  examsToTable(obj) {
    const tdSep = '</td><td>'
    const startRow = '<tr><td>'
    const endRow = '</td></tr>'
    const startTable = '<table class="exams">'
    const tHeader = '<thead><tr><th>Examen</th><th>Aantal</th><th>Moment</th><th>Semester</th><th>Periode</th></tr></thead>'
    const endTable = '</table>'
  
    let table = ''
    let rows = ''
    let semester, periode, exam
    
    obj.forEach(function (item) {
      semester = item.code[item.code.length - 2]
      periode = item.code[item.code.length - 1]
      exam = [item.code, item.size, item.slot, semester, periode].join(tdSep)
      rows += startRow + exam + endRow
    });
    table = startTable + tHeader + rows + endTable
  
    return table
  }

  // obj is in form [{code, side, 1}, {code, size, 1}, ...]
  // where 1=current slot
  // converts one slot to an HTML table
  #slotToTable(obj) {
    const tdSep = '</td><td>'
    const startRow = '<tr><td>'
    const endRow = '</td></tr>'
    const startTable = '<table class="exams">'
    const tHeader = '<thead><tr><th>Examen</th><th>Aantal</th></tr></thead>'
    const endTable = '</table>'
  
    let table = ''
    let rows = ''
    let exam = ''
  
    obj.forEach(function (item) {
      exam = [item.code, item.size].join(tdSep)
      rows += startRow + exam + endRow
    });
    table = startTable + tHeader + rows + endTable
  
    return table
  }
  
  // obj is in form [{code, size, slot}, {code, size, slot}, ...]
  // converts all slots to HTML tables (calling slotToTable)
  slotsToTables(obj) {
    let tables = ''
    let slots = []
    let numStudents = 0
  
    obj.forEach(function (item) {
      if (!slots[item.slot])
        slots[item.slot] = []
      slots[item.slot].push(item)
    })
    slots.forEach(function (exams) {
        numStudents = exams.reduce((total, exam) => total + exam.size, 0);   
        tables += '<h3>' + Number(exams[0].slot+1) + ': ' + Number(numStudents) + '&nbsp;students' + '</h3>'
        tables += this.#slotToTable(exams)
      }, this
    )
    return tables
  }

  // obj is in form [Concflict, Conflict, ...]
  // a conflict is {exam1, exam2}
  // an exam is {code, slot, size}
  // converts all conflicts to an HTML table
  conflictsToTable(obj) {
    const tdSep = '</td><td>'
    const startRow = '<tr><td>'
    const endRow = '</td></tr>'
    const startTable = '<table class="exams">'
    const tHeader = '<thead><tr><th>Vak 1</th><th>Vak 2</th></tr></thead>'
    const endTable = '</table>'
  
    let table = ''
    let rows = ''
  
    let conflict = ''
    obj.forEach(function (item) {
      if (item.exam1.code === undefined || item.exam2.code === undefined)
        console.log("no code for " + item)
      else
        conflict = [item.exam1.code, item.exam2.code].join(tdSep)
      rows += startRow + conflict + endRow
    });
    if (obj.length > 0)
      table = startTable + tHeader + rows + endTable
  
    return table
  }

  // obj is in [{studentId, code, slot}, {studentId, code, slot}, ...]
  // converts all conflicts to an HTML table
  studentScheduleToTable(obj) {
    const tdSep = '</td><td>'
    const startRow = '<tr><td>'
    const endRow = '</td></tr>'
    const startTable = '<table class="studentExams">'
    const tHeader = '<thead><tr><th>Student</th><th>Vak</th><th>Moment</th></tr></thead>'
    const endTable = '</table>'
  
    let table = ''
    let rows = ''
  
    let exam = ''
    obj.forEach(function (item) {
      let objStudent = item.student
      let objExam = item.exam
      exam = [objStudent.id, objExam.code, objExam.slot].join(tdSep)
      rows += startRow + exam + endRow
    });
    if (obj.length > 0)
      table = startTable + tHeader + rows + endTable
  
    return table
  }
}

export { TableGenerator }