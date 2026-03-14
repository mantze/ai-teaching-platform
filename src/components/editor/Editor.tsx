import React, { useEffect, useRef, useState } from 'react'
import { fabric } from 'fabric'
import { QuestionTypeSelector } from './QuestionTypeSelector'
import { QuestionToolbar } from './QuestionToolbar'
import { QuestionProperties } from './QuestionProperties'

export function Editor() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const fabricRef = useRef<fabric.Canvas | null>(null)
  const [selectedObject, setSelectedObject] = useState<any>(null)
  const [questionType, setQuestionType] = useState<string>('choice')
  const [isReady, setIsReady] = useState(false)

  useEffect(() => {
    if (!canvasRef.current) return
    const canvas = new fabric.Canvas(canvasRef.current, {
      backgroundColor: '#fff',
      preserveObjectStacking: true,
      selection: true,
    })
    fabricRef.current = canvas
    setIsReady(true)

    canvas.on('selection:created', e => setSelectedObject(e.selected?.[0] || null))
    canvas.on('selection:updated', e => setSelectedObject(e.selected?.[0] || null))
    canvas.on('selection:cleared', () => setSelectedObject(null))

    return () => { canvas.dispose() }
  }, [])

  function addText(text: string = '編輯文字...') {
    const canvas = fabricRef.current
    if (!canvas) return
    const t = new fabric.Textbox(text, { left: 50, top: 50, width: 300, fontSize: 18 })
    canvas.add(t)
    canvas.setActiveObject(t)
  }

  function addOption(label: string, text: string) {
    const canvas = fabricRef.current
    if (!canvas) return
    const grp = []
    const lbl = new fabric.Text(label, { left: 50, top: 100, fontSize: 16, fontWeight: 'bold' })
    const txt = new fabric.Textbox(text, { left: 80, top: 95, width: 400, fontSize: 16 })
    canvas.add(lbl, txt)
  }

  function addImagePlaceholder() {
    const canvas = fabricRef.current
    if (!canvas) return
    const rect = new fabric.Rect({ left: 100, top: 100, width: 300, height: 200, fill: '#f0f0f0', stroke: '#999', strokeWidth: 2 })
    const txt = new fabric.Text('圖片位置', { left: 200, top: 190, fontSize: 14, fill: '#666' })
    canvas.add(rect, txt)
  }

  function clearCanvas() {
    const canvas = fabricRef.current
    if (canvas) canvas.clear()
  }

  function loadTemplate(type: string) {
    clearCanvas()
    setQuestionType(type)
    if (type === 'choice') {
      addText('選擇題')
      addOption('(A)', '選項 A')
      addOption('(B)', '選項 B')
      addOption('(C)', '選項 C')
      addOption('(D)', '選項 D')
    } else if (type === 'fill') {
      addText('填充題')
      addText('1 + 1 = [____]')
    } else if (type === 'answer') {
      addText('問答題')
      addText('請寫出答案：')
    }
  }

  return (
    <div className={'flex flex-col h-full'}>
      <QuestionToolbar onClear={clearCanvas} onLoadTemplate={loadTemplate} />
      <div className={'flex flex-1 overflow-hidden'}>
        <QuestionTypeSelector currentType={questionType} onSelect={loadTemplate} />
        <div className={'flex-1 p-4 bg-gray-100 overflow-auto'}>
          <div className={'bg-white border rounded-lg shadow h-full'}>
            <canvas ref={canvasRef} className={'w-full'} style={{ minHeight: '600px' }} />
          </div>
        </div>
        <div className={'w-72 border-l bg-white overflow-y-auto'}>
          <QuestionProperties selectedObject={selectedObject} canvas={fabricRef.current} />
        </div>
      </div>
    </div>
  )
}
