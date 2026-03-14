import React from 'react'
import { Save, Download } from 'lucide-react'

export function Toolbar() {
  return (
    <div className={'flex items-center justify-between'}>
      <div className={'flex items-center gap-2'}>
        <h1 className={'text-xl font-bold text-gray-800'}>AI Teaching Platform - Question Editor</h1>
        <span className={'text-sm text-gray-500 ml-4'}>Beta v0.1</span>
      </div>
      <div className={'flex items-center gap-2'}>
        <button className={'px-3 py-2 flex items-center gap-2 bg-blue-600 text-white hover:bg-blue-700 rounded'}>
          <Save className={'w-4 h-4'} />
          Save
        </button>
        <button className={'px-3 py-2 flex items-center gap-2 bg-green-600 text-white hover:bg-green-700 rounded'}>
          <Download className={'w-4 h-4'} />
          Export PDF
        </button>
      </div>
    </div>
  )
}
