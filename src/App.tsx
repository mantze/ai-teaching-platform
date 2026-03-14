import React, { useState } from 'react'
import { QuestionBank } from './pages/QuestionBank'
import { Editor } from './components/editor/Editor'
import { Upload } from './pages/Upload'
import { Review } from './pages/Review'

function App() {
  const [page, setPage] = useState<'editor' | 'bank' | 'upload' | 'review'>( 'editor')
  const [pendingCount, setPendingCount] = useState(0)

  return (
    <div className="h-screen bg-gray-50">
      <nav className="bg-white border-b p-4 flex gap-4">
        <button 
          className={"px-4 py-2 rounded " + (page === 'editor' ? "bg-blue-600 text-white" : "bg-gray-100")}
          onClick={() => setPage('editor')}
        >
          編輯器
        </button>
        <button 
          className={"px-4 py-2 rounded " + (page === 'upload' ? "bg-blue-600 text-white" : "bg-gray-100")}
          onClick={() => setPage('upload')}
        >
          📤 上傳試卷
        </button>
        <button 
          className={"px-4 py-2 rounded relative " + (page === 'review' ? "bg-blue-600 text-white" : "bg-gray-100")}
          onClick={() => setPage('review')}
        >
          ✅ 審核題目
          {pendingCount > 0 && (
            <span className="absolute -top-2 -right-2 px-2 py-0.5 bg-red-600 text-white text-xs rounded-full">
              {pendingCount}
            </span>
          )}
        </button>
        <button 
          className={"px-4 py-2 rounded " + (page === 'bank' ? "bg-blue-600 text-white" : "bg-gray-100")}
          onClick={() => setPage('bank')}
        >
          題目庫
        </button>
      </nav>
      {page === 'editor' && <Editor />}
      {page === 'upload' && <Upload onUploadComplete={(count) => { setPendingCount(count); setPage('review') }} />}
      {page === 'review' && <Review />}
      {page === 'bank' && <QuestionBank />}
    </div>
  )
}

export default App
