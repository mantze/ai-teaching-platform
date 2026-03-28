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

interface QuestionOption {
  id: string
  text: string
  isCorrect?: boolean
}

export function QuestionEditor({ question, onSaveComplete, onCancel, mode = 'edit' }: QuestionEditorProps) {
  // 已知科目 UUIDs - 必須與資料庫一致
  const knownSubjects: Record<string, string> = {
    '數學': 'd302b713-42c1-46ff-8844-1662f5cbf1fb',
    '中文': 'b4186fda-a862-4a94-8472-07c381f3f378',
    '英文': '62291ec5-13fe-4299-bafa-0f9ec4b2481b',
    '常識': '114dcca3-2816-4f6f-99be-d82107179c99'
  }

  const [content, setContent] = useState('')
  const [answerType, setAnswerType] = useState<AnswerType>('text')
  const [answerContent, setAnswerContent] = useState('')
  const [explanationContent, setExplanationContent] = useState('')
  const [status, setStatus] = useState<'active' | 'pending' | 'inactive' | 'draft' | 'pending_review'>('draft')
  const [saving, setSaving] = useState(false)
  const [subjectId, setSubjectId] = useState('')
  const [subjectName, setSubjectName] = useState('')
  const [difficulty, setDifficulty] = useState('medium')
  const [grade, setGrade] = useState('P5')
  const [topicId, setTopicId] = useState('')
  const [topicName, setTopicName] = useState('')
  const [topics, setTopics] = useState<Topic[]>([])
  const [tags, setTags] = useState('')
  const [showPreview, setShowPreview] = useState(false)
  const [copiedId, setCopiedId] = useState(false)
  const [imageSizeWarning, setImageSizeWarning] = useState('')
  const [options, setOptions] = useState<QuestionOption[]>([
    { id: 'A', text: '', isCorrect: false },
    { id: 'B', text: '', isCorrect: false },
    { id: 'C', text: '', isCorrect: false },
    { id: 'D', text: '', isCorrect: false }
  ])

  const handleCopyToAnswer = () => { if (!content || !content.trim()) { alert("請先輸入題目！"); return; } if (answerType === "fill") { setAnswerContent("<p><strong style=color:#15803d>📝 答案:</strong>____</p>" + content); } else { setAnswerContent(content + "<p></p><p><strong style=color:#15803d>✅ 參考答案:</strong></p>"); } setTimeout(() => { document.getElementById("answer-section")?.scrollIntoView({behavior:"smooth"}); }, 100); };

  // 載入主題
  useEffect(() => {
    async function loadTopics() {
      const { data, error } = await supabase.from('topics').select('*').order('name')
      if (error) console.error('Error loading topics:', error)
      if (data) setTopics(data)
    }
    loadTopics()
  }, [])

  // 初始化表單數據
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
      setAnswerType((qContent?.answer_type as AnswerType) || 'text')
      setAnswerContent(qContent?.answer || '')
      setExplanationContent(qContent?.explanation || qContent?.remark || '')
      
      // 安全處理 options
      if (qContent?.options && Array.isArray(qContent.options)) {
        const safeOptions = qContent.options.map((opt: any) => ({
          id: String(opt.id || ''),
          text: String(opt.text || ''),
          isCorrect: Boolean(opt.isCorrect)
        }))
        setOptions(safeOptions)
      }
      
      // 設置顯示名稱
      setSubjectName(getSubjectName(question.subject_id || ''))
      const topic = topics.find(t => t.id === question.topic_id)
      setTopicName(topic?.name || '')
    }
  }, [question])

  // 注意：標籤只在保存時自動添加科目、難度、級別、主題，唔會實時更新

  function extractGradeFromTags(tags?: string[]): string {
    if (!tags) return 'P5'
    const gradeTag = tags.find(t => t.match(/^P[1-6]|S[1-6]$/i))
    return gradeTag || 'P5'
  }

  function getSubjectName(id: string): string {
    const subjects: Record<string, string> = {
      'd302b713-42c1-46ff-8844-1662f5cbf1fb': '數學',
      'b4186fda-a862-4a94-8472-07c381f3f378': '中文',
      '62291ec5-13fe-4299-bafa-0f9ec4b2481b': '英文',
      '114dcca3-2816-4f6f-99be-d82107179c99': '常識'
    }
    return subjects[id] || id
  }

  function getSubjectIdByName(name: string): string {
    return knownSubjects[name] || ''
  }

  // 驗證科目是否有效
  function isValidSubject(subjectName: string): boolean {
    return knownSubjects.hasOwnProperty(subjectName)
  }

  async function createTopicIfNotExists(topicName: string): Promise<string | null> {
    if (!topicName.trim()) return null
    
    // 檢查是否已存在
    const existingTopic = topics.find(t => t.name.toLowerCase() === topicName.toLowerCase())
    if (existingTopic) {
      return existingTopic.id
    }
    
    // 自動創建新主題
    try {
      const subjectIdToUse = subjectId || getSubjectIdByName(subjectName) || 'd302b713-42c1-46ff-8844-1662f5cbf1fb'
      const { data, error } = await supabase
        .from('topics')
        .insert([{ name: topicName.trim(), subject_id: subjectIdToUse }])
        .select()
      
      if (error) {
        console.error('Error creating topic:', error)
        return null
      }
      
      if (data && data.length > 0) {
        setTopics(prev => [...prev, data[0]])
        return data[0].id
      }
    } catch (err) {
      console.error('Failed to create topic:', err)
    }
    
    return null
  }

  function handleOptionChange(id: string, text: string) {
    setOptions(prev => prev.map(opt => opt.id === id ? { ...opt, text } : opt))
  }

  function handleOptionCorrect(id: string) {
    if (answerType === 'choice') {
      setOptions(prev => prev.map(opt => ({ ...opt, isCorrect: opt.id === id })))
    } else {
      setOptions(prev => prev.map(opt => opt.id === id ? { ...opt, isCorrect: !opt.isCorrect } : opt))
    }
  }

  function addOption() {
    const newId = String.fromCharCode(65 + options.length)
    setOptions(prev => [...prev, { id: newId, text: '', isCorrect: false }])
  }

  function removeOption(id: string) {
    if (options.length <= 2) {
      alert('至少需要 2 個選項')
      return
    }
    setOptions(prev => prev.filter(opt => opt.id !== id))
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
    
    const currentSubjectName = subjectName || getSubjectName(subjectId)
    const finalSubjectId = getSubjectIdByName(currentSubjectName)
    
    let finalTopicId = topicId
    if (topicName.trim()) {
      const createdTopicId = await createTopicIfNotExists(topicName)
      if (createdTopicId) finalTopicId = createdTopicId
    }
    
    const questionData: any = {
      title: content + ' (複製)',
      content: { text: content, type: 'custom', answer_type: answerType, answer: answerContent, explanation: explanationContent, options },
      question_type: answerType === 'choice' ? 'choice' : answerType === 'fill' ? 'fill' : 'answer',
      subject_id: finalSubjectId,
      topic_id: finalTopicId || null,
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
      if (data && data.length > 0 && onSaveComplete) onSaveComplete()
    }
  }

  // 驗證必填字段
  function validateMandatoryFields(): boolean {
    // 1. 檢查題目內容
    if (!content.trim()) {
      alert('❌ 請輸入題目內容')
      return false
    }
    
    // 2. 檢查科目（必須係已知科目）
    const currentSubjectName = subjectName || getSubjectName(subjectId)
    if (!currentSubjectName.trim()) {
      alert('❌ 請選擇或輸入科目（數學、中文、英文、常識）')
      return false
    }
    
    if (!isValidSubject(currentSubjectName)) {
      alert(`❌ 科目「${currentSubjectName}」唔係有效科目\n\n請使用以下科目：\n- 數學\n- 中文\n- 英文\n- 常識`)
      return false
    }
    
    // 3. 檢查級別
    if (!grade.trim()) {
      alert('❌ 請輸入級別（例如：P1, P5, S1）')
      return false
    }
    
    return true
  }

  async function handleSave() {
    // 1. 驗證必填字段
    if (!validateMandatoryFields()) {
      return
    }
    
    // 2. 確保科目 ID 有效（關鍵修復！）
    const currentSubjectName = subjectName || getSubjectName(subjectId)
    const finalSubjectId = getSubjectIdByName(currentSubjectName)
    
    if (!finalSubjectId) {
      alert(`❌ 儲存失敗：科目「${currentSubjectName}」無對應嘅 UUID\n\n請使用以下科目：\n- 數學\n- 中文\n- 英文\n- 常識`)
      return
    }
    
    // 3. 處理主題（自動創建）
    let finalTopicId = topicId
    if (topicName.trim()) {
      const createdTopicId = await createTopicIfNotExists(topicName)
      if (createdTopicId) {
        finalTopicId = createdTopicId
      }
    }
    
    // 4. 檢查內容長度
    const contentLength = content.length
    if (contentLength > 50000) {
      setImageSizeWarning(`⚠️ 內容過長（${contentLength} 字符），建議壓縮圖片或減少圖片數量`)
      if (!window.confirm('內容過長可能導致保存失敗，確定要繼續嗎？')) return
    }
    
    // 5. 開始儲存
    setSaving(true)
    
    // 自動添加科目、難度、級別、主題到標籤
    const difficultyName = difficulty === 'easy' ? '淺' : difficulty === 'medium' ? '中' : '深'
    const autoTags = [currentSubjectName, difficultyName, grade, topicName].filter(Boolean)
    
    // 現有手動標籤（移除自動標籤類型）
    const autoTagTypes = [
      '數學', '中文', '英文', '常識',
      '淺', '中', '深',
      'P1', 'P2', 'P3', 'P4', 'P5', 'P6', 'S1', 'S2', 'S3', 'S4', 'S5', 'S6'
    ]
    const manualTags = tags.split(',').map(t => t.trim()).filter(Boolean).filter(tag => !autoTagTypes.includes(tag))
    
    // 合併並去重
    const finalTags = Array.from(new Set([...autoTags, ...manualTags]))
    
    const questionData: any = {
      title: content,
      content: { 
        text: content, 
        type: 'custom', 
        answer_type: answerType, 
        answer: answerContent, 
        explanation: explanationContent, 
        options: options.map(opt => ({
          id: String(opt.id),
          text: String(opt.text || ''),
          isCorrect: Boolean(opt.isCorrect)
        }))
      },
      question_type: answerType === 'choice' ? 'choice' : answerType === 'fill' ? 'fill' : 'answer',
      subject_id: finalSubjectId,  // 確保使用有效 UUID
      topic_id: finalTopicId || null,
      difficulty,
      score: 2,
      tags: finalTags,
      status,
      updated_at: new Date().toISOString()
    }
    
    let result
    if (question?.id) {
      result = await supabase.from('questions').update(questionData).eq('id', question.id)
    } else {
      result = await supabase.from('questions').insert([questionData])
    }
    
    setSaving(false)
    setImageSizeWarning('')
    
    if (result.error) {
      console.error('Save error:', result.error)
      
      // 詳細錯誤處理
      if (result.error.message.includes('value too long')) {
        alert('儲存失敗：內容過長，請壓縮圖片或減少圖片數量')
      } else if (result.error.message.includes('foreign key')) {
        alert('儲存失敗：外鍵約束錯誤\n\n請確保：\n1. 使用正確嘅科目（數學、中文、英文、常識）\n2. 主題已正確創建')
      } else if (result.error.message.includes('uuid')) {
        alert('儲存失敗：科目 ID 格式錯誤，請使用正確嘅科目名稱（數學、中文、英文、常識）')
      } else {
        alert('儲存失敗：' + result.error.message)
      }
    } else {
      alert('✅ 題目已儲存！')
      if (onSaveComplete) {
        try {
          onSaveComplete()
        } catch (err) {
          console.error('onSaveComplete error:', err)
          window.location.reload()
        }
      } else {
        window.location.reload()
      }
    }
  }

  function getShortId(id?: string): string {
    if (!id) return '新題目'
    return `#${id.substring(0, 8)}`
  }

  function compressImage(base64: string, maxWidth = 1920, maxHeight = 1920, quality = 0.8): Promise<string> {
    return new Promise((resolve, reject) => {
      const img = new Image()
      img.onload = () => {
        const canvas = document.createElement('canvas')
        let width = img.width
        let height = img.height
        
        // 按比例縮放
        if (width > maxWidth || height > maxHeight) {
          const ratio = Math.min(maxWidth / width, maxHeight / height)
          width = Math.floor(width * ratio)
          height = Math.floor(height * ratio)
        }
        
        canvas.width = width
        canvas.height = height
        const ctx = canvas.getContext('2d')
        if (!ctx) { reject(new Error('無法創建 canvas')); return; }
        ctx.drawImage(img, 0, 0, width, height)
        
        // 壓縮並轉為 base64
        const compressed = canvas.toDataURL('image/jpeg', quality)
        resolve(compressed)
      }
      img.onerror = reject
      img.src = base64
    })
  }

  async function uploadImageToBase64(file: File): Promise<string> {
    return new Promise(async (resolve, reject) => {
      const reader = new FileReader()
      reader.onload = async () => {
        try {
          let base64 = reader.result as string
          const originalSize = Math.round(base64.length / 1024 * 0.75)
          
          // 如果超過 500KB，自動壓縮
          if (originalSize > 500) {
            setImageSizeWarning(`⚠️ 圖片過大（${originalSize}KB），正在自動壓縮...`)
            base64 = await compressImage(base64, 1920, 1920, 0.75)
            const compressedSize = Math.round(base64.length / 1024 * 0.75)
            setImageSizeWarning(`✅ 已壓縮：${originalSize}KB → ${compressedSize}KB`)
            setTimeout(() => setImageSizeWarning(''), 3000)
          } else {
            setImageSizeWarning('')
          }
          
          resolve(base64)
        } catch (err) {
          setImageSizeWarning(`❌ 壓縮失敗：${err}`)
          reject(err)
        }
      }
      reader.onerror = reject
      reader.readAsDataURL(file)
    })
  }

  const editorConfig = {
    toolbar: ['bold', 'italic', 'link', 'bulletedList', 'numberedList', 'imageUpload', 'blockQuote', 'insertTable', 'undo', 'redo'],
    language: 'zh',
    placeholder: '在此輸入題目內容...'
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

      {/* 題目屬性 - 第一行 5 欄 */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-3 mb-6">
        <div className="bg-white p-2 rounded-lg shadow-sm border">
          <label className="block text-xs font-medium text-gray-700 mb-1">🎓 級別</label>
          <select value={grade} onChange={(e) => setGrade(e.target.value)} className="w-full px-2 py-1.5 border rounded-lg focus:ring-2 focus:ring-blue-500 text-sm">
            <option value="P1">P1</option><option value="P2">P2</option><option value="P3">P3</option><option value="P4">P4</option><option value="P5">P5</option><option value="P6">P6</option><option value="S1">S1</option><option value="S2">S2</option><option value="S3">S3</option><option value="S4">S4</option><option value="S5">S5</option><option value="S6">S6</option>
          </select>
        </div>
        <div className="bg-white p-2 rounded-lg shadow-sm border">
          <label className="block text-xs font-medium text-gray-700 mb-1">📚 科目</label>
          <select value={subjectName || getSubjectName(subjectId)} onChange={(e) => { setSubjectName(e.target.value); const id = getSubjectIdByName(e.target.value); if(id) setSubjectId(id) }} className="w-full px-2 py-1.5 border rounded-lg focus:ring-2 focus:ring-blue-500 text-sm">
            <option value="">請選擇科目</option>
            <option value="數學">數學</option>
            <option value="中文">中文</option>
            <option value="英文">英文</option>
            <option value="常識">常識</option>
          </select>
        </div>
        <div className="bg-white p-2 rounded-lg shadow-sm border">
          <label className="block text-xs font-medium text-gray-700 mb-1">📖 主題</label>
          <input type="text" value={topicName} onChange={(e) => setTopicName(e.target.value)} placeholder="主題" className="w-full px-2 py-1.5 border rounded-lg focus:ring-2 focus:ring-blue-500 text-sm" list="topic-suggestions" />
          <datalist id="topic-suggestions">{topics.map(t => <option key={t.id} value={t.name} />)}</datalist>
        </div>
        <div className="bg-white p-2 rounded-lg shadow-sm border">
          <label className="block text-xs font-medium text-gray-700 mb-1">⚡ 難度</label>
          <select value={difficulty} onChange={(e) => setDifficulty(e.target.value)} className="w-full px-2 py-1.5 border rounded-lg focus:ring-2 focus:ring-blue-500 text-sm">
            <option value="easy">淺</option><option value="medium">中</option><option value="hard">深</option>
          </select>
        </div>
        <div className="bg-white p-2 rounded-lg shadow-sm border">
          <label className="block text-xs font-medium text-gray-700 mb-1">📌 狀態</label>
          <select value={status} onChange={(e) => setStatus(e.target.value as any)} className="w-full px-2 py-1.5 border rounded-lg focus:ring-2 focus:ring-blue-500 text-sm">
            <option value="active">✅ Active</option><option value="pending">⏳ Pending</option><option value="pending_review">📝 Review</option><option value="draft">📄 Draft</option><option value="inactive">❌ Inactive</option>
          </select>
        </div>
      </div>

      <div className="bg-white p-4 rounded-lg shadow-sm border mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-2">📝 題目內容（必填）</label>
        {/* @ts-ignore */}
        <CKEditor editor={ClassicEditor as any} data={content} onReady={(editor: any) => { editor.plugins.get('FileRepository').createUploadAdapter = (loader: any) => ({ upload: () => loader.file.then((file: File) => uploadImageToBase64(file).then((base64) => ({ default: base64 }))) }) }} onChange={(event, editor) => { const data = editor.getData(); setContent(data); const length = data.length; if (length > 600000) setImageSizeWarning(`⚠️ 內容較長（${length} 字符），建議壓縮圖片`); else setImageSizeWarning('') }} config={editorConfig} />
        <div className="flex justify-between items-center mt-2">
          <p className="text-xs text-gray-500">💡 圖片會自動轉換為 Base64 格式保存</p>
          <p className="text-xs text-gray-500">當前長度：{content.length} 字符</p>
        </div>
        {imageSizeWarning && <div className="mt-2 p-3 bg-yellow-50 border border-yellow-200 rounded-lg"><p className="text-sm text-yellow-800">{imageSizeWarning}</p></div>}
      </div>

      <div className="bg-white p-4 rounded-lg shadow-sm border mb-6">
          <div className="flex items-center justify-between gap-3">
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-700 mb-2">📌 答案類型</label>
        <select value={answerType} onChange={(e) => setAnswerType(e.target.value as AnswerType)} className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500">
          <option value="text">✍️ 問答題（自由文字作答）</option>
          <option value="choice">🔘 選擇題（單項選擇）</option>
          <option value="multiple_choice">☑️ 多選題（多項選擇）</option>
          <option value="fill">✏️ 填充題（填充空格）</option>
          <option value="matching">🔗 配對題（配對左右欄）</option>
          <option value="ordering">📊 排序題（排列順序）</option>
        </select>
        <p className="text-xs text-gray-500 mt-2">💡 唔可以添加新類型，請從以上選項中選擇</p>
            </div>
            <div className="pb-2">
              <button type="button" onClick={handleCopyToAnswer} className="px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded text-xs font-medium transition flex items-center gap-1.5" title="將題目複製到答案編輯器">
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"/>
                </svg>
                複製題目到答案區
              </button>
            </div>
          </div>
      </div>

      {(answerType === 'choice' || answerType === 'multiple_choice') && (
        <div className="bg-white p-4 rounded-lg shadow-sm border mb-6">
          <div className="flex justify-between items-center mb-4">
            <label className="block text-sm font-medium text-gray-700">
              {answerType === 'choice' ? '🔘 選擇題選項（單選）' : '☑️ 多選題選項（多選）'}
            </label>
            <button onClick={addOption} className="px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700 text-sm">➕ 添加選項</button>
          </div>
          <div className="space-y-3">
            {options.map((opt, idx) => (
              <div key={String(opt.id)} className="flex items-center gap-3">
                <div className="flex items-center gap-2 w-32">
                  <input
                    type={answerType === 'choice' ? 'radio' : 'checkbox'}
                    name="correctAnswer"
                    checked={Boolean(opt.isCorrect)}
                    onChange={() => handleOptionCorrect(String(opt.id))}
                    className="w-4 h-4 text-green-600"
                    title="設為正確答案"
                  />
                  <span className="px-2 py-1 bg-gray-100 text-gray-700 text-sm rounded font-medium w-8 text-center">{String(opt.id)}</span>
                </div>
                <input
                  type="text"
                  value={String(opt.text || '')}
                  onChange={(e) => handleOptionChange(String(opt.id), e.target.value)}
                  placeholder={`選項 ${opt.id} 內容`}
                  className="flex-1 px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                />
                {options.length > 2 && (
                  <button onClick={() => removeOption(String(opt.id))} className="px-2 py-1 text-red-600 hover:bg-red-50 rounded" title="移除選項">🗑️</button>
                )}
              </div>
            ))}
          </div>
          <p className="text-xs text-gray-500 mt-3">
            💡 {answerType === 'choice' ? '選擇題：只能有一個正確答案（綠色）' : '多選題：可以有多個正確答案（可多選）'}
          </p>
        </div>
      )}

      <div className="bg-white p-4 rounded-lg shadow-sm border mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-2">✅ 答案{answerType !== 'text' && <span className="ml-2 text-xs text-gray-500">({answerType === 'choice' ? '正確選項' : answerType === 'fill' ? '正確答案' : '參考答案'})</span>}</label>
        {/* @ts-ignore */}
        <CKEditor editor={ClassicEditor as any} data={answerContent} onChange={(event, editor) => { const data = editor.getData(); setAnswerContent(data) }} config={{ toolbar: ['bold', 'italic', 'bulletedList', 'numberedList', '|', 'undo', 'redo'], language: 'zh' }} />
      </div>

      <div className="bg-white p-4 rounded-lg shadow-sm border mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-2">🏷️ 標籤（用逗號分隔）</label>
        <input type="text" value={tags} onChange={(e) => setTags(e.target.value)} placeholder="系統會自動添加科目、難度、級別、主題" className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500" />
        <p className="text-xs text-gray-500 mt-2">💡 自動標籤：{subjectName || getSubjectName(subjectId)}, {difficulty === 'easy' ? '淺' : difficulty === 'medium' ? '中' : '深'}, {grade}, {topicName}</p>
      </div>



      <div className="mt-6 flex justify-end gap-2">
        <button onClick={() => setShowPreview(true)} className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700">👁️ 預覽</button>
        {onCancel && <button onClick={onCancel} className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700">返回</button>}
        <button onClick={handleSave} disabled={saving} className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 font-medium">{saving ? '儲存中...' : '💾 儲存'}</button>
      </div>

      <div className="mt-8 pt-6 border-t border-gray-200">
        <div className="flex justify-between items-center text-xs text-gray-500">
          <div><span>版本：1.9.0</span><span className="mx-2">|</span><span>最後更新：{new Date().toLocaleString('zh-HK', { timeZone: 'Asia/Hong_Kong' })}</span></div>
          <div className="flex gap-4"><span>🇭🇰 HKT (UTC+8)</span><span>AI 教學平台</span></div>
        </div>
      </div>
    </div>
  )
}
