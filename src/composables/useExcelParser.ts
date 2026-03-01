import * as XLSX from 'xlsx'

export interface ExcelRow {
  [key: string]: any
}

export interface ParsedExcelData {
  headers: string[]
  rows: ExcelRow[]
}

export function useExcelParser() {
  function parseExcelFile(file: File): Promise<ParsedExcelData> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()

      reader.onload = (e) => {
        try {
          const isCSV = file.name.endsWith('.csv')
          const content = e.target!.result as string | ArrayBuffer

          const workbook = isCSV
            ? XLSX.read(content as string, { type: 'string' })
            : XLSX.read(new Uint8Array(content as ArrayBuffer), { type: 'array' })

          const sheet = workbook.Sheets[workbook.SheetNames[0]]
          const jsonData = XLSX.utils.sheet_to_json<ExcelRow>(sheet, { defval: '' })

          const headers = Object.keys(jsonData[0] || {})
          resolve({ headers, rows: jsonData })
        } catch (err) {
          reject(err)
        }
      }

      if (file.name.endsWith('.csv')) {
        reader.readAsText(file)
      } else {
        reader.readAsArrayBuffer(file)
      }
    })
  }

  return {
    parseExcelFile,
  }
}
