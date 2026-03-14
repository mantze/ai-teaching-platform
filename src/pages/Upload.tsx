import React, { useState } from 'react'

interface UploadProps {
  onUploadComplete: (count: number) => void
}

export function Upload({ onUploadComplete }: UploadProps) {
  const [uploading, setUploading] = useState(false)
  const [file, setFile] = useState<File | null>(null)

  async function handleUpload() {
    if (!file) return
    setUploading(true)
    
    const formData = new FormData()
    formData.append('file', file)
    
    // Call backend API to parse and extract
    const resp = await fetch('/api/parse-exam', {
      method: 'POST',
      body: formData
    })
    
    const result = await resp.json()
    setUploading(false)
    onUploadComplete(result.count)
  }

  return (
    <div className="p-4">
      <h2 className="text-2xl font-bold mb-4">上傳試卷</h2>
      <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
        <input
          type="file"
          accept=".pdf,.doc,.docx"
          onChange={(e) => setFile(e.target.files?.[0] || null)}
          className="mb-4"
        />
        <p className="text-gray-600 mb-4">
          支持格式：PDF, DOC, DOCX
        </p>
        <button
          className="px-6 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:bg-gray-400"
          onClick={handleUpload}
          disabled={!file || uploading}
        >
          {uploading ? '解析中...' : '上傳並解析'}
        </button>
      </div>
    </div>
  )
}
