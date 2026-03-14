import React from 'react'
import { fabric } from 'fabric'

interface Props {
  selectedObject: fabric.Object | null
  canvas: fabric.Canvas | null
}

export function QuestionProperties({ selectedObject, canvas }: Props) {
  if (!selectedObject || !canvas) {
    return <div className={'p-4 text-gray-500 text-sm'}>選擇元素編輯屬性</div>
  }

  const isText = selectedObject.type === 'textbox' || selectedObject.type === 'text'

  function update(prop: string, value: any) {
    if (selectedObject && canvas) {
      selectedObject.set(prop as any, value)
      canvas.renderAll()
    }
  }

  return (
    <div className={'p-4'}>
      <h3 className={'font-semibold mb-4'}>屬性</h3>
      <div className={'space-y-3'}>
        <div>
          <label className={'block text-xs text-gray-600 mb-1'}>位置 X</label>
          <input type={'number'} className={'w-full p-2 border rounded text-sm'} value={Math.round(selectedObject.left || 0)} onChange={e => update('left', parseInt(e.target.value) || 0)} />
        </div>
        <div>
          <label className={'block text-xs text-gray-600 mb-1'}>位置 Y</label>
          <input type={'number'} className={'w-full p-2 border rounded text-sm'} value={Math.round(selectedObject.top || 0)} onChange={e => update('top', parseInt(e.target.value) || 0)} />
        </div>
        {isText && (
          <>
            <div>
              <label className={'block text-xs text-gray-600 mb-1'}>字體大小</label>
              <input type={'number'} className={'w-full p-2 border rounded text-sm'} value={(selectedObject as any).fontSize || 16} onChange={e => update('fontSize', parseInt(e.target.value) || 16)} />
            </div>
            <div>
              <label className={'block text-xs text-gray-600 mb-1'}>顏色</label>
              <input type={'color'} className={'w-full h-8 border rounded'} value={(selectedObject as any).fill || '#000000'} onChange={e => update('fill', e.target.value)} />
            </div>
          </>
        )}
        <div>
          <label className={'block text-xs text-gray-600 mb-1'}>旋轉</label>
          <input type={'number'} className={'w-full p-2 border rounded text-sm'} value={Math.round(selectedObject.angle || 0)} onChange={e => update('angle', parseInt(e.target.value) || 0)} min={0} max={360} />
        </div>
      </div>
    </div>
  )
}
