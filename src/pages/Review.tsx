import React, { useEffect, useState } from 'react'
import { supabase } from '../services/supabase'
import { Question } from '../types/index'

interface ReviewProps {
  onEditQuestion?: (question: Question) => void
}

export function Review({ onEditQuestion }: ReviewProps) {
  const [questions, setQuestions] = useState<Question[]>([])
  const [loading, setLoading] = useState(true)
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [filterStatus, setFilterStatus] = useState<string>('pending_review')
  const [searchTerm, setSearchTerm] = useState('')

  useEffect(() => {
    loadQuestions()
  }, [])

  async function loadQuestions() {
    let query = supabase
      .from('questions')
      .select('*')
      .order('created_at', { ascending: false })

    if (filterStatus !== 'all') {
      query = query.eq('status', filterStatus)
    }

    const { data, error } = await query
    
    if (error) console.error('Error loading questions:', error)
    if (data) setQuestions(data)
    setLoading(false)
  }

  async function handleApprove(id: string) {
    const { error } = await supabase
      .from('questions')
      .update({ status: 'active', updated_at: new Date().toISOString() })
      .eq('id', id)
    
    if (error) {
      alert('更新失敗：' + error.message)
    } else {
      alert('✅ 已通過！')
      loadQuestions()
    }
  }

  async function handleReject(id: string) {
    const { error } = await supabase
      .from('questions')
      .update({ status: 'inactive', updated_at: new Date().toISOString() })
      .eq('id', id)
    
    if (error) {
      alert('更新失敗：' + error.message)
    } else {
      alert('❌ 已拒絕！')
      loadQuestions()
    }
  }

  async function handleBulkApprove() {
    const pendingQuestions = questions.filter(q => q.status === 'pending_review' || q.status === 'pending')
    if (pendingQuestions.length === 0) {
      alert('無待審核題目')
      return
    }

    if (!window.confirm(`確定要批量通過 ${pendingQuestions.length} 條題目？`)) {
      return
    }

    const ids = pendingQuestions.map(q => q.id!)
    const { error } = await supabase
      .from('questions')
      .update({ status: 'active', updated_at: new Date().toISOString() })
      .in('id', ids)

    if (error) {
      alert('批量更新失敗：' + error.message)
    } else {
      alert(`✅ 已成功通過 ${pendingQuestions.length} 條題目！`)
      loadQuestions()
    }
  }

  function getStatusBadge(status: string) {
    switch (status) {
      case 'active':
        return <span className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full">✅ Active</span>
      case 'pending_review':
      case 'pending':
        return <span className="px-2 py-1 bg-yellow-100 text-yellow-800 text-xs rounded-full">⏳ Pending</span>
      case 'inactive':
        return <span className="px-2 py-1 bg-gray-100 text-gray-800 text-xs rounded-full">❌ Inactive</span>
      case 'draft':
        return <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">📝 Draft</span>
      default:
        return <span className="px-2 py-1 bg-gray-100 text-gray-800 text-xs rounded-full">{status}</span>
    }
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

  function getDifficultyName(difficulty: string): string {
    switch (difficulty) {
      case 'easy': return '淺'
      case 'medium': return '中'
      case 'hard': return '深'
      default: return difficulty
    }
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
    
    // 狀態篩選
    let matchesStatus = true
    if (filterStatus === 'pending') {
      matchesStatus = q.status === 'pending_review' || q.status === 'pending'
    } else if (filterStatus !== 'all') {
      matchesStatus = q.status === filterStatus
    }
    
    return matchesSearch && matchesStatus
  })

  if (loading) return <div className="p-4 text-center">載入中...</div>

  const pendingCount = filteredQuestions.filter(q => q.status === 'pending_review' || q.status === 'pending').length

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* 頂部標題和統計 */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">✅ 審核題目</h2>
          <p className="text-sm text-gray-600 mt-1">
            總共 {questions.length} 條題目 · {pendingCount} 條待審核
          </p>
        </div>
        <div className="flex gap-2">
          {pendingCount > 0 && (
            <button
              onClick={handleBulkApprove}
              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 font-medium"
            >
              ✅ 批量通過 ({pendingCount})
            </button>
          )}
          <button
            onClick={() => loadQuestions()}
            className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700"
          >
            🔄 刷新
          </button>
        </div>
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

          {/* 狀態篩選 */}
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-2">📌 狀態篩選</label>
            <div className="flex gap-4">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="filterStatus"
                  checked={filterStatus === 'all'}
                  onChange={() => setFilterStatus('all')}
                  className="w-4 h-4 text-blue-600"
                />
                <span>全部 ({questions.length})</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="filterStatus"
                  checked={filterStatus === 'pending_review' || filterStatus === 'pending'}
                  onChange={() => setFilterStatus('pending')}
                  className="w-4 h-4 text-yellow-600"
                />
                <span>⏳ 待審核 ({pendingCount})</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="filterStatus"
                  checked={filterStatus === 'active'}
                  onChange={() => setFilterStatus('active')}
                  className="w-4 h-4 text-green-600"
                />
                <span>✅ 已通過</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="filterStatus"
                  checked={filterStatus === 'inactive'}
                  onChange={() => setFilterStatus('inactive')}
                  className="w-4 h-4 text-gray-600"
                />
                <span>❌ 已拒絕</span>
              </label>
            </div>
          </div>
        </div>

        {/* 清除篩選 */}
        {(searchTerm || filterStatus !== 'all') && (
          <div className="mt-4 flex items-center gap-2">
            <button
              onClick={() => {
                setSearchTerm('')
                setFilterStatus('all')
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
          const qContent = q.content as any
          const isExpanded = expandedId === q.id
          const subjectName = getSubjectName(q.subject_id)
          const grade = extractGradeFromTags(q.tags)
          const difficultyName = getDifficultyName(q.difficulty)

          return (
            <div key={q.id} className="bg-white rounded-lg shadow-sm border overflow-hidden">
              {/* 題目頭部（常駐顯示） */}
              <div className="p-4 border-b bg-gray-50">
                <div className="flex justify-between items-start mb-3">
                  <div className="flex items-center gap-3 flex-wrap">
                    <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded font-medium">
                      #{index + 1}
                    </span>
                    {getStatusBadge(q.status || 'draft')}
                    <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded">{subjectName}</span>
                    <span className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded">{grade}</span>
                    <span className="px-2 py-1 bg-yellow-100 text-yellow-800 text-xs rounded">{difficultyName}</span>
                    <span className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded">{q.score}分</span>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setExpandedId(isExpanded ? null : (q.id || null))}
                      className="px-3 py-1 bg-gray-600 text-white rounded hover:bg-gray-700 text-sm"
                    >
                      {isExpanded ? '👁️ 收起' : '👁️ 預覽'}
                    </button>
                    {onEditQuestion && (
                      <button
                        onClick={() => onEditQuestion(q)}
                        className="px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700 text-sm"
                      >
                        ✏️ 編輯
                      </button>
                    )}
                    {q.status === 'pending_review' || q.status === 'pending' ? (
                      <>
                        <button
                          onClick={() => handleApprove(q.id!)}
                          className="px-3 py-1 bg-green-600 text-white rounded hover:bg-green-700 text-sm"
                        >
                          ✅ 通過
                        </button>
                        <button
                          onClick={() => handleReject(q.id!)}
                          className="px-3 py-1 bg-red-600 text-white rounded hover:bg-red-700 text-sm"
                        >
                          ❌ 拒絕
                        </button>
                      </>
                    ) : null}
                  </div>
                </div>

                {/* 題目預覽（截斷顯示） */}
                <div className="text-sm text-gray-700 line-clamp-2">
                  <div dangerouslySetInnerHTML={{ __html: qContent?.text || q.title || '無內容' }} />
                </div>

                {/* 標籤 */}
                {q.tags && q.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-2">
                    {q.tags.slice(0, 5).map((tag: string, i: number) => (
                      <span key={i} className="px-2 py-0.5 bg-gray-100 text-gray-600 text-xs rounded">
                        {tag}
                      </span>
                    ))}
                    {q.tags.length > 5 && (
                      <span className="px-2 py-0.5 bg-gray-100 text-gray-600 text-xs rounded">
                        +{q.tags.length - 5}
                      </span>
                    )}
                  </div>
                )}
              </div>

              {/* 展開預覽（學生視角） */}
              {isExpanded && (
                <div className="p-6 bg-white">
                  <div className="border-2 border-blue-200 rounded-lg p-6 bg-blue-50">
                    <div className="flex items-center gap-2 mb-4 text-blue-800">
                      <span className="text-lg font-semibold">👁️ 學生視角預覽</span>
                      <span className="text-xs text-blue-600">（實際顯示效果）</span>
                    </div>

                    {/* 題目信息 */}
                    <div className="flex gap-2 mb-4">
                      <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded">{subjectName}</span>
                      <span className="px-2 py-1 bg-gray-100 text-gray-800 text-xs rounded">{grade}</span>
                      <span className="px-2 py-1 bg-yellow-100 text-yellow-800 text-xs rounded">{difficultyName}</span>
                    </div>

                    {/* 題目內容 */}
                    <div className="prose max-w-none mb-6 bg-white p-4 rounded-lg border">
                      <div dangerouslySetInnerHTML={{ __html: qContent?.text || q.title || '' }} />
                    </div>

                    {/* 答案輸入區域（根據類型） */}
                    <div className="border-t pt-4 mt-4">
                      <h3 className="text-lg font-semibold text-gray-700 mb-3">📝 你的答案</h3>
                      
                      {qContent?.answer_type === 'choice' && (
                        <div className="space-y-2 max-w-md">
                          <div className="flex items-center gap-2 p-3 border rounded hover:bg-gray-50 cursor-pointer">
                            <input type="radio" name={`preview_${q.id}`} className="w-4 h-4" />
                            <span>選項 A</span>
                          </div>
                          <div className="flex items-center gap-2 p-3 border rounded hover:bg-gray-50 cursor-pointer">
                            <input type="radio" name={`preview_${q.id}`} className="w-4 h-4" />
                            <span>選項 B</span>
                          </div>
                          <div className="flex items-center gap-2 p-3 border rounded hover:bg-gray-50 cursor-pointer">
                            <input type="radio" name={`preview_${q.id}`} className="w-4 h-4" />
                            <span>選項 C</span>
                          </div>
                          <div className="flex items-center gap-2 p-3 border rounded hover:bg-gray-50 cursor-pointer">
                            <input type="radio" name={`preview_${q.id}`} className="w-4 h-4" />
                            <span>選項 D</span>
                          </div>
                        </div>
                      )}

                      {qContent?.answer_type === 'fill' && (
                        <input
                          type="text"
                          placeholder="請輸入答案"
                          className="w-full max-w-md px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                        />
                      )}

                      {(!qContent?.answer_type || qContent?.answer_type === 'text') && (
                        <textarea
                          placeholder="請輸入你的答案"
                          rows={4}
                          className="w-full max-w-md px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                        />
                      )}
                    </div>

                    {/* 提交按鈕 */}
                    <div className="mt-6 flex justify-end">
                      <button className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium">
                        提交答案
                      </button>
                    </div>
                  </div>

                  {/* 答案和解釋（僅老師可見） */}
                  <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
                    {qContent?.answer && (
                      <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                        <h4 className="text-sm font-semibold text-green-900 mb-2">✅ 參考答案</h4>
                        <div className="text-sm text-green-800" dangerouslySetInnerHTML={{ __html: qContent.answer }} />
                      </div>
                    )}
                    {qContent?.explanation && (
                      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                        <h4 className="text-sm font-semibold text-blue-900 mb-2">💡 解釋 / 備註</h4>
                        <div className="text-sm text-blue-800" dangerouslySetInnerHTML={{ __html: qContent.explanation }} />
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          )
        })}
      </div>

      {filteredQuestions.length === 0 && (
        <div className="text-center py-12">
          <p className="text-gray-500 text-lg">
            {searchTerm || filterStatus !== 'all'
              ? '無符合搜尋條件嘅題目'
              : '暫無題目'}
          </p>
          <p className="text-gray-400 text-sm mt-2">
            {searchTerm || filterStatus !== 'all'
              ? '請嘗試其他搜尋關鍵字或清除篩選'
              : '請先上傳試卷或建立新題目'}
          </p>
        </div>
      )}

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
