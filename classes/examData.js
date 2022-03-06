'use strict'

import {Combinatorics} from './combinatorics.js'

class Exam {
  // code: unique exam identifier
  // slot: time slot exam will be placed in
  // size: number of students planning to do this exam
  constructor(code, slot, size) {
    this.code = code
    this.slot = slot
    this.size = size
  }
}

class Student {
  constructor(id) {
    this.id = id
  }
}

class StudentExam {
  // exam is an Exam object
  // student is a Student object
  constructor(exam, student) {
    this.exam = exam
    this.student = student      
  }
}

class Conflict {
  constructor(exam1, exam2) {
    let pair = [exam1, exam2]
    pair.sort((a, b) => a.code < b.code ? -1 : 1)
    this.exam1 = pair[0]
    this.exam2 = pair[1]
  }

  list() {
    return [exam1, exam2]
  }

  toString() {
    return [this.exam1.code, this.exam2.code].join(',')
  }
}

class ExamData {
  constructor(studentExams = null) {
    this.studentExams = studentExams
    this.students = null
    this.exams = null
    this.examsByStudent = null
  }  

  sortExamByName(exam1, exam2) {
    return exam1.code < exam2.code
  }

  getConflicts() {
    // create list of conflicts
    let conflicts = []
    let setOfConflicts = new Set()
    for (let s in this.examsByStudent) {
      let exams = this.examsByStudent[s]
      if (exams.length > 1) {
        let p = Combinatorics.pairs(exams, 2)
        p.forEach(combination => {
          let c = new Conflict(...combination)
          let pairAsText = c.toString()
          if (!setOfConflicts.has(pairAsText)) {
            conflicts.push(c)
            setOfConflicts.add(pairAsText)
          }
        })
      }
    }
    let conflictsSorted = conflicts.sort((a, b) => a.exam1.code < b.exam1.code ? -1 : 1)
    return conflictsSorted
  }
  
  // txtExams is in form "studentId  examID"
  readdata(txtExams, separator = "\t") {
    // read lines into array of student,exam form
    let text = txtExams.trim()
    let rows = text.split("\n").filter(x => x.trim() != '')
    let studentExams = rows.map(x => x.split(separator).map(x => x.trim()))
    studentExams.sort((a, b) => a[0] < b[0] ? -1 : 1)    
    
    // convert array to anonymous objects
    let studentExamObjects = studentExams.map(x => {return {id:x[0], code:x[1]}})
    
    // get unique list of exam codes (names)
    let examCodes = Array.from(new Set(studentExamObjects.map(x => x.code)))    

    // create unique list of students (ids)
    let students  = Array.from(new Set(studentExamObjects.map(x => x.id)))
    this.students = students.map(s => new Student(s))

    // create list of exam objects
    this.exams = examCodes.map(code => new Exam(code, 0, 0))

    // calculate size (count of exams by code)
    studentExamObjects.forEach(exam => {
      this.exams.find(e=>e.code==exam.code).size++
    })
    
    // create list of student exam entries, linked to exam objects
    this.studentExams = studentExamObjects.map(exam => {
      let objExam = this.exams.find(e=>e.code == exam.code)
      let objStudent = this.students.find(s=>s.id == exam.id)
      return new StudentExam(objExam, objStudent)
    })

    this.examsByStudent = []
    this.studentExams.forEach(s => {
      if (this.examsByStudent[s.student.id])
        this.examsByStudent[s.student.id].push(s.exam)
      else
        this.examsByStudent[s.student.id] = []
    })
    return this
  }

}

export { ExamData }