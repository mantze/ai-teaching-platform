import React, { useEffect, useState } from 'react'
import { db } from '../services/supabase'
import { Question } from '../types'

export function QuestionBank() {
  const [questions, setQuestions] = useState<Question[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadQuestions()
  }, [])

  async function loadQuestions() {
    const { data } = await db.getQuestions()
    if (data) {
      setQuestions(data)
      setLoading(false)
    }
  }

  if (loading) return <div className="p-4">載入中...</div>

  return (
    <div className="p-4">
      <h2 className="text-2xl font-bold mb-4">題目庫 ({questions.length} 條)</h2>
      <div className="space-y-3">
        {questions.map(q => {
          const content = q.content as any
          const hasImage = content?.has_image || content?.image_base64 || content?.image_url
          
          return (
            <div key={q.id} className="border rounded p-3 bg-white">
              <div className="flex items-center gap-2 mb-2">
                <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded">{q.question_type}</span>
                <span className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded">{q.difficulty}</span>
                <span className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded">{q.score}分</span>
              </div>
              <p className="text-gray-800 mb-2">{q.title}</p>
              {hasImage && content.image_base64 && (
                <div className="mb-2">
                  <img src={content.image_base64} alt="題目圖片" className="max-w-md border rounded" />
                </div>
              )}
              {hasImage && content.image_url && !content.image_base64 && (
                <div className="mb-2">
                  <img src={content.image_url} alt="題目圖片" className="max-w-md border rounded" />
                </div>
              )}
              {content?.options && content.options.length > 0 && (
                <div className="ml-4 space-y-1 mb-2">
                  {content.options.map((opt: string, i: number) => (
                    <div key={i} className="text-sm text-gray-600">{opt}</div>
                  ))}
                </div>
              )}
              <div className="flex flex-wrap gap-1">
                {q.tags?.map((tag, i) => (
                  <span key={i} className="px-2 py-0.5 bg-gray-100 text-gray-600 text-xs rounded">{tag}</span>
                ))}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
