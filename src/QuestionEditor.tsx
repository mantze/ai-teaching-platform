import React, { useState, useEffect } from 'react'
import { CKEditor } from '@ckeditor/ckeditor5-react'
import ClassicEditor from '@ckeditor/ckeditor5-build-classic'
import { supabase } from './services/supabase'
import { Question, Topic } from './types/index'

interface QuestionEditorProps {
  question?: Question | null
  onSaveComplete?: () => void
  onCancel?: () => void
  mode?: 'create' | 'edit'
}

type AnswerType = 'text' | 'choice' | 'multiple_choice' | 'fill' | 'matching' | 'ordering'

export function QuestionEditor({ question, onSaveComplete, onCancel, mode = 'edit' }: QuestionEditorProps) {
  const [content, setContent] = useState('')
  const [answerType, setAnswerType] = useState<AnswerType>('text')
  const [answerContent, setAnswerContent] = useState('')
  const [explanationContent, setExplanationContent] = useState('')
  const [status, setStatus] = useState<'active' | 'pending' | 'inactive' | 'draft' | 'pending_review'>('draft')
  const [saving, setSaving] = useState(false)
  const [subjectId, setSubjectId] = useState('')
  const [difficulty, setDifficulty] = useState('medium')
  const [grade, setGrade] = useState('P5')
  const [topicId, setTopicId] = useState('')
  const [topics, setTopics] = useState<Topic[]>([])
  const [tags, setTags] = useState('')
  const [showPreview, setShowPreview] = useState(false)
  const [copiedId, setCopiedId] = useState(false)
  const [imageSizeWarning, setImageSizeWarning] = useState('')

  useEffect(() => {
    async function loadTopics() {
      const { data, error } = await supabase.from('topics').select('*').order('name')
      if (error) console.error('Error loading topics:', error)
      if (data) setTopics(data)
    }
    loadTopics()
  }, [])

  useEffect(() => {
    if (question) {
      setContent(question.title || '')
      setStatus(question.status || 'draft')
      setSubjectId(question.subject_id || '')
      setDifficulty(question.difficulty || 'medium')
      setGrade(extractGradeFromTags(question.tags))
      setTopicId(question.topic_id || '')
      setTags(question.tags?.join(', ') || '')
      const qContent = question.content as any
      setAnswerType(qContent?.answer_type || 'text')
      setAnswerContent(qContent?.answer || '')
      setExplanationContent(qContent?.explanation || qContent?.remark || '')
    }
  }, [question])

  useEffect(() => {
    const subjectName = getSubjectName(subjectId)
    const difficultyName = difficulty === 'easy' ? '淺' : difficulty === 'medium' ? '中' : '深'
    const existingTags = tags.split(',').map(t => t.trim()).filter(t => t && t !== subjectName && t !== difficultyName && !t.match(/^P[1-6]|S[1-6]$/i))
    const autoTags = [subjectName, difficultyName, grade].filter(Boolean)
    const allTags = Array.from(new Set([...autoTags, ...existingTags]))
    setTags(allTags.join(', '))
  }, [subjectId, difficulty, grade])

  function extractGradeFromTags(tags?: string[]): string {
    if (!tags) return 'P5'
    const gradeTag = tags.find(t => t.match(/^P[1-6]|S[1-6]$/i))
    return gradeTag || 'P5'
  }

  function getSubjectName(id: string): string {
    const subjects: Record<string, string> = {
      'd302b713-42c1-46ff-8844-1662f5cbf1fb': '數學',
      'b4186fda-a862-4a94-8472-07c381f3f378': '中文',
      '62291ec5-13fe-4299-bafa-0f9ec4b2481b': '英文'
    }
    return subjects[id] || '綜合'
  }

  async function handleCopyId() {
    if (question?.id) {
      await navigator.clipboard.writeText(question.id)
      setCopiedId(true)
      setTimeout(() => setCopiedId(false), 2000)
    }
  }

  async function handleDuplicate() {
    if (!question) return
    setSaving(true)
    const questionData: any = {
      title: content + ' (複製)',
      content: { text: content, type: 'custom', answer_type: answerType, answer: answerContent, explanation: explanationContent },
      question_type: answerType === 'choice' ? 'choice' : answerType === 'fill' ? 'fill' : 'answer',
      subject_id: subjectId,
      topic_id: topicId || null,
      difficulty,
      score: question.score || 2,
      tags: tags.split(',').map(t => t.trim()).filter(Boolean),
      status: 'draft',
      source_question_id: question.id
    }
    const { data, error } = await supabase.from('questions').insert([questionData]).select()
    setSaving(false)
    if (error) alert('複製失敗：' + error.message)
    else {
      alert('✅ 題目已複製！')
      // 跳轉到新複製嘅題目進行編輯
      if (data && data.length > 0 && onSaveComplete) {
        onSaveComplete()
      }
    }
  }

  async function handleSave() {
    if (!content.trim()) {
      alert('請輸入題目內容')
      return
    }
    const contentLength = content.length
    if (contentLength > 50000) {
      setImageSizeWarning(`⚠️ 內容過長（${contentLength} 字符），建議壓縮圖片或減少圖片數量`)
      if (!window.confirm('內容過長可能導致保存失敗，確定要繼續嗎？')) return
    }
    setSaving(true)
    const questionData: any = {
      title: content,
      content: { text: content, type: 'custom', answer_type: answerType, answer: answerContent, explanation: explanationContent },
      question_type: answerType === 'choice' ? 'choice' : answerType === 'fill' ? 'fill' : 'answer',
      subject_id: subjectId,
      topic_id: topicId || null,
      difficulty,
      score: 2,
      tags: tags.split(',').map(t => t.trim()).filter(Boolean),
      status,
      updated_at: new Date().toISOString()
    }
    let result
    if (question?.id) result = await supabase.from('questions').update(questionData).eq('id', question.id)
    else result = await supabase.from('questions').insert([questionData])
    setSaving(false)
    setImageSizeWarning('')
    if (result.error) {
      console.error('Save error:', result.error)
      if (result.error.message.includes('value too long')) alert('儲存失敗：內容過長，請壓縮圖片或減少圖片數量')
      else alert('儲存失敗：' + result.error.message)
    } else {
      alert('✅ 題目已儲存！')
      if (onSaveComplete) onSaveComplete()
    }
  }

  function getShortId(id?: string): string {
    if (!id) return '新題目'
    return `#${id.substring(0, 8)}`
  }

  function uploadImageToBase64(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = () => {
        const base64 = reader.result as string
        const sizeInKB = Math.round(base64.length / 1024 * 0.75)
        if (sizeInKB > 500) setImageSizeWarning(`⚠️ 圖片過大（${sizeInKB}KB），建議使用小於 500KB 的圖片`)
        resolve(base64)
      }
      reader.onerror = reject
      reader.readAsDataURL(file)
    })
  }

  const editorConfig = {
    toolbar: ['heading', '|', 'fontSize', 'fontFamily', 'fontColor', 'fontBackgroundColor', '|', 'bold', 'italic', 'underline', 'strikethrough', 'subscript', 'superscript', '|', 'link', 'bulletedList', 'numberedList', 'todoList', '|', 'outdent', 'indent', '|', 'imageUpload', 'imageInsert', 'blockQuote', 'insertTable', '|', 'mediaEmbed', '|', 'alignment', '|', 'horizontalLine', 'pageBreak', '|', 'specialCharacters', 'code', 'htmlEmbed', '|', 'undo', 'redo', 'removeFormat', '|', 'sourceEditing'],
    fontSize: { options: [10, 12, 14, 'default', 18, 20, 22, 24, 28, 32, 36, 40], supportAllValues: true },
    fontFamily: { options: ['default', 'Arial, Helvetica, sans-serif', 'Georgia, serif', 'Courier New, monospace', 'Times New Roman, serif', 'Verdana, sans-serif', 'Tahoma, sans-serif'], supportAllValues: true },
    fontColor: { colors: [{ color: '#000000', label: 'Black' }, { color: '#434343', label: 'Dark Gray' }, { color: '#666666', label: 'Gray' }, { color: '#999999', label: 'Light Gray' }, { color: '#B7B7B7', label: 'Silver' }, { color: '#CCCCCC', label: 'Light Silver' }, { color: '#EFEBEB', label: 'White' }, { color: '#FFFFFF', label: 'Pure White' }, { color: '#E03E2D', label: 'Red' }, { color: '#F69D1D', label: 'Orange' }, { color: '#FFC000', label: 'Amber' }, { color: '#7FAD3D', label: 'Green' }, { color: '#2E75B5', label: 'Blue' }, { color: '#00B0F0', label: 'Light Blue' }, { color: '#6F3FAA', label: 'Purple' }, { color: '#993366', label: 'Pink' }] },
    fontBackgroundColor: { colors: [{ color: '#FFFFFF', label: 'White' }, { color: '#FFFF00', label: 'Yellow' }, { color: '#00FFFF', label: 'Cyan' }, { color: '#90EE90', label: 'Light Green' }, { color: '#FFB6C1', label: 'Light Pink' }, { color: '#FFD700', label: 'Gold' }, { color: '#FFA500', label: 'Orange' }, { color: '#FF69B4', label: 'Hot Pink' }] },
    image: { toolbar: ['imageTextAlternative', 'imageStyle:alignLeft', 'imageStyle:full', 'imageStyle:alignRight', 'imageStyle:side', '|', 'toggleImageCaption', 'resizeImage'], styles: ['full', 'side', 'alignLeft', 'alignRight', 'alignCenter', 'alignBlockLeft', 'alignBlockRight'], resizeOptions: [{ name: 'resizeImage:original', label: '原始大小', value: null }, { name: 'resizeImage:25', label: '25%', value: '25' }, { name: 'resizeImage:50', label: '50%', value: '50' }, { name: 'resizeImage:75', label: '75%', value: '75' }, { name: 'resizeImage:custom', label: '自定義', value: 'custom' }], insert: { type: 'auto' }, resizeUnit: '%' },
    table: { contentToolbar: ['tableColumn', 'tableRow', 'mergeTableCells', 'tableProperties', 'tableCellProperties'], tableProperties: { borderColors: { options: [{ color: '#000000', label: 'Black' }, { color: '#999999', label: 'Gray' }, { color: '#CCCCCC', label: 'Light Gray' }, { color: 'transparent', label: 'No Border' }] }, backgroundColors: { options: [{ color: '#FFFFFF', label: 'White' }, { color: '#FFFF00', label: 'Yellow' }, { color: '#00FFFF', label: 'Cyan' }, { color: 'transparent', label: 'No Background' }] } } },
    htmlEmbed: { showPreviews: true, sanitizeHtml: (html: string) => html },
    language: 'zh',
    placeholder: '在此輸入題目內容...'
  }

  if (showPreview) {
    return (
      <div className="p-6 max-w-4xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-gray-800">👁️ 預覽模式</h2>
          <button onClick={() => setShowPreview(false)} className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700">✏️ 返回編輯</button>
        </div>
        <div className="bg-white p-6 rounded-lg shadow-lg border">
          <div className="flex gap-2 mb-4">
            <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded">{getSubjectName(subjectId)}</span>
            <span className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded">{grade}</span>
            <span className="px-2 py-1 bg-yellow-100 text-yellow-800 text-xs rounded">{difficulty === 'easy' ? '淺' : difficulty === 'medium' ? '中' : '深'}</span>
          </div>
          <div className="prose max-w-none mb-6"><div dangerouslySetInnerHTML={{ __html: content }} /></div>
          <div className="border-t pt-4 mt-4">
            <h3 className="text-lg font-semibold text-gray-700 mb-2">📝 你的答案</h3>
            {answerType === 'choice' && (
              <div className="space-y-2">
                <div className="flex items-center gap-2 p-3 border rounded hover:bg-gray-50 cursor-pointer"><input type="radio" name="preview_answer" className="w-4 h-4" /><span>選項 A</span></div>
                <div className="flex items-center gap-2 p-3 border rounded hover:bg-gray-50 cursor-pointer"><input type="radio" name="preview_answer" className="w-4 h-4" /><span>選項 B</span></div>
                <div className="flex items-center gap-2 p-3 border rounded hover:bg-gray-50 cursor-pointer"><input type="radio" name="preview_answer" className="w-4 h-4" /><span>選項 C</span></div>
                <div className="flex items-center gap-2 p-3 border rounded hover:bg-gray-50 cursor-pointer"><input type="radio" name="preview_answer" className="w-4 h-4" /><span>選項 D</span></div>
              </div>
            )}
            {answerType === 'fill' && <input type="text" placeholder="請輸入答案" className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500" />}
            {answerType === 'text' && <textarea placeholder="請輸入你的答案" rows={4} className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500" />}
          </div>
          <div className="mt-6 flex justify-end"><button className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium">提交答案</button></div>
        </div>
        <div className="mt-8 pt-6 border-t border-gray-200">
          <div className="flex justify-between items-center text-xs text-gray-500">
            <div><span>版本：1.3.0</span><span className="mx-2">|</span><span>最後更新：{new Date().toLocaleString('zh-HK', { timeZone: 'Asia/Hong_Kong' })}</span></div>
            <div className="flex gap-4"><span>🇭🇰 HKT (UTC+8)</span><span>AI 教學平台</span></div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center gap-3">
          <h2 className="text-2xl font-bold text-gray-800">{question ? `✏️ 編輯題目 ${getShortId(question.id)}` : '➕ 建立新題目'}</h2>
          {question && (
            <div className="flex items-center gap-2">
              <button onClick={handleCopyId} className="px-3 py-1 bg-gray-100 text-gray-700 rounded hover:bg-gray-200 text-sm flex items-center gap-1" title="複製題目 ID">
                {copiedId ? '✅ 已複製' : '📋 複製 ID'}
              </button>
              <button onClick={handleDuplicate} className="px-3 py-1 bg-blue-100 text-blue-700 rounded hover:bg-blue-200 text-sm" title="複製題目">📋 複製題目</button>
            </div>
          )}
        </div>
        <div className="flex gap-2">
          <button onClick={() => setShowPreview(true)} className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors">👁️ 預覽</button>
          {onCancel && <button onClick={onCancel} className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors">返回</button>}
          <button onClick={handleSave} disabled={saving} className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 transition-colors font-medium flex items-center gap-2">
            <span>💾</span><span>{saving ? '儲存中...' : '儲存'}</span>
          </button>
        </div>
      </div>

      <div className="bg-white p-4 rounded-lg shadow-sm border mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-2">📝 題目內容</label>
        <CKEditor editor={ClassicEditor} data={content} onReady={(editor: any) => { editor.plugins.get('FileRepository').createUploadAdapter = (loader: any) => ({ upload: () => loader.file.then((file: File) => uploadImageToBase64(file).then((base64) => ({ default: base64 }))) }) }} onChange={(event, editor) => { const data = editor.getData(); setContent(data); const length = data.length; if (length > 40000) setImageSizeWarning(`⚠️ 內容較長（${length} 字符），建議壓縮圖片`); else setImageSizeWarning('') }} config={editorConfig} />
        <div className="flex justify-between items-center mt-2">
          <p className="text-xs text-gray-500">💡 圖片會自動轉換為 Base64 格式保存</p>
          <p className="text-xs text-gray-500">當前長度：{content.length} 字符</p>
        </div>
        {imageSizeWarning && <div className="mt-2 p-3 bg-yellow-50 border border-yellow-200 rounded-lg"><p className="text-sm text-yellow-800">{imageSizeWarning}</p></div>}
        <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <h4 className="text-sm font-semibold text-blue-900 mb-2">🖼️ 圖片對齊技巧：</h4>
          <ul className="text-xs text-blue-800 space-y-1">
            <li>• <strong>左對齊</strong>：圖片靠左，文字環繞右側</li>
            <li>• <strong>居中</strong>：圖片居中，適合獨立圖示</li>
            <li>• <strong>右對齊</strong>：圖片靠右，文字環繞左側</li>
            <li>• <strong>全寬</strong>：圖片佔滿整個寬度</li>
            <li>• <strong>側邊</strong>：圖片浮動側邊，適合小圖示</li>
            <li>• <strong>調整大小</strong>：點擊圖片 → 選擇 25%/50%/75%/原始大小</li>
          </ul>
        </div>
      </div>

      <div className="bg-white p-4 rounded-lg shadow-sm border mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-3">📌 答案類型</label>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          <label className={`flex items-center gap-2 cursor-pointer p-3 border rounded-lg transition-colors ${answerType === 'text' ? 'bg-blue-50 border-blue-500' : 'hover:bg-gray-50'}`}>
            <input type="radio" name="answerType" checked={answerType === 'text'} onChange={() => setAnswerType('text')} className="w-4 h-4 text-blue-600" />
            <div><span className="text-sm font-medium">✍️ 問答題</span><p className="text-xs text-gray-500">自由文字作答</p></div>
          </label>
          <label className={`flex items-center gap-2 cursor-pointer p-3 border rounded-lg transition-colors ${answerType === 'choice' ? 'bg-blue-50 border-blue-500' : 'hover:bg-gray-50'}`}>
            <input type="radio" name="answerType" checked={answerType === 'choice'} onChange={() => setAnswerType('choice')} className="w-4 h-4 text-blue-600" />
            <div><span className="text-sm font-medium">🔘 選擇題</span><p className="text-xs text-gray-500">單項選擇</p></div>
          </label>
          <label className={`flex items-center gap-2 cursor-pointer p-3 border rounded-lg transition-colors ${answerType === 'multiple_choice' ? 'bg-blue-50 border-blue-500' : 'hover:bg-gray-50'}`}>
            <input type="radio" name="answerType" checked={answerType === 'multiple_choice'} onChange={() => setAnswerType('multiple_choice')} className="w-4 h-4 text-blue-600" />
            <div><span className="text-sm font-medium">☑️ 多選題</span><p className="text-xs text-gray-500">多項選擇</p></div>
          </label>
          <label className={`flex items-center gap-2 cursor-pointer p-3 border rounded-lg transition-colors ${answerType === 'fill' ? 'bg-blue-50 border-blue-500' : 'hover:bg-gray-50'}`}>
            <input type="radio" name="answerType" checked={answerType === 'fill'} onChange={() => setAnswerType('fill')} className="w-4 h-4 text-blue-600" />
            <div><span className="text-sm font-medium">✏️ 填充題</span><p className="text-xs text-gray-500">填充空格</p></div>
          </label>
          <label className={`flex items-center gap-2 cursor-pointer p-3 border rounded-lg transition-colors ${answerType === 'matching' ? 'bg-blue-50 border-blue-500' : 'hover:bg-gray-50'}`}>
            <input type="radio" name="answerType" checked={answerType === 'matching'} onChange={() => setAnswerType('matching')} className="w-4 h-4 text-blue-600" />
            <div><span className="text-sm font-medium">🔗 配對題</span><p className="text-xs text-gray-500">配對左右欄</p></div>
          </label>
          <label className={`flex items-center gap-2 cursor-pointer p-3 border rounded-lg transition-colors ${answerType === 'ordering' ? 'bg-blue-50 border-blue-500' : 'hover:bg-gray-50'}`}>
            <input type="radio" name="answerType" checked={answerType === 'ordering'} onChange={() => setAnswerType('ordering')} className="w-4 h-4 text-blue-600" />
            <div><span className="text-sm font-medium">📊 排序題</span><p className="text-xs text-gray-500">排列順序</p></div>
          </label>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        <div className="bg-white p-4 rounded-lg shadow-sm border">
          <label className="block text-sm font-medium text-gray-700 mb-2">✅ 答案{answerType !== 'text' && <span className="ml-2 text-xs text-gray-500">({answerType === 'choice' ? '正確選項' : answerType === 'fill' ? '正確答案' : '參考答案'})</span>}</label>
          <CKEditor editor={ClassicEditor} data={answerContent} onChange={(event, editor) => { const data = editor.getData(); setAnswerContent(data) }} config={{ toolbar: ['bold', 'italic', 'bulletedList', 'numberedList', '|', 'undo', 'redo'], language: 'zh' }} />
        </div>
        <div className="bg-white p-4 rounded-lg shadow-sm border">
          <label className="block text-sm font-medium text-gray-700 mb-2">💡 解釋 / 備註</label>
          <CKEditor editor={ClassicEditor} data={explanationContent} onChange={(event, editor) => { const data = editor.getData(); setExplanationContent(data) }} config={{ toolbar: ['bold', 'italic', 'bulletedList', 'numberedList', '|', 'undo', 'redo'], language: 'zh' }} />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white p-4 rounded-lg shadow-sm border">
          <label className="block text-sm font-medium text-gray-700 mb-2">📚 科目</label>
          <select value={subjectId} onChange={(e) => setSubjectId(e.target.value)} className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500">
            <option value="">選擇科目</option>
            <option value="d302b713-42c1-46ff-8844-1662f5cbf1fb">數學</option>
            <option value="b4186fda-a862-4a94-8472-07c381f3f378">中文</option>
            <option value="62291ec5-13fe-4299-bafa-0f9ec4b2481b">英文</option>
          </select>
        </div>
        <div className="bg-white p-4 rounded-lg shadow-sm border">
          <label className="block text-sm font-medium text-gray-700 mb-2">⚡ 難度</label>
          <select value={difficulty} onChange={(e) => setDifficulty(e.target.value)} className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500">
            <option value="easy">淺 (Easy)</option>
            <option value="medium">中 (Medium)</option>
            <option value="hard">深 (Hard)</option>
          </select>
        </div>
        <div className="bg-white p-4 rounded-lg shadow-sm border">
          <label className="block text-sm font-medium text-gray-700 mb-2">🎓 級別</label>
          <select value={grade} onChange={(e) => setGrade(e.target.value)} className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500">
            <option value="P1">小一 (P1)</option>
            <option value="P2">小二 (P2)</option>
            <option value="P3">小三 (P3)</option>
            <option value="P4">小四 (P4)</option>
            <option value="P5">小五 (P5)</option>
            <option value="P6">小六 (P6)</option>
            <option value="S1">中一 (S1)</option>
            <option value="S2">中二 (S2)</option>
            <option value="S3">中三 (S3)</option>
            <option value="S4">中四 (S4)</option>
            <option value="S5">中五 (S5)</option>
            <option value="S6">中六 (S6)</option>
          </select>
        </div>
        <div className="bg-white p-4 rounded-lg shadow-sm border">
          <label className="block text-sm font-medium text-gray-700 mb-2">📖 主題 (Topic)</label>
          <select value={topicId} onChange={(e) => setTopicId(e.target.value)} className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500">
            <option value="">選擇主題</option>
            {topics.map(topic => (<option key={topic.id} value={topic.id}>{topic.name}</option>))}
          </select>
        </div>
      </div>

      <div className="bg-white p-4 rounded-lg shadow-sm border mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-2">🏷️ 標籤（用逗號分隔）</label>
        <input type="text" value={tags} onChange={(e) => setTags(e.target.value)} placeholder="系統會自動添加科目、難度、級別" className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500" />
        <p className="text-xs text-gray-500 mt-2">💡 自動標籤：{getSubjectName(subjectId)}, {difficulty === 'easy' ? '淺' : difficulty === 'medium' ? '中' : '深'}, {grade}</p>
      </div>

      <div className="bg-white p-4 rounded-lg shadow-sm border mb-6">
        <h3 className="text-sm font-semibold text-gray-700 mb-3">📌 題目狀態</h3>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          {['active', 'pending', 'inactive', 'draft', 'pending_review'].map((s) => (
            <label key={s} className="flex items-center gap-2 cursor-pointer p-3 border rounded-lg hover:bg-gray-50 transition-colors">
              <input type="radio" name="status" checked={status === s} onChange={() => setStatus(s as any)} className="w-4 h-4 text-blue-600" />
              <span className="text-sm capitalize">{s}</span>
            </label>
          ))}
        </div>
      </div>

      <div className="mt-6 flex justify-end gap-2">
        <button onClick={() => setShowPreview(true)} className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700">👁️ 預覽</button>
        {onCancel && <button onClick={onCancel} className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700">返回</button>}
        <button onClick={handleSave} disabled={saving} className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 font-medium">{saving ? '儲存中...' : '💾 儲存'}</button>
      </div>

      {/* Footer */}
      <div className="mt-8 pt-6 border-t border-gray-200">
        <div className="flex justify-between items-center text-xs text-gray-500">
          <div>
            <span>版本：1.3.0</span>
            <span className="mx-2">|</span>
            <span>最後更新：{new Date().toLocaleString('zh-HK', { timeZone: 'Asia/Hong_Kong' })}</span>
          </div>
          <div className="flex gap-4">
            <span>🇭🇰 HKT (UTC+8)</span>
            <span>AI 教學平台</span>
          </div>
        </div>
      </div>
    </div>
  )
}
