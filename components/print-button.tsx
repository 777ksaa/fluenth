'use client'

import { PrinterIcon } from './icons'

/** Opens the browser's print dialog, where "Save as PDF" is one of the destinations. */
export function PrintButton() {
  return (
    <button type="button" className="btn btn-primary no-print" onClick={() => window.print()}>
      <PrinterIcon size={18} />
      <span>Print or save as PDF</span>
    </button>
  )
}
