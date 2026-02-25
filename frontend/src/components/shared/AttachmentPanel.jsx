import { useState, useRef } from 'react'
import { Paperclip, Upload, Trash2, Download, FileText, Image, File, Loader2 } from 'lucide-react'
import api from '../../api/client'
import toast from 'react-hot-toast'

const MAX_SIZE_MB = 20

function fileIcon(mimeType) {
  if (!mimeType) return File
  if (mimeType.startsWith('image/')) return Image
  if (mimeType.includes('pdf') || mimeType.includes('text')) return FileText
  return File
}

function formatBytes(bytes) {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

export default function AttachmentPanel({ entityType, entityId }) {
  const [attachments, setAttachments] = useState([])
  const [loading, setLoading] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [loaded, setLoaded] = useState(false)
  const [dragOver, setDragOver] = useState(false)
  const fileInputRef = useRef(null)

  async function loadAttachments() {
    if (loaded) return
    setLoading(true)
    try {
      const res = await api.get('/attachments', { params: { entity_type: entityType, entity_id: entityId } })
      setAttachments(res.data)
      setLoaded(true)
    } catch {
      toast.error('Failed to load attachments')
    } finally {
      setLoading(false)
    }
  }

  // Load on first render if entityId is set
  useState(() => {
    if (entityId) loadAttachments()
  }, [entityId])

  async function uploadFile(file) {
    if (file.size > MAX_SIZE_MB * 1024 * 1024) {
      toast.error(`File exceeds ${MAX_SIZE_MB}MB limit`)
      return
    }
    const formData = new FormData()
    formData.append('file', file)
    formData.append('entity_type', entityType)
    formData.append('entity_id', entityId)

    setUploading(true)
    try {
      const res = await api.post('/attachments', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })
      setAttachments((prev) => [...prev, res.data])
      toast.success('File uploaded')
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Upload failed')
    } finally {
      setUploading(false)
    }
  }

  function handleFileInput(e) {
    const files = Array.from(e.target.files)
    files.forEach(uploadFile)
    e.target.value = ''
  }

  function handleDrop(e) {
    e.preventDefault()
    setDragOver(false)
    const files = Array.from(e.dataTransfer.files)
    files.forEach(uploadFile)
  }

  async function deleteAttachment(id) {
    try {
      await api.delete(`/attachments/${id}`)
      setAttachments((prev) => prev.filter((a) => a.id !== id))
      toast.success('Deleted')
    } catch {
      toast.error('Delete failed')
    }
  }

  async function downloadAttachment(id, filename) {
    try {
      const res = await api.get(`/attachments/${id}/download`, { responseType: 'blob' })
      const url = URL.createObjectURL(res.data)
      const a = document.createElement('a')
      a.href = url
      a.download = filename
      a.click()
      URL.revokeObjectURL(url)
    } catch {
      toast.error('Download failed')
    }
  }

  return (
    <div className="space-y-3">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-sm font-medium text-slate-700 dark:text-slate-300">
          <Paperclip className="h-4 w-4" />
          <span>Attachments {attachments.length > 0 && `(${attachments.length})`}</span>
        </div>
        <button
          onClick={() => fileInputRef.current?.click()}
          disabled={uploading || !entityId}
          className="flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-40 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700"
        >
          {uploading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Upload className="h-3.5 w-3.5" />}
          Upload
        </button>
        <input
          ref={fileInputRef}
          type="file"
          multiple
          className="hidden"
          onChange={handleFileInput}
        />
      </div>

      {/* Drop zone */}
      <div
        onDragOver={(e) => { e.preventDefault(); setDragOver(true) }}
        onDragLeave={() => setDragOver(false)}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
        className={`flex cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed p-4 transition-colors ${
          dragOver
            ? 'border-blue-400 bg-blue-50 dark:border-blue-500 dark:bg-blue-900/20'
            : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50 dark:border-slate-700 dark:hover:border-slate-600 dark:hover:bg-slate-800/50'
        }`}
      >
        <Upload className="h-5 w-5 text-slate-400" />
        <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">Drop files here or click to browse</p>
        <p className="text-[10px] text-slate-400 dark:text-slate-500">Max {MAX_SIZE_MB}MB per file</p>
      </div>

      {/* Loading */}
      {loading && (
        <div className="flex items-center justify-center py-4">
          <Loader2 className="h-5 w-5 animate-spin text-slate-400" />
        </div>
      )}

      {/* Empty */}
      {!loading && loaded && attachments.length === 0 && (
        <p className="py-2 text-center text-xs text-slate-400 dark:text-slate-500">No attachments yet</p>
      )}

      {/* List */}
      {attachments.length > 0 && (
        <ul className="space-y-1">
          {attachments.map((att) => {
            const Icon = fileIcon(att.mime_type)
            return (
              <li
                key={att.id}
                className="group flex items-center gap-2 rounded-lg border border-slate-100 bg-slate-50 px-3 py-2 dark:border-slate-700 dark:bg-slate-800"
              >
                <Icon className="h-4 w-4 shrink-0 text-slate-400" />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-xs font-medium text-slate-700 dark:text-slate-300">{att.filename}</p>
                  <p className="text-[10px] text-slate-400">{formatBytes(att.file_size)}</p>
                </div>
                <div className="flex shrink-0 items-center gap-1 opacity-0 transition-opacity group-hover:opacity-100">
                  <button
                    onClick={() => downloadAttachment(att.id, att.filename)}
                    className="rounded p-1 text-slate-400 hover:bg-slate-200 hover:text-slate-600 dark:hover:bg-slate-700 dark:hover:text-slate-300"
                    title="Download"
                  >
                    <Download className="h-3.5 w-3.5" />
                  </button>
                  <button
                    onClick={() => deleteAttachment(att.id)}
                    className="rounded p-1 text-slate-400 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-900/20 dark:hover:text-red-400"
                    title="Delete"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}
