'use strict'

class TableExport {
  constructor(selector) {
    this.selector = selector
    this.csv = ''
  }  

  toCSV() {
    let csv = []
    let rows = document.querySelectorAll(this.selector + " tr")

    for(let i = 0; i < rows.length; i++){
        let row = [], cols = rows[i].querySelectorAll("td, th")
        for(let j = 0; j < cols.length; j++){
            row.push(cols[j].innerText)
        }
        csv.push(row.join(",")) 
    }

    this.csv = csv.join("\n")
    return this
  }

  #hasBrowserSupport() {
  	return !(
      window.Blob == undefined 
      || window.URL == undefined 
      || window.URL.createObjectURL == undefined
    )   
  }
  
  download(filename='csv', addTimeStamp=false) {
    let csvFile
    let downloadLink

    if (!this.#hasBrowserSupport()) {
      alert("Your browser doesn't support Blobs")
    }

    this.filename = filename
    if (addTimeStamp) {
       this.filename += '-' + Date.now().toString(16)
    }
    
    csvFile = new Blob([this.csv], {type:"text/csv"})
    downloadLink = document.createElement("a")
    downloadLink.download = this.filename
    downloadLink.href = window.URL.createObjectURL(csvFile)
    downloadLink.style.display = "none"
    document.body.appendChild(downloadLink)
    downloadLink.click()
    
    return this
  }
}

export { TableExport }