import React, { useState, useEffect } from 'react'
import { Dashboard } from './pages/Dashboard'
import { QuestionBank } from './pages/QuestionBank'
import { Upload } from './pages/Upload'
import { Review } from './pages/Review'
import { Tutorials } from './pages/Tutorials'
import { QuestionEditor } from './QuestionEditor'
import { Question } from './types/index'

type Page = 'dashboard' | 'questions' | 'upload' | 'review' | 'create' | 'edit' | 'tutorials'
type TutorialId = 'p5-fraction-division' | 'p5-fraction-addition' | 'p4-fraction-basics'

const pageRoutes: Record<string, Page> = {
  '/': 'dashboard',
  '/dashboard': 'dashboard',
  '/questions': 'questions',
  '/upload': 'upload',
  '/review': 'review',
  '/create': 'create',
  '/tutorials': 'tutorials',
}

const tutorials: { id: TutorialId; label: string; grade: string }[] = [
  { id: 'p5-fraction-division', label: '分數除法（小五）', grade: 'P5' },
  { id: 'p5-fraction-addition', label: '分數加法（小五）', grade: 'P5' },
  { id: 'p4-fraction-basics', label: '分數基礎（小四）', grade: 'P4' },
]

// 從 URL 獲取頁面的函數
function getPageFromUrl(): Page {
  if (typeof window === 'undefined') return 'dashboard'
  const path = window.location.pathname
  const matchedPage = pageRoutes[path] || pageRoutes[path.replace(/\/$/, '')]
  return matchedPage || 'dashboard'
}

// 從 URL 獲取 tutorial ID
function getTutorialFromUrl(): TutorialId | null {
  if (typeof window === 'undefined') return null
  const params = new URLSearchParams(window.location.search)
  const tutorial = params.get('tutorial') as TutorialId
  return tutorial && tutorials.some(t => t.id === tutorial) ? tutorial : null
}

