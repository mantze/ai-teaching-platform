import React from 'react'
import { CheckSquare, Type, Image, List } from 'lucide-react'

const TYPES = [
  { id: 'choice', name: '選擇題', icon: CheckSquare },
  { id: 'fill', name: '填充題', icon: Type },
  { id: 'answer', name: '問答題', icon: List },
  { id: 'image', name: '圖片題', icon: Image },
]

interface Props {
  currentType: string
  onSelect: (type: string) => void
}

export function QuestionTypeSelector({ currentType, onSelect }: Props) {
  return (
    <div className={'w-40 border-r bg-white p-3'}>
      <h3 className={'text-sm font-semibold mb-3 text-gray-700'}>題目類型</h3>
      <div className={'space-y-2'}>
        {TYPES.map(t => (
          <button
            key={t.id}
            className={'w-full p-3 flex items-center gap-2 rounded border transition-colors ' + 
              (currentType === t.id ? 'bg-blue-50 border-blue-500 text-blue-700' : 'hover:bg-gray-50')}
            onClick={() => onSelect(t.id)}
          >
            <t.icon className={'w-4 h-4'} />
            <span className={'text-sm'}>{t.name}</span>
          </button>
        ))}
      </div>
    </div>
  )
}
