# Schedule
This program can schedule ststudeudent tests. 
The tests are input in the form
"studentid[TAB]examid"

The output is a list of time slots with non-conflicting tests

## Technical
The program is runnable as a webpage (HTML/CSS/JavaScript) in a modern browser.
It uses [genetic.js](https://github.com/subprotocol/genetic-js) to make the schedule.
You are free to use of fork this program, but not sell it.
It uses webworkers to keep the ui running, but I am thinking of taking that out,
since the program is fast enough and it makes debugging harder.

## import module graph
- ui
  - scheduler 
      - genetic 
      - tableGenerator
      - examData
        - combinatorics
      - stochastic 
      - tableGenerator
      - genetic
  - tableExport

