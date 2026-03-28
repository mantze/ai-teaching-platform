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
  const [filterTopic, setFilterTopic] = useState<string>('all')
  const [filterQuestionType, setFilterQuestionType] = useState<string>('all')
  const [filterDifficulty, setFilterDifficulty] = useState<string>('all')
  const [selectedStatuses, setSelectedStatuses] = useState<string[]>(['active', 'pending', 'pending_review', 'draft'])
  const [topics, setTopics] = useState<{id: string, name: string}[]>([])

  const keywordSuggestions = [
    '分數', '應用題', '計算', '圖形', '統計',
    '選擇題', '填充題', '問答題',
    'P1', 'P2', 'P3', 'P4', 'P5', 'P6',
    '容易', '中等', '困難'
  ]

  useEffect(() => {
    async function loadTopics() {
      const { data, error } = await supabase
        .from('topics')
        .select('id, name')
        .order('name')
      
      if (error) console.error('Error loading topics:', error)
      if (data) setTopics(data)
    }
    loadTopics()
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
        if (prev.length > 1) {
          return prev.filter(s => s !== status)
        }
        return prev
      } else {
        return [...prev, status]
      }
    })
  }

  function selectAllStatuses() {
    setSelectedStatuses(['active', 'pending', 'pending_review', 'draft', 'inactive'])
  }

  function clearStatusSelection() {
    setSelectedStatuses(['active', 'pending', 'pending_review', 'draft'])
  }

  function addKeywordToSearch(keyword: string) {
    const newSearch = searchTerm ? `${searchTerm} ${keyword}` : keyword
    setSearchTerm(newSearch)
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

  function getTopicName(topicId?: string): string {
    if (!topicId) return ''
    const topic = topics.find(t => t.id === topicId)
    return topic?.name || ''
  }

  function getQuestionTypeName(type?: string): string {
    if (!type) return ''
    const typeMap: Record<string, string> = {
      'choice': '選擇題',
      'multiple_choice': '多選題',
      'fill': '填充題',
      'answer': '問答題',
      'matching': '配對題',
      'ordering': '排序題'
    }
    return typeMap[type] || ''
  }

  function extractGradeFromTags(tags?: string[]): string {
    if (!tags) return 'P5'
    const gradeTag = tags.find(t => t.match(/^P[1-6]|S[1-6]$/i))
    return gradeTag || 'P5'
  }

  function filterDuplicateTags(tags?: string[]): string[] {
    if (!tags || tags.length === 0) return []
    
    const subjects = ['數學', '中文', '英文', '中', '英', '數']
    const grades = ['P1', 'P2', 'P3', 'P4', 'P5', 'P6', 'S1', 'S2', 'S3', 'S4', 'S5', 'S6']
    const questionTypes = ['選擇題', '多選題', '填充題', '問答題', '配對題', '排序題', 'choice', 'multiple_choice', 'fill', 'answer', 'matching', 'ordering']
    const displayedTopics = topics.map(t => t.name)
    
    return tags.filter(tag => {
      if (subjects.includes(tag)) return false
      if (grades.includes(tag)) return false
      if (questionTypes.includes(tag)) return false
      if (displayedTopics.includes(tag)) return false
      return true
    })
  }

  function copyFullId(fullId: string) {
    navigator.clipboard.writeText(fullId)
    alert('已複製完整 ID:\n' + fullId)
  }

  const filteredQuestions = questions.filter(q => {
    const content = q.content as any
    const text = (q.title || '') + ' ' + (content?.text || '') + ' ' + (q.tags?.join(' ') || '') + ' ' + (q.id || '')
    
    const matchesSearch = searchTerm === '' || text.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesSubject = filterSubject === 'all' || q.subject_id === filterSubject
    const grade = extractGradeFromTags(q.tags)
    const matchesGrade = filterGrade === 'all' || grade === filterGrade
    const matchesTopic = filterTopic === 'all' || q.topic_id === filterTopic
    const matchesQuestionType = filterQuestionType === 'all' || q.question_type === filterQuestionType
    const matchesDifficulty = filterDifficulty === 'all' || q.difficulty === filterDifficulty
    const matchesStatus = selectedStatuses.length === 0 || selectedStatuses.includes(q.status || 'draft')
    
    return matchesSearch && matchesSubject && matchesGrade && matchesTopic && matchesQuestionType && matchesDifficulty && matchesStatus
  })

  if (loading) return <div className="p-4 text-center">載入中...</div>

  return (
    <div className="p-6 max-w-7xl mx-auto">
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

      <div className="bg-white p-4 rounded-lg shadow-sm border mb-6">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-3 mb-4">
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">📚 科目</label>
            <select
              value={filterSubject}
              onChange={(e) => setFilterSubject(e.target.value)}
              className="w-full px-2 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 text-sm"
            >
              <option value="all">全部科目</option>
              <option value="d302b713-42c1-46ff-8844-1662f5cbf1fb">數學</option>
              <option value="b4186fda-a862-4a94-8472-07c381f3f378">中文</option>
              <option value="62291ec5-13fe-4299-bafa-0f9ec4b2481b">英文</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">🎓 年級</label>
            <select
              value={filterGrade}
              onChange={(e) => setFilterGrade(e.target.value)}
              className="w-full px-2 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 text-sm"
            >
              <option value="all">全部年級</option>
              <option value="P1">小一</option>
              <option value="P2">小二</option>
              <option value="P3">小三</option>
              <option value="P4">小四</option>
              <option value="P5">小五</option>
              <option value="P6">小六</option>
              <option value="S1">中一</option>
              <option value="S2">中二</option>
              <option value="S3">中三</option>
              <option value="S4">中四</option>
              <option value="S5">中五</option>
              <option value="S6">中六</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">📖 主題</label>
            <select
              value={filterTopic}
              onChange={(e) => setFilterTopic(e.target.value)}
              className="w-full px-2 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 text-sm"
            >
              <option value="all">全部主題</option>
              {topics.map(topic => (
                <option key={topic.id} value={topic.id}>{topic.name}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">📝 題型</label>
            <select
              value={filterQuestionType}
              onChange={(e) => setFilterQuestionType(e.target.value)}
              className="w-full px-2 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 text-sm"
            >
              <option value="all">全部題型</option>
              <option value="choice">選擇題</option>
              <option value="multiple_choice">多選題</option>
              <option value="fill">填充題</option>
              <option value="answer">問答題</option>
              <option value="matching">配對題</option>
              <option value="ordering">排序題</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">⚡ 難度</label>
            <select value={filterDifficulty} onChange={(e) => setFilterDifficulty(e.target.value)} className="w-full px-2 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 text-sm">
              <option value="all">全部難度</option>
              <option value="easy">淺</option>
              <option value="medium">中</option>
              <option value="hard">深</option>
            </select>
          </div>
        </div>

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
            </div>
          </div>
          <div className="flex flex-wrap gap-3">
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

            <label className={`flex items-center gap-2 cursor-pointer px-3 py-2 rounded-lg border transition-colors ${
              selectedStatuses.includes('inactive') ? 'bg-gray-50 border-gray-500' : 'bg-white border-gray-300 hover:bg-gray-50'
            }`}>
              <input
                type="checkbox"
                checked={selectedStatuses.includes('inactive')}
                onChange={() => toggleStatus('inactive')}
                className="w-4 h-4 text-gray-600 rounded"
              />
              <span className="text-sm">❌ Inactive</span>
              <span className="text-xs text-gray-500">
                ({questions.filter(q => q.status === 'inactive').length})
              </span>
            </label>
          </div>
        </div>

        <div className="mb-3 mt-4">
          <label className="block text-xs font-medium text-gray-600 mb-1">🔍 搜尋題目內容、標籤、ID</label>
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="輸入關鍵字搜尋..."
            className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div className="mb-3">
          <div className="flex items-center gap-2 mb-2">
            <label className="text-xs font-medium text-gray-600">💡 常用關鍵字（點擊加入搜尋）</label>
            {searchTerm && (
              <button
                onClick={() => setSearchTerm('')}
                className="text-xs text-red-600 hover:text-red-800"
              >
                ✖️ 清除搜尋
              </button>
            )}
          </div>
          <div className="flex flex-wrap gap-2">
            {keywordSuggestions.map((keyword, index) => (
              <button
                key={index}
                onClick={() => addKeywordToSearch(keyword)}
                className="px-3 py-1 bg-gray-100 text-gray-700 text-xs rounded-full hover:bg-blue-100 hover:text-blue-700 transition-colors"
              >
                {keyword}
              </button>
            ))}
          </div>
        </div>

        {(searchTerm || filterSubject !== 'all' || filterGrade !== 'all' || filterTopic !== 'all' || filterQuestionType !== 'all' || selectedStatuses.length !== 4) && (
          <div className="mt-4 flex items-center gap-2">
            <button
              onClick={() => {
                setSearchTerm('')
                setFilterSubject('all')
                setFilterGrade('all')
                setFilterTopic('all')
                setFilterQuestionType('all')
                setSelectedStatuses(['active', 'pending', 'pending_review', 'draft'])
              }}
              className="text-sm text-blue-600 hover:text-blue-800"
            >
              ✖️ 清除所有篩選
            </button>
          </div>
        )}
      </div>

      <div className="space-y-4">
        {filteredQuestions.map((q, index) => {
          const content = q.content as any
          const subjectName = getSubjectName(q.subject_id)
          const grade = extractGradeFromTags(q.tags)
          const topicName = getTopicName(q.topic_id)
          const questionTypeName = getQuestionTypeName(q.question_type)
          const displayTags = filterDuplicateTags(q.tags)

          return (
            <div key={q.id} className="border rounded-lg p-4 bg-white shadow-sm">
              {/* 題目內容 */}
              <div className="mb-4">
                <p className="text-base" dangerouslySetInnerHTML={{ __html: (q.content as any)?.text || q.title || "" }} />
              </div>

              {/* 圖片 */}
              {content.image_base64 && (
                <div className="mb-4">
                  <img src={content.image_base64} alt="題目圖片" className="max-w-md border rounded" />
                </div>
              )}

              {/* 選項 - 修復：正確處理 options */}
              {content.options && content.options.length > 0 && (
                <div className="ml-4 space-y-1 mb-4">
                  {content.options.map((opt: any, i: number) => {
                    // 安全提取選項文字：處理 string 或 object
                    let optionText = ''
                    if (typeof opt === 'string') {
                      optionText = opt
                    } else if (typeof opt === 'object' && opt !== null) {
                      // 如果係 object，提取 text 字段
                      optionText = opt.text || opt.content || ''
                      // 如果都係空，唔好顯示 JSON，顯示空字符串
                      if (!optionText) {
                        optionText = ''
                      }
                    } else {
                      optionText = String(opt || '')
                    }
                    return (
                      <div key={i} className="text-gray-600 text-sm" dangerouslySetInnerHTML={{ __html: optionText }} />
                    )
                  })}
                </div>
              )}

              {/* Footer - 所有 Metadata 成一列 */}
              <div className="pt-3 border-t flex flex-wrap items-center gap-2 text-xs">
                {/* 年級 */}
                <span className="px-2 py-1 bg-gray-100 text-gray-600 rounded font-medium">
                  {grade}
                </span>
                {/* 科目 */}
                <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded">
                  {subjectName}
                </span>
                {/* 主題 */}
                {topicName && (
                  <span className="px-2 py-1 bg-purple-100 text-purple-800 rounded">
                    {topicName}
                  </span>
                )}
                {/* 題型 */}
                {questionTypeName && (
                  <span className="px-2 py-1 bg-orange-100 text-orange-800 rounded">
                    {questionTypeName}
                  </span>
                )}
                {/* 難度 */}
                <span className="px-2 py-1 bg-yellow-100 text-yellow-800 rounded">
                  {q.difficulty}
                </span>
                {/* 狀態 */}
                {q.status && (
                  <span className={`px-2 py-1 rounded font-medium ${
                    q.status === 'active' ? 'bg-green-100 text-green-800' :
                    q.status === 'pending' || q.status === 'pending_review' ? 'bg-yellow-100 text-yellow-800' :
                    'bg-gray-100 text-gray-800'
                  }`}>
                    {q.status === 'active' ? '✅ Active' :
                     q.status === 'pending' || q.status === 'pending_review' ? '⏳ Pending' : '❌ Inactive'}
                  </span>
                )}
                {/* ID (可點擊複製) */}
                <button
                  onClick={() => copyFullId(q.id || '')}
                  className="px-2 py-1 bg-gray-100 text-gray-600 rounded font-mono hover:bg-gray-200 cursor-pointer"
                  title="點擊複製完整 ID"
                >
                  ID: {q.id?.substring(0, 8)}...
                </button>
                {/* 複製/編輯按鈕 */}
                <div className="flex-1" />
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

              {/* Tags - 過濾咗重複嘅資訊 */}
              {displayTags.length > 0 && (
                <div className="flex flex-wrap gap-1 mt-2">
                  {displayTags.map((tag: string, i: number) => (
                    <span key={i} className="px-2 py-0.5 bg-gray-100 text-gray-600 text-xs rounded">{tag}</span>
                  ))}
                </div>
              )}
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
        </div>
      )}

      <div className="mt-8 pt-6 border-t border-gray-200">
        <div className="flex justify-between items-center text-xs text-gray-500">
          <div>
            <span>版本：1.7.9</span>
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
