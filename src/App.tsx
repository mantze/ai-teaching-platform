import React, { useState } from 'react'
import { QuestionBank } from './pages/QuestionBank'
import { Upload } from './pages/Upload'
import { Review } from './pages/Review'
import { QuestionEditor } from './QuestionEditor'
import { Question } from './types/index'

type Page = 'bank' | 'upload' | 'review' | 'create' | 'edit'

function App() {
  const [page, setPage] = useState<Page>('bank')
  const [menuOpen, setMenuOpen] = useState(false)
  const [pendingCount, setPendingCount] = useState(0)
  const [editingQuestion, setEditingQuestion] = useState<Question | null>(null)

  const menuItems = [
    { id: 'bank', label: '所有題目', icon: '📋' },
    { id: 'upload', label: '上傳試卷', icon: '📤', badge: pendingCount },
    { id: 'review', label: '審核題目', icon: '✅', badge: pendingCount },
    { id: 'create', label: '建立新題目', icon: '➕' },
  ]

  function handleMenuClick(pageId: Page) {
    setPage(pageId)
    setMenuOpen(false)
  }

  function handleEditQuestion(question: Question) {
    setEditingQuestion(question)
    setPage('edit')
    setMenuOpen(false)
  }

  function handleSaveComplete() {
    setPage('bank')
    setEditingQuestion(null)
  }

  return (
    <div className="h-screen bg-gray-50 flex flex-col">
      {/* 頂部導航欄 */}
      <nav className="bg-white border-b shadow-sm">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-3">
              <button
                onClick={() => setMenuOpen(!menuOpen)}
                className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
                title="選單"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              </button>
              <h1 className="text-xl font-bold text-gray-800">AI 教學平台</h1>
            </div>
            <div className="text-sm text-gray-600">
              {menuItems.find(item => item.id === page)?.label}
            </div>
          </div>
        </div>
      </nav>

      {/* 側邊菜單 */}
      {menuOpen && (
        <>
          <div className="fixed inset-0 bg-black bg-opacity-50 z-40" onClick={() => setMenuOpen(false)} />
          <div className="fixed left-0 top-0 h-full w-64 bg-white shadow-xl z-50">
            <div className="p-4 border-b flex justify-between items-center">
              <h2 className="text-lg font-bold text-gray-800">選單</h2>
              <button onClick={() => setMenuOpen(false)} className="p-2 hover:bg-gray-100 rounded-lg">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="p-2">
              {menuItems.map(item => (
                <button
                  key={item.id}
                  onClick={() => handleMenuClick(item.id as Page)}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg mb-1 transition-colors ${
                    page === item.id ? 'bg-blue-50 text-blue-600 font-medium' : 'hover:bg-gray-50 text-gray-700'
                  }`}
                >
                  <span className="text-xl">{item.icon}</span>
                  <span className="flex-1 text-left">{item.label}</span>
                  {item.badge !== undefined && item.badge > 0 && (
                    <span className="px-2 py-0.5 bg-red-500 text-white text-xs rounded-full">{item.badge}</span>
                  )}
                </button>
              ))}
            </div>
            <div className="absolute bottom-0 left-0 right-0 p-4 border-t bg-gray-50">
              <div className="text-xs text-gray-500">
                <p>版本：1.4.0</p>
                <p>{new Date().toLocaleString('zh-HK', { timeZone: 'Asia/Hong_Kong' })}</p>
              </div>
            </div>
          </div>
        </>
      )}

      {/* 主內容區域 */}
      <main className="flex-1 overflow-auto">
        {page === 'upload' && <Upload onUploadComplete={(count) => { setPendingCount(count); setPage('review') }} />}
        {page === 'review' && <Review />}
        {page === 'bank' && <QuestionBank onEditQuestion={handleEditQuestion} />}
        {page === 'create' && <QuestionEditor mode="create" onSaveComplete={handleSaveComplete} onCancel={() => setPage('bank')} />}
        {page === 'edit' && <QuestionEditor question={editingQuestion} mode="edit" onSaveComplete={handleSaveComplete} onCancel={() => setPage('bank')} />}
      </main>
    </div>
  )
}

export default App
