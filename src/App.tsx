import React, { useState } from 'react'
import { QuestionBank } from './pages/QuestionBank'
import { Editor } from './components/editor/Editor'

function App() {
  const [page, setPage] = useState<'editor' | 'bank'>( 'editor')

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
          className={"px-4 py-2 rounded " + (page === 'bank' ? "bg-blue-600 text-white" : "bg-gray-100")}
          onClick={() => setPage('bank')}
        >
          題目庫
        </button>
      </nav>
      {page === 'editor' ? <Editor /> : <QuestionBank />}
    </div>
  )
}

export default App
