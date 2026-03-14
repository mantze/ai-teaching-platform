import React from 'react'
import { Type, Image, Square, Circle, Minus, Trash2 } from 'lucide-react'

interface EditorToolbarProps {
  onAddText: () => void
  onAddImage: () => void
  onDelete: () => void
}

export function EditorToolbar({ onAddText, onAddImage, onDelete }: EditorToolbarProps) {
  return (
    <div className={'border-b border-gray-200 bg-white p-3'}>
      <div className={'flex items-center gap-2'}>
        <button className={'p-2 hover:bg-gray-100 rounded'} onClick={onAddText} title={'Add Text'}>
          <Type className={'w-5 h-5'} />
        </button>
        <button className={'p-2 hover:bg-gray-100 rounded'} onClick={onAddImage} title={'Add Image'}>
          <Image className={'w-5 h-5'} />
        </button>
        <div className={'w-px h-6 bg-gray-300 mx-1'} />
        <button className={'p-2 hover:bg-gray-100 rounded'} title={'Rectangle'}>
          <Square className={'w-5 h-5'} />
        </button>
        <button className={'p-2 hover:bg-gray-100 rounded'} title={'Circle'}>
          <Circle className={'w-5 h-5'} />
        </button>
        <button className={'p-2 hover:bg-gray-100 rounded'} title={'Line'}>
          <Minus className={'w-5 h-5'} />
        </button>
        <div className={'w-px h-6 bg-gray-300 mx-1'} />
        <button className={'p-2 hover:bg-red-100 text-red-600 rounded'} onClick={onDelete} title={'Delete'}>
          <Trash2 className={'w-5 h-5'} />
        </button>
      </div>
    </div>
  )
}