function App() {
  // 使用初始化函數，第一次 render 時就讀取 URL
  const [page, setPage] = useState<Page>(() => getPageFromUrl())
  const [menuOpen, setMenuOpen] = useState(false)
  const [pendingCount, setPendingCount] = useState(0)
  const [editingQuestion, setEditingQuestion] = useState<Question | null>(null)
  const [selectedTutorial, setSelectedTutorial] = useState<TutorialId | null>(() => getTutorialFromUrl())
  const [showTutorialsSubmenu, setShowTutorialsSubmenu] = useState(false)

  // 當頁面改變時更新 URL
  const navigate = (newPage: Page) => {
    const route = Object.entries(pageRoutes).find(([_, p]) => p === newPage)?.[0] || '/'
    window.history.pushState({ page: newPage }, '', route)
    setPage(newPage)
    setMenuOpen(false)
    setShowTutorialsSubmenu(false)
    if (newPage !== 'tutorials') {
      setSelectedTutorial(null)
    }
  }

  const handleSelectTutorial = (tutorialId: TutorialId) => {
    setSelectedTutorial(tutorialId)
    setPage('tutorials')
    // 將 tutorial ID 加入 URL 參數
    window.history.pushState({ page: 'tutorials', tutorial: tutorialId }, '', `/tutorials?tutorial=${tutorialId}`)
    setMenuOpen(false)
    setShowTutorialsSubmenu(false)
  }

  const menuItems = [
    { id: 'dashboard', label: '主頁', icon: '🏠', route: '/' },
    { id: 'questions', label: '題目銀行', icon: '📋', route: '/questions' },
    { id: 'upload', label: '上傳試卷', icon: '📤', badge: pendingCount, route: '/upload' },
    { id: 'review', label: '審核題目', icon: '✅', badge: pendingCount, route: '/review' },
    { id: 'create', label: '建立新題目', icon: '➕', route: '/create' },
  ]

  function handleMenuClick(pageId: Page) {
    const route = menuItems.find(item => item.id === pageId)?.route || '/'
    window.history.pushState({ page: pageId }, '', route)
    setPage(pageId)
    setMenuOpen(false)
    setShowTutorialsSubmenu(false)
  }

  function handleEditQuestion(question: Question) {
    setEditingQuestion(question)
    window.history.pushState({ page: 'edit' }, '', '/edit')
    setPage('edit')
    setMenuOpen(false)
  }

  function handleSaveComplete() {
    try {
      setEditingQuestion(null)
      window.history.pushState({ page: 'dashboard' }, '', '/')
      setPage('dashboard')
    } catch (err) {
      console.error('handleSaveComplete error:', err)
      window.location.href = '/'
    }
  }

  // 處理瀏覽器返回/前進按鈕
  useEffect(() => {
    const handlePopState = (event: PopStateEvent) => {
      const path = window.location.pathname
      const matchedPage = pageRoutes[path] || pageRoutes[path.replace(/\/$/, '')] || 'dashboard'
      setPage(matchedPage)
      
      // 同時檢查 tutorial 參數
      const tutorial = getTutorialFromUrl()
      if (matchedPage === 'tutorials') {
        setSelectedTutorial(tutorial)
      } else {
        setSelectedTutorial(null)
      }
    }
    window.addEventListener('popstate', handlePopState)
    return () => window.removeEventListener('popstate', handlePopState)
  }, [])

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
              {page === 'tutorials' && selectedTutorial ? '📚 教學專區' : menuItems.find(item => item.id === page)?.label}
            </div>
          </div>
        </div>
      </nav>

      {/* 側邊菜單 */}
      {menuOpen && (
        <>
          <div className="fixed inset-0 bg-black bg-opacity-50 z-40" onClick={() => setMenuOpen(false)} />
          <div className="fixed left-0 top-0 h-full w-64 bg-white shadow-xl z-50 overflow-y-auto">
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

              {/* 教學專區子選單 */}
              <div className="mt-2">
                <button
                  onClick={() => setShowTutorialsSubmenu(!showTutorialsSubmenu)}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg mb-1 transition-colors ${
                    page === 'tutorials' ? 'bg-blue-50 text-blue-600 font-medium' : 'hover:bg-gray-50 text-gray-700'
                  }`}
                >
                  <span className="text-xl">📚</span>
                  <span className="flex-1 text-left">教學專區</span>
                  <svg
                    className={`w-5 h-5 transition-transform ${showTutorialsSubmenu ? 'rotate-180' : ''}`}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
                {showTutorialsSubmenu && (
                  <div className="ml-6 mt-1 space-y-1">
                    {tutorials.map(tutorial => (
                      <button
                        key={tutorial.id}
                        onClick={() => handleSelectTutorial(tutorial.id)}
                        className={`w-full text-left px-4 py-2 rounded-lg text-sm transition-colors ${
                          selectedTutorial === tutorial.id
                            ? 'bg-green-100 text-green-700 font-medium'
                            : 'hover:bg-gray-100 text-gray-600'
                        }`}
                      >
                        {tutorial.label}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
            <div className="absolute bottom-0 left-0 right-0 p-4 border-t bg-gray-50">
              <div className="text-xs text-gray-500">
                <p>版本：2.4.0</p>
                <p>{new Date().toLocaleString('zh-HK', { timeZone: 'Asia/Hong_Kong' })}</p>
              </div>
            </div>
          </div>
        </>
      )}

      {/* 主內容區域 */}
      <main className="flex-1 overflow-auto">
        {page === 'dashboard' && <Dashboard onNavigate={(p) => navigate(p as Page)} />}
        {page === 'tutorials' && <Tutorials selectedTutorial={selectedTutorial} onSelectTutorial={handleSelectTutorial} />}
        {page === 'questions' && <QuestionBank onEditQuestion={handleEditQuestion} />}
        {page === 'upload' && <Upload onUploadComplete={(count) => { setPendingCount(count); navigate('review') }} />}
        {page === 'review' && <Review />}
        {page === 'create' && <QuestionEditor mode="create" onSaveComplete={handleSaveComplete} onCancel={() => navigate('dashboard')} />}
        {page === 'edit' && <QuestionEditor question={editingQuestion} mode="edit" onSaveComplete={handleSaveComplete} onCancel={() => navigate('dashboard')} />}
      </main>
    </div>
  )
}

export default App
