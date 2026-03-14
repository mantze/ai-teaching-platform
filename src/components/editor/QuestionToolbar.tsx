import React from 'react'
import { Type, Image, Trash2, Save, Download } from 'lucide-react'

interface Props {
  onClear: () => void
  onLoadTemplate: (type: string) => void
}

export function QuestionToolbar({ onClear, onLoadTemplate }: Props) {
  return (
    <div className={'border-b bg-white p-3 flex items-center justify-between'}>
      <div className={'flex items-center gap-2'}>
        <button className={'px-3 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 flex items-center gap-2'}>
          <Save className={'w-4 h-4'} />
          儲存題目
        </button>
        <button className={'px-3 py-2 bg-green-600 text-white rounded hover:bg-green-700 flex items-center gap-2'}>
          <Download className={'w-4 h-4'} />
          導出 PDF
        </button>
      </div>
      <div className={'flex items-center gap-2'}>
        <button className={'px-3 py-2 bg-gray-100 rounded hover:bg-gray-200'} onClick={() => onLoadTemplate('choice')}>選擇題模板</button>
        <button className={'px-3 py-2 bg-gray-100 rounded hover:bg-gray-200'} onClick={() => onLoadTemplate('fill')}>填充題模板</button>
        <button className={'px-3 py-2 bg-red-100 text-red-600 rounded hover:bg-red-200 flex items-center gap-1'} onClick={onClear}>
          <Trash2 className={'w-4 h-4'} />
          清空
        </button>
      </div>
    </div>
  )
}
