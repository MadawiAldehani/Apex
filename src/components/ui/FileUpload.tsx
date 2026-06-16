'use client'
import { useRef, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Upload, X, FileText, Loader2, ImageIcon } from 'lucide-react'

/** Convert HEIC/HEIF files to JPEG so all browsers can display them */
async function convertHeicToJpeg(file: File): Promise<File> {
  const isHeic =
    file.type === 'image/heic' ||
    file.type === 'image/heif' ||
    /\.(heic|heif)$/i.test(file.name)
  if (!isHeic) return file
  try {
    const heic2any = (await import('heic2any')).default
    const blob = await heic2any({ blob: file, toType: 'image/jpeg', quality: 0.92 }) as Blob
    const jpegName = file.name.replace(/\.(heic|heif)$/i, '.jpg')
    return new File([blob], jpegName, { type: 'image/jpeg' })
  } catch {
    // Conversion failed — upload original and let the browser handle it
    return file
  }
}

interface FileUploadProps {
  userId: string
  /** Bucket folder path, e.g. "profile", "food", "body", "inbody" */
  folder: string
  /** Accepted MIME types / extensions string, e.g. "image/*" or "image/*,.pdf" */
  accept?: string
  label?: string
  /** Existing URL to show on mount */
  currentUrl?: string | null
  /** Called with the new public URL after a successful upload */
  onUpload: (publicUrl: string) => void
  /** Called when user clears the file */
  onClear?: () => void
  /** Extra Tailwind classes on the outer wrapper */
  className?: string
  /** Compact mode: just a button, no drag zone */
  compact?: boolean
}

function isPDF(url: string) {
  return url.toLowerCase().includes('.pdf') || url.toLowerCase().includes('application/pdf')
}

export default function FileUpload({
  userId,
  folder,
  accept = 'image/*',
  label = 'Upload file',
  currentUrl,
  onUpload,
  onClear,
  className = '',
  compact = false,
}: FileUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [uploading, setUploading] = useState(false)
  const [preview, setPreview] = useState<string | null>(currentUrl ?? null)
  const [fileName, setFileName] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const handleFile = async (file: File) => {
    if (!file) return
    setError(null)

    // Convert HEIC → JPEG before anything else
    const processedFile = await convertHeicToJpeg(file)
    setFileName(processedFile.name)

    // Show local preview for images
    if (processedFile.type.startsWith('image/')) {
      const reader = new FileReader()
      reader.onload = (e) => setPreview(e.target?.result as string)
      reader.readAsDataURL(processedFile)
    } else {
      setPreview(null)
    }

    setUploading(true)
    try {
      const supabase = createClient()
      const ext = processedFile.name.split('.').pop() ?? 'bin'
      const path = `${folder}/${userId}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`

      const { error: uploadError } = await supabase.storage
        .from('tracking-progress')
        .upload(path, processedFile, { upsert: true })

      if (uploadError) throw uploadError

      const { data } = supabase.storage.from('tracking-progress').getPublicUrl(path)
      onUpload(data.publicUrl)
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Upload failed'
      setError(msg)
      setPreview(null)
      setFileName(null)
    } finally {
      setUploading(false)
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) handleFile(file)
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    const file = e.dataTransfer.files?.[0]
    if (file) handleFile(file)
  }

  const clear = () => {
    setPreview(null)
    setFileName(null)
    setError(null)
    if (inputRef.current) inputRef.current.value = ''
    onClear?.()
  }

  // ─── compact mode: just an upload icon button ───────────────────────────
  if (compact) {
    return (
      <div className={`relative ${className}`}>
        <input
          ref={inputRef}
          type="file"
          accept={accept}
          className="sr-only"
          onChange={handleChange}
        />
        {preview ? (
          <div className="relative group">
            {preview && !isPDF(preview) ? (
              <img
                src={preview}
                alt="Upload preview"
                className="w-16 h-16 rounded-xl object-cover border border-[rgb(var(--border))]"
              />
            ) : (
              <div className="w-16 h-16 rounded-xl border border-[rgb(var(--border))] flex items-center justify-center bg-[rgb(var(--muted))]">
                <FileText size={20} className="text-[rgb(var(--muted-foreground))]" />
              </div>
            )}
            <button
              type="button"
              onClick={clear}
              className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-red-500 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
            >
              <X size={10} />
            </button>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            disabled={uploading}
            className="w-10 h-10 rounded-xl border border-dashed border-[rgb(var(--border))] flex items-center justify-center text-[rgb(var(--muted-foreground))] hover:border-emerald-500 hover:text-emerald-500 transition-colors"
            title={label}
          >
            {uploading ? <Loader2 size={14} className="animate-spin" /> : <ImageIcon size={14} />}
          </button>
        )}
        {error && <p className="text-xs text-red-500 mt-1">{error}</p>}
      </div>
    )
  }

  // ─── full drop-zone mode ──────────────────────────────────────────────────
  return (
    <div className={className}>
      <input
        ref={inputRef}
        type="file"
        accept={accept}
        className="sr-only"
        onChange={handleChange}
      />

      {/* Drop zone (only shown when no file selected) */}
      {!preview && !fileName && (
        <div
          onDragOver={(e) => e.preventDefault()}
          onDrop={handleDrop}
          onClick={() => inputRef.current?.click()}
          className="flex flex-col items-center justify-center gap-2 p-6 border-2 border-dashed border-[rgb(var(--border))] rounded-2xl cursor-pointer hover:border-emerald-500 hover:bg-emerald-50/40 dark:hover:bg-emerald-900/10 transition-all"
        >
          {uploading ? (
            <Loader2 size={22} className="text-emerald-500 animate-spin" />
          ) : (
            <Upload size={22} className="text-[rgb(var(--muted-foreground))]" />
          )}
          <p className="text-sm font-medium text-[rgb(var(--foreground))]">{label}</p>
          <p className="text-xs text-[rgb(var(--muted-foreground))]">
            {accept?.includes('pdf') ? 'Images & PDFs • max 50 MB' : 'JPG, PNG, WEBP, HEIC • max 50 MB'}
          </p>
        </div>
      )}

      {/* Preview / result */}
      {(preview || fileName) && (
        <div className="relative group rounded-2xl overflow-hidden border border-[rgb(var(--border))]">
          {preview && !isPDF(preview) ? (
            <img
              src={preview}
              alt="Uploaded preview"
              className="w-full max-h-48 object-cover"
            />
          ) : (
            <div className="flex items-center gap-3 p-4 bg-[rgb(var(--muted))]">
              <FileText size={28} className="text-red-500 shrink-0" />
              <div className="min-w-0">
                <p className="text-sm font-medium text-[rgb(var(--foreground))] truncate">{fileName}</p>
                <p className="text-xs text-[rgb(var(--muted-foreground))]">PDF document</p>
              </div>
            </div>
          )}
          {uploading && (
            <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
              <Loader2 size={24} className="text-white animate-spin" />
            </div>
          )}
          <button
            type="button"
            onClick={clear}
            className="absolute top-2 right-2 w-7 h-7 rounded-full bg-black/60 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600"
          >
            <X size={12} />
          </button>
        </div>
      )}

      {error && <p className="text-xs text-red-500 mt-1">{error}</p>}
    </div>
  )
}
