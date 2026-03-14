import React, { useEffect, useState } from 'react'
import { db } from '../services/supabase'
import { Question } from '../types'

export function Review() {
  const [questions, setQuestions] = useState<Question[]>([])
  const [currentIndex, setCurrentIndex] = useState(0)
  const [editing, setEditing] = useState(false)
  const [editData, setEditData] = useState<any>({})

  useEffect(() => {
    loadPendingQuestions()
  }, [])

  async function loadPendingQuestions() {
    const { data } = await db.getQuestions({ status: 'pending_review' })
    if (data) setQuestions(data)
  }

  async function approveQuestion() {
    const q = questions[currentIndex]
    await db.updateQuestion(q.id!, { ...q, ...editData, status: 'approved' })
    setQuestions(questions.filter((_, i) => i !== currentIndex))
    setEditing(false)
  }

  async function rejectQuestion() {
    const q = questions[currentIndex]
    await db.updateQuestion(q.id!, { status: 'rejected' })
    setQuestions(questions.filter((_, i) => i !== currentIndex))
  }

  async function bulkApprove() {
    for (const q of questions) {
      await db.updateQuestion(q.id!, { ...q, status: 'approved' })
    }
    setQuestions([])
  }

  if (questions.length === 0) {
    return (
      <div className="p-4 text-center text-gray-500">
        <h2 className="text-2xl font-bold mb-4">待審核題目</h2>
        <p>無待審核題目，請先上傳試卷</p>
      </div>
    )
  }

  const q = questions[currentIndex]
  const content = q.content as any

  return (
    <div className="p-4">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-2xl font-bold">待審核題目 ({questions.length} 條)</h2>
        <button
          className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
          onClick={bulkApprove}
        >
          批量通過 ({questions.length})
        </button>
      </div>

      <div className="border rounded-lg p-4 bg-white">
        <div className="flex justify-between mb-4">
          <span className="text-sm text-gray-500">題目 {currentIndex + 1} / {questions.length}</span>
          <div className="flex gap-2">
            <button className="px-3 py-1 bg-gray-100 rounded" onClick={() => setCurrentIndex(Math.max(0, currentIndex - 1))}>◀ 上一題</button>
            <button className="px-3 py-1 bg-gray-100 rounded" onClick={() => setCurrentIndex(Math.min(questions.length - 1, currentIndex + 1))}>下一題 ▶</button>
          </div>
        </div>

        {content.image_base64 && (
          <div className="mb-4">
            <img src={content.image_base64} alt="題目圖片" className="max-w-md border rounded" />
          </div>
        )}

        {editing ? (
          <div className="space-y-3">
            <textarea
              className="w-full p-2 border rounded"
              value={editData.title || q.title}
              onChange={(e) => setEditData({ ...editData, title: e.target.value })}
              rows={3}
            />
            <div className="grid grid-cols-2 gap-3">
              <select
                className="p-2 border rounded"
                value={editData.difficulty || q.difficulty}
                onChange={(e) => setEditData({ ...editData, difficulty: e.target.value })}
              >
                <option value="easy">淺 (Level 1-3)</option>
                <option value="medium">中 (Level 4-6)</option>
                <option value="hard">深 (Level 7-8)</option>
                <option value="exam">極深 (Level 9-10)</option>
              </select>
              <input
                type="number"
                className="p-2 border rounded"
                placeholder="分數"
                value={editData.score || q.score}
                onChange={(e) => setEditData({ ...editData, score: parseInt(e.target.value) })}
              />
            </div>
          </div>
        ) : (
          <div>
            <p className="text-lg mb-3">{q.title}</p>
            {content.options && content.options.length > 0 && (
              <div className="ml-4 space-y-1 mb-3">
                {content.options.map((opt: string, i: number) => (
                  <div key={i} className="text-gray-600">{opt}</div>
                ))}
              </div>
            )}
            <div className="flex gap-2 mb-3">
              <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded">{q.question_type}</span>
              <span className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded">{q.difficulty}</span>
              <span className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded">{q.score}分</span>
            </div>
          </div>
        )}

        <div className="flex gap-2 mt-4 pt-4 border-t">
          {editing ? (
            <>
              <button className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700" onClick={approveQuestion}>✅ 通過</button>
              <button className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700" onClick={() => setEditing(false)}>取消</button>
            </>
          ) : (
            <>
              <button className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700" onClick={approveQuestion}>✅ 通過</button>
              <button className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700" onClick={() => { setEditData({}); setEditing(true) }}>✏️ 編輯</button>
              <button className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700" onClick={rejectQuestion}>❌ 拒絕</button>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
