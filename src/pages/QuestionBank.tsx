import React, { useEffect, useState } from 'react'
import { supabase } from '../services/supabase'
import { Question } from '../types/index'

interface QuestionBankProps {
  onEditQuestion?: (question: Question) => void
}

export function QuestionBank({ onEditQuestion }: QuestionBankProps) {
  const [questions, setQuestions] = useState<Question[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterSubject, setFilterSubject] = useState<string>('all')
  const [filterGrade, setFilterGrade] = useState<string>('all')
  const [selectedStatuses, setSelectedStatuses] = useState<string[]>(['active', 'pending', 'pending_review', 'draft']) // 預設多選
  const [showInactive, setShowInactive] = useState(false) // 控制是否顯示 Inactive

  useEffect(() => {
    loadQuestions()
  }, [])

  async function loadQuestions() {
    const { data, error } = await supabase
      .from('questions')
      .select('*')
      .order('created_at', { ascending: false })
    
    if (error) console.error('Error loading questions:', error)
    if (data) setQuestions(data)
    setLoading(false)
  }

  function handleCopyQuestion(question: Question) {
    if (onEditQuestion) {
      onEditQuestion(question)
    }
  }

  function toggleStatus(status: string) {
    setSelectedStatuses(prev => {
      if (prev.includes(status)) {
        // 如果已經揀咗，就移除（至少保留一個）
        if (prev.length > 1) {
          return prev.filter(s => s !== status)
        }
        return prev // 如果係最後一個，唔移除
      } else {
        // 如果無揀，就添加
        return [...prev, status]
      }
    })
  }

  function selectAllStatuses() {
    setSelectedStatuses(['active', 'pending', 'pending_review', 'draft', 'inactive'])
  }

  function clearStatusSelection() {
    setSelectedStatuses(['active', 'pending', 'pending_review', 'draft']) // 恢復預設
  }

  function getSubjectName(subjectId?: string): string {
    if (!subjectId) return '綜合'
    const subjects: Record<string, string> = {
      'd302b713-42c1-46ff-8844-1662f5cbf1fb': '數學',
      'b4186fda-a862-4a94-8472-07c381f3f378': '中文',
      '62291ec5-13fe-4299-bafa-0f9ec4b2481b': '英文'
    }
    return subjects[subjectId] || '綜合'
  }

  function extractGradeFromTags(tags?: string[]): string {
    if (!tags) return 'P5'
    const gradeTag = tags.find(t => t.match(/^P[1-6]|S[1-6]$/i))
    return gradeTag || 'P5'
  }

  // 篩選和搜尋
  const filteredQuestions = questions.filter(q => {
    const content = q.content as any
    const text = (q.title || '') + ' ' + (content?.text || '') + ' ' + (q.tags?.join(' ') || '') + ' ' + (q.id || '')
    
    // 搜尋
    const matchesSearch = searchTerm === '' || text.toLowerCase().includes(searchTerm.toLowerCase())
    
    // 科目篩選
    const matchesSubject = filterSubject === 'all' || q.subject_id === filterSubject
    
    // 年級篩選
    const grade = extractGradeFromTags(q.tags)
    const matchesGrade = filterGrade === 'all' || grade === filterGrade
    
    // 狀態篩選（多選）
    const matchesStatus = selectedStatuses.length === 0 || selectedStatuses.includes(q.status || 'draft')
    
    return matchesSearch && matchesSubject && matchesGrade && matchesStatus
  })

  if (loading) return <div className="p-4 text-center">載入中...</div>

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* 頂部標題 */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">📋 所有題目</h2>
          <p className="text-sm text-gray-600 mt-1">
            總共 {questions.length} 條題目 · 顯示 {filteredQuestions.length} 條
          </p>
        </div>
        <button
          onClick={() => loadQuestions()}
          className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700"
        >
          🔄 刷新
        </button>
      </div>

      {/* 搜尋和篩選器 */}
      <div className="bg-white p-4 rounded-lg shadow-sm border mb-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {/* 搜尋框 */}
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-2">🔍 搜尋</label>
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="搜尋題目內容、標籤、ID..."
              className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* 科目篩選 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">📚 科目</label>
            <select
              value={filterSubject}
              onChange={(e) => setFilterSubject(e.target.value)}
              className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">全部科目</option>
              <option value="d302b713-42c1-46ff-8844-1662f5cbf1fb">數學</option>
              <option value="b4186fda-a862-4a94-8472-07c381f3f378">中文</option>
              <option value="62291ec5-13fe-4299-bafa-0f9ec4b2481b">英文</option>
            </select>
          </div>

          {/* 年級篩選 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">🎓 年級</label>
            <select
              value={filterGrade}
              onChange={(e) => setFilterGrade(e.target.value)}
              className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">全部年級</option>
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
        </div>

        {/* 狀態篩選（多選） */}
        <div className="mt-4 pt-4 border-t">
          <div className="flex items-center justify-between mb-3">
            <label className="text-sm font-medium text-gray-700">📌 題目狀態（多選）</label>
            <div className="flex gap-4">
              <button
                onClick={selectAllStatuses}
                className="text-xs text-blue-600 hover:text-blue-800"
              >
                全選
              </button>
              <button
                onClick={clearStatusSelection}
                className="text-xs text-blue-600 hover:text-blue-800"
              >
                重置
              </button>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={showInactive}
                  onChange={(e) => setShowInactive(e.target.checked)}
                  className="w-4 h-4 text-blue-600 rounded"
                />
                <span className="text-sm text-gray-600">顯示 Inactive</span>
              </label>
            </div>
          </div>
          <div className="flex flex-wrap gap-3">
            {/* Active */}
            <label className={`flex items-center gap-2 cursor-pointer px-3 py-2 rounded-lg border transition-colors ${
              selectedStatuses.includes('active') ? 'bg-green-50 border-green-500' : 'bg-white border-gray-300 hover:bg-gray-50'
            }`}>
              <input
                type="checkbox"
                checked={selectedStatuses.includes('active')}
                onChange={() => toggleStatus('active')}
                className="w-4 h-4 text-green-600 rounded"
              />
              <span className="text-sm">✅ Active</span>
              <span className="text-xs text-gray-500">
                ({questions.filter(q => q.status === 'active').length})
              </span>
            </label>

            {/* Pending */}
            <label className={`flex items-center gap-2 cursor-pointer px-3 py-2 rounded-lg border transition-colors ${
              selectedStatuses.includes('pending') || selectedStatuses.includes('pending_review') ? 'bg-yellow-50 border-yellow-500' : 'bg-white border-gray-300 hover:bg-gray-50'
            }`}>
              <input
                type="checkbox"
                checked={selectedStatuses.includes('pending') || selectedStatuses.includes('pending_review')}
                onChange={() => {
                  if (selectedStatuses.includes('pending') || selectedStatuses.includes('pending_review')) {
                    setSelectedStatuses(prev => prev.filter(s => s !== 'pending' && s !== 'pending_review'))
                  } else {
                    setSelectedStatuses(prev => [...prev, 'pending', 'pending_review'])
                  }
                }}
                className="w-4 h-4 text-yellow-600 rounded"
              />
              <span className="text-sm">⏳ Pending</span>
              <span className="text-xs text-gray-500">
                ({questions.filter(q => q.status === 'pending' || q.status === 'pending_review').length})
              </span>
            </label>

            {/* Draft */}
            <label className={`flex items-center gap-2 cursor-pointer px-3 py-2 rounded-lg border transition-colors ${
              selectedStatuses.includes('draft') ? 'bg-blue-50 border-blue-500' : 'bg-white border-gray-300 hover:bg-gray-50'
            }`}>
              <input
                type="checkbox"
                checked={selectedStatuses.includes('draft')}
                onChange={() => toggleStatus('draft')}
                className="w-4 h-4 text-blue-600 rounded"
              />
              <span className="text-sm">📝 Draft</span>
              <span className="text-xs text-gray-500">
                ({questions.filter(q => q.status === 'draft').length})
              </span>
            </label>

            {/* Inactive */}
            <label className={`flex items-center gap-2 cursor-pointer px-3 py-2 rounded-lg border transition-colors ${
              !showInactive ? 'opacity-50 cursor-not-allowed' : selectedStatuses.includes('inactive') ? 'bg-gray-50 border-gray-500' : 'bg-white border-gray-300 hover:bg-gray-50'
            }`}>
              <input
                type="checkbox"
                checked={selectedStatuses.includes('inactive')}
                onChange={() => toggleStatus('inactive')}
                disabled={!showInactive}
                className="w-4 h-4 text-gray-600 rounded"
              />
              <span className="text-sm">❌ Inactive</span>
              <span className="text-xs text-gray-500">
                ({questions.filter(q => q.status === 'inactive').length})
              </span>
            </label>
          </div>
          <div className="mt-2 flex items-center gap-2">
            <span className="text-xs text-gray-600">
              已選：{selectedStatuses.length} 個狀態
            </span>
            {selectedStatuses.length > 0 && (
              <span className="text-xs text-gray-500">
                ({selectedStatuses.join(', ')})
              </span>
            )}
          </div>
          {!showInactive && (
            <p className="text-xs text-gray-500 mt-2">
              💡 勾選「顯示 Inactive」以顯示 Inactive 題目
            </p>
          )}
        </div>

        {/* 清除篩選 */}
        {(searchTerm || filterSubject !== 'all' || filterGrade !== 'all' || selectedStatuses.length !== 4 || showInactive) && (
          <div className="mt-4 flex items-center gap-2">
            <button
              onClick={() => {
                setSearchTerm('')
                setFilterSubject('all')
                setFilterGrade('all')
                setSelectedStatuses(['active', 'pending', 'pending_review', 'draft'])
                setShowInactive(false)
              }}
              className="text-sm text-blue-600 hover:text-blue-800"
            >
              ✖️ 清除所有篩選
            </button>
          </div>
        )}
      </div>

      {/* 題目列表 */}
      <div className="space-y-4">
        {filteredQuestions.map((q, index) => {
          const content = q.content as any
          const subjectName = getSubjectName(q.subject_id)
          const grade = extractGradeFromTags(q.tags)

          return (
            <div key={q.id} className="border rounded-lg p-4 bg-white shadow-sm">
              <div className="flex justify-between items-start mb-3">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded font-medium">
                    #{index + 1}
                  </span>
                  <span className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded font-mono">
                    ID: {q.id?.substring(0, 8)}...
                  </span>
                  <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded">{subjectName}</span>
                  <span className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded">{grade}</span>
                  <span className="px-2 py-1 bg-yellow-100 text-yellow-800 text-xs rounded">{q.difficulty}</span>
                  <span className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded">{q.score}分</span>
                  {q.status && (
                    <span className={`px-2 py-1 text-xs rounded font-medium ${
                      q.status === 'active' ? 'bg-green-100 text-green-800' :
                      q.status === 'pending' || q.status === 'pending_review' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-gray-100 text-gray-800'
                    }`}>
                      {q.status === 'active' ? '✅ Active' :
                       q.status === 'pending' || q.status === 'pending_review' ? '⏳ Pending' : '❌ Inactive'}
                    </span>
                  )}
                </div>
                <div className="flex gap-2">
                  <button 
                    className="px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700 text-sm"
                    onClick={() => handleCopyQuestion(q)}
                  >
                    📋 複製
                  </button>
                  {onEditQuestion && (
                    <button 
                      className="px-3 py-1 bg-gray-600 text-white rounded hover:bg-gray-700 text-sm"
                      onClick={() => onEditQuestion(q)}
                    >
                      ✏️ 編輯
                    </button>
                  )}
                </div>
              </div>
              <p className="text-base mb-3" dangerouslySetInnerHTML={{ __html: q.title || '' }}></p>
              {content.image_base64 && (
                <div className="mb-3">
                  <img src={content.image_base64} alt="題目圖片" className="max-w-md border rounded" />
                </div>
              )}
              {content.options && content.options.length > 0 && (
                <div className="ml-4 space-y-1 mb-3">
                  {content.options.map((opt: string, i: number) => (
                    <div key={i} className="text-gray-600 text-sm">{opt}</div>
                  ))}
                </div>
              )}
              <div className="flex flex-wrap gap-1 mt-3 pt-3 border-t">
                {q.tags?.map((tag: string, i: number) => (
                  <span key={i} className="px-2 py-0.5 bg-gray-100 text-gray-600 text-xs rounded">{tag}</span>
                ))}
              </div>
            </div>
          )
        })}
      </div>

      {filteredQuestions.length === 0 && (
        <div className="text-center py-12">
          <p className="text-gray-500 text-lg">
            {searchTerm || filterSubject !== 'all' || filterGrade !== 'all' || selectedStatuses.length !== 4
              ? '無符合搜尋條件嘅題目' 
              : '暫無題目'}
          </p>
          <p className="text-gray-400 text-sm mt-2">
            {searchTerm || filterSubject !== 'all' || filterGrade !== 'all' || selectedStatuses.length !== 4
              ? '請嘗試其他搜尋關鍵字或清除篩選'
              : '請先上傳試卷或建立新題目'}
          </p>
          {!showInactive && (
            <button
              onClick={() => setShowInactive(true)}
              className="mt-4 px-4 py-2 text-sm text-blue-600 hover:text-blue-800 underline"
            >
              顯示 Inactive 題目
            </button>
          )}
        </div>
      )}

      {/* Footer */}
      <div className="mt-8 pt-6 border-t border-gray-200">
        <div className="flex justify-between items-center text-xs text-gray-500">
          <div>
            <span>版本：1.6.0</span>
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
