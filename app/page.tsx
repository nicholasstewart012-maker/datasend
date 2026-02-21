'use client'

import { useState, useRef, useCallback, useEffect } from 'react'

type UploadResult = {
  name: string
  success: boolean
  url?: string
  storedName?: string
  size?: number
  error?: string
}

type FileItem = {
  id: string
  name: string
  storedName: string
  size: number
  createdAt: string
  url: string
}

type Clip = {
  id: string
  content: string
  label: string | null
  created_at: string
}

type Toast = {
  id: number
  message: string
  type: 'success' | 'error' | 'info'
}

function formatBytes(bytes: number) {
  if (!bytes) return '0 B'
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`
}

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString('en-US', {
    month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
  })
}

export default function Home() {
  const [activeTab, setActiveTab] = useState<'files' | 'text'>('files')
  const [dragging, setDragging] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [uploadQueue, setUploadQueue] = useState<{ name: string; status: 'uploading' | 'done' | 'error' }[]>([])
  const [files, setFiles] = useState<FileItem[]>([])
  const [filesLoading, setFilesLoading] = useState(false)
  const [clips, setClips] = useState<Clip[]>([])
  const [clipsLoading, setClipsLoading] = useState(false)
  const [textContent, setTextContent] = useState('')
  const [textLabel, setTextLabel] = useState('')
  const [savingText, setSavingText] = useState(false)
  const [expandedClips, setExpandedClips] = useState<Set<string>>(new Set())
  const [toasts, setToasts] = useState<Toast[]>([])
  const [refreshingSpin, setRefreshingSpin] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const toastId = useRef(0)

  const addToast = useCallback((message: string, type: Toast['type'] = 'info') => {
    const id = toastId.current++
    setToasts(prev => [...prev, { id, message, type }])
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 3500)
  }, [])

  const loadFiles = useCallback(async () => {
    setFilesLoading(true)
    try {
      const res = await fetch('/api/files')
      const data = await res.json()
      if (data.files) setFiles(data.files)
    } catch {
      addToast('Failed to load files', 'error')
    } finally {
      setFilesLoading(false)
    }
  }, [addToast])

  const loadClips = useCallback(async () => {
    setClipsLoading(true)
    try {
      const res = await fetch('/api/text')
      const data = await res.json()
      if (data.clips) setClips(data.clips)
    } catch {
      addToast('Failed to load text clips', 'error')
    } finally {
      setClipsLoading(false)
    }
  }, [addToast])

  useEffect(() => { loadFiles() }, [loadFiles])
  useEffect(() => { loadClips() }, [loadClips])

  const handleRefresh = async () => {
    setRefreshingSpin(true)
    await Promise.all([loadFiles(), loadClips()])
    setTimeout(() => setRefreshingSpin(false), 600)
  }

  const uploadFiles = async (fileList: FileList | File[]) => {
    const filesArr = Array.from(fileList)
    if (!filesArr.length) return

    setUploading(true)
    setUploadQueue(filesArr.map(f => ({ name: f.name, status: 'uploading' })))

    const formData = new FormData()
    filesArr.forEach(f => formData.append('files', f))

    try {
      const res = await fetch('/api/upload', { method: 'POST', body: formData })
      const data = await res.json()

      if (data.results) {
        const results: UploadResult[] = data.results
        setUploadQueue(results.map(r => ({
          name: r.name,
          status: r.success ? 'done' : 'error',
        })))

        const successCount = results.filter(r => r.success).length
        const errorCount = results.filter(r => !r.success).length

        if (successCount > 0) addToast(`${successCount} file${successCount > 1 ? 's' : ''} uploaded`, 'success')
        if (errorCount > 0) addToast(`${errorCount} file${errorCount > 1 ? 's' : ''} failed`, 'error')

        await loadFiles()
      }
    } catch {
      addToast('Upload failed', 'error')
      setUploadQueue(prev => prev.map(i => ({ ...i, status: 'error' })))
    } finally {
      setUploading(false)
      setTimeout(() => setUploadQueue([]), 3000)
    }
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setDragging(false)
    if (e.dataTransfer.files.length) uploadFiles(e.dataTransfer.files)
  }

  const deleteFile = async (storedName: string, name: string) => {
    try {
      await fetch('/api/files', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ storedName }),
      })
      setFiles(prev => prev.filter(f => f.storedName !== storedName))
      addToast(`Deleted ${name}`, 'info')
    } catch {
      addToast('Delete failed', 'error')
    }
  }

  const saveText = async () => {
    if (!textContent.trim()) return
    setSavingText(true)
    try {
      const res = await fetch('/api/text', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: textContent, label: textLabel || null }),
      })
      const data = await res.json()
      if (data.clip) {
        setClips(prev => [data.clip, ...prev])
        setTextContent('')
        setTextLabel('')
        addToast('Text saved!', 'success')
      }
    } catch {
      addToast('Save failed', 'error')
    } finally {
      setSavingText(false)
    }
  }

  const copyClip = async (content: string) => {
    try {
      await navigator.clipboard.writeText(content)
      addToast('Copied to clipboard!', 'success')
    } catch {
      addToast('Copy failed', 'error')
    }
  }

  const deleteClip = async (id: string) => {
    try {
      await fetch('/api/text', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id }),
      })
      setClips(prev => prev.filter(c => c.id !== id))
      addToast('Clip deleted', 'info')
    } catch {
      addToast('Delete failed', 'error')
    }
  }

  const toggleExpand = (id: string) => {
    setExpandedClips(prev => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }

  return (
    <>
      <div className="app">
        {/* Header */}
        <header className="header">
          <div className="header-left">
            <div className="logo">
              <span className="logo-dot" />
              DataBridge
            </div>
            <div className="tagline">Transfer files &amp; text between your machines</div>
          </div>
          <div className="status-bar">
            <span className="status-dot" />
            <span>LIVE</span>
            <button
              className="btn btn-sm"
              onClick={handleRefresh}
              style={{ marginLeft: 8 }}
              title="Refresh"
            >
              <span className={refreshingSpin ? 'spinning' : ''}>↻</span>
              Refresh
            </button>
          </div>
        </header>

        {/* Tabs */}
        <div className="tabs">
          <button className={`tab ${activeTab === 'files' ? 'active' : ''}`} onClick={() => setActiveTab('files')}>
            ⬡ Files
          </button>
          <button className={`tab ${activeTab === 'text' ? 'active' : ''}`} onClick={() => setActiveTab('text')}>
            ≡ Text / Clipboard
          </button>
        </div>

        {/* Files Panel */}
        <div className={`panel ${activeTab === 'files' ? 'active' : ''}`}>
          {/* Drop Zone */}
          <div
            className={`dropzone ${dragging ? 'dragging' : ''}`}
            onDragOver={e => { e.preventDefault(); setDragging(true) }}
            onDragLeave={() => setDragging(false)}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
          >
            <input
              ref={fileInputRef}
              type="file"
              multiple
              style={{ display: 'none' }}
              onChange={e => e.target.files && uploadFiles(e.target.files)}
            />
            <span className="dropzone-icon">⬆</span>
            <div className="dropzone-title">
              {dragging ? 'Drop to upload' : 'Drop files here or click to browse'}
            </div>
            <div className="dropzone-sub">
              {uploading ? 'Uploading...' : 'Any file type · Multiple files supported'}
            </div>
          </div>

          {/* Upload Queue */}
          {uploadQueue.length > 0 && (
            <div className="upload-queue">
              {uploadQueue.map((item, i) => (
                <div key={i} className="upload-item">
                  <span className="upload-item-name">{item.name}</span>
                  <span className={`upload-item-status status-${item.status}`}>
                    {item.status === 'uploading' ? '● Uploading' : item.status === 'done' ? '✓ Done' : '✗ Error'}
                  </span>
                </div>
              ))}
            </div>
          )}

          {/* File List */}
          <div className="section-header">
            <span className="section-title">Stored Files ({files.length})</span>
          </div>

          <div className="file-list">
            {filesLoading ? (
              <div className="empty-state">Loading...</div>
            ) : files.length === 0 ? (
              <div className="empty-state">No files yet. Upload something above.</div>
            ) : (
              files.map(file => (
                <div key={file.id || file.storedName} className="file-row">
                  <span className="file-name" title={file.name}>{file.name}</span>
                  <span className="file-size">{formatBytes(file.size)}</span>
                  <span className="file-date">{file.createdAt ? formatDate(file.createdAt) : '—'}</span>
                  <div style={{ display: 'flex', gap: 6 }}>
                    <a
                      href={file.url}
                      download={file.name}
                      className="btn btn-sm"
                      target="_blank"
                      rel="noreferrer"
                      onClick={e => e.stopPropagation()}
                    >
                      ↓ Get
                    </a>
                    <button
                      className="btn btn-danger"
                      onClick={() => deleteFile(file.storedName, file.name)}
                    >
                      ✕
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Text Panel */}
        <div className={`panel ${activeTab === 'text' ? 'active' : ''}`}>
          <div className="text-input-area">
            <div className="text-label-row">
              <input
                className="input-field"
                type="text"
                placeholder="Label (optional — e.g. 'env vars', 'ssh key')"
                value={textLabel}
                onChange={e => setTextLabel(e.target.value)}
              />
            </div>
            <textarea
              className="textarea-field"
              placeholder="Paste or type anything — commands, URLs, notes, code snippets, env vars..."
              value={textContent}
              onChange={e => setTextContent(e.target.value)}
              onKeyDown={e => {
                if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') saveText()
              }}
            />
            <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
              <button
                className="btn btn-primary"
                onClick={saveText}
                disabled={savingText || !textContent.trim()}
              >
                {savingText ? 'Saving...' : '⬆ Save Clip'} <span style={{ opacity: 0.6, fontSize: 10 }}>⌘↵</span>
              </button>
            </div>
          </div>

          <div className="section-header">
            <span className="section-title">Saved Clips ({clips.length})</span>
          </div>

          <div className="clip-list">
            {clipsLoading ? (
              <div className="empty-state">Loading...</div>
            ) : clips.length === 0 ? (
              <div className="empty-state">No clips yet. Paste something above.</div>
            ) : (
              clips.map(clip => (
                <div key={clip.id} className="clip-card">
                  <div className="clip-header">
                    <span className="clip-label">{clip.label || 'clip'}</span>
                    <span className="clip-meta">{formatDate(clip.created_at)}</span>
                    <div className="clip-actions">
                      {clip.content.length > 200 && (
                        <button className="btn btn-sm" onClick={() => toggleExpand(clip.id)}>
                          {expandedClips.has(clip.id) ? '↑ Less' : '↓ More'}
                        </button>
                      )}
                      <button className="btn btn-sm" onClick={() => copyClip(clip.content)}>
                        ⎘ Copy
                      </button>
                      <button className="btn btn-danger" onClick={() => deleteClip(clip.id)}>✕</button>
                    </div>
                  </div>
                  <div className={`clip-content ${expandedClips.has(clip.id) ? 'expanded' : ''}`}>
                    {clip.content}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Toast notifications */}
      <div className="toast-container">
        {toasts.map(t => (
          <div key={t.id} className={`toast ${t.type}`}>{t.message}</div>
        ))}
      </div>
    </>
  )
}
