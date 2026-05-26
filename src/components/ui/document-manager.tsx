'use client'

import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'
import { 
  FileText, Image, FileCode, File, UploadCloud, 
  Trash2, Download, Loader2, RefreshCw 
} from 'lucide-react'

interface DocumentManagerProps {
  clienteId: string
  proyectoId?: string
  pathType: 'project' | 'global'
}

interface StorageFile {
  name: string
  id: string
  updated_at: string
  created_at: string
  metadata?: {
    size: number
    mimetype: string
  }
}

export function DocumentManager({ clienteId, proyectoId, pathType }: DocumentManagerProps) {
  const [files, setFiles] = useState<StorageFile[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isUploading, setIsUploading] = useState(false)
  const [isDragOver, setIsDragOver] = useState(false)

  // Construct the target folder path inside the bucket
  const folderPath = pathType === 'project' && proyectoId
    ? `${clienteId}/${proyectoId}`
    : `${clienteId}/global`

  const supabase = createClient()

  // Fetch the files inside the folder
  const fetchFiles = useCallback(async () => {
    if (!clienteId) return
    setIsLoading(true)
    try {
      const { data, error } = await supabase.storage
        .from('clientes-assets')
        .list(folderPath, {
          limit: 100,
          offset: 0,
          sortBy: { column: 'name', order: 'asc' }
        })

      if (error) {
        // Folder might not exist yet, which is fine
        if (error.message !== 'The resource was not found') {
          console.error('Error fetching files:', error)
        }
        setFiles([])
      } else {
        // Filter out any default system folder placeholders
        const filtered = (data || []).filter(file => file.name !== '.emptyFolderPlaceholder')
        setFiles(filtered as StorageFile[])
      }
    } catch (err) {
      console.error(err)
    } finally {
      setIsLoading(false)
    }
  }, [clienteId, folderPath, supabase])

  useEffect(() => {
    fetchFiles()
  }, [fetchFiles])

  // Get file size string
  const formatBytes = (bytes?: number) => {
    if (bytes === undefined || bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  // Get file icon based on name
  const getFileIcon = (fileName: string) => {
    const ext = fileName.split('.').pop()?.toLowerCase()
    switch (ext) {
      case 'md':
      case 'txt':
        return <FileText className="text-emerald-500 w-5 h-5" />
      case 'json':
        return <FileCode className="text-amber-500 w-5 h-5" />
      case 'jpg':
      case 'jpeg':
      case 'png':
      case 'gif':
      case 'svg':
      case 'webp':
        return <Image className="text-blue-500 w-5 h-5" />
      default:
        return <File className="text-gray-500 w-5 h-5" />
    }
  }

  // Handle uploading files
  const handleUpload = async (uploadFiles: FileList | null) => {
    if (!uploadFiles || uploadFiles.length === 0) return
    const file = uploadFiles[0]

    // 1. Strict Client Size Limit Check (2MB max)
    if (file.size > 2 * 1024 * 1024) {
      toast.error(`Error: "${file.name}" supera el límite de 2 MB (${(file.size / 1024 / 1024).toFixed(2)} MB).`)
      return
    }

    setIsUploading(true)
    const filePath = `${folderPath}/${file.name}`

    try {
      const { error } = await supabase.storage
        .from('clientes-assets')
        .upload(filePath, file, { upsert: true })

      if (error) throw error

      toast.success(`Archivo "${file.name}" subido con éxito.`)
      fetchFiles()
    } catch (err: any) {
      console.error(err)
      toast.error('Error al subir el archivo: ' + (err.message || 'Error desconocido'))
    } finally {
      setIsUploading(false)
    }
  }

  // Handle file deletion
  const handleDelete = async (fileName: string) => {
    if (!window.confirm(`¿Estás seguro de que deseas eliminar el archivo "${fileName}"?`)) return
    
    const filePath = `${folderPath}/${fileName}`
    try {
      const { error } = await supabase.storage
        .from('clientes-assets')
        .remove([filePath])

      if (error) throw error

      toast.success(`Archivo "${fileName}" eliminado.`)
      fetchFiles()
    } catch (err: any) {
      console.error(err)
      toast.error('Error al eliminar el archivo: ' + (err.message || 'Error desconocido'))
    }
  }

  // Handle secure authenticated file download via signed URL
  const handleDownload = async (fileName: string) => {
    const filePath = `${folderPath}/${fileName}`
    try {
      const { data, error } = await supabase.storage
        .from('clientes-assets')
        .createSignedUrl(filePath, 60) // Signed link active for 60 seconds

      if (error) throw error
      if (data?.signedUrl) {
        window.open(data.signedUrl, '_blank')
      }
    } catch (err: any) {
      console.error(err)
      toast.error('Error al descargar el archivo: ' + (err.message || 'Error de permisos'))
    }
  }

  // Drag and Drop events
  const onDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(true)
  }

  const onDragLeave = () => {
    setIsDragOver(false)
  }

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(false)
    handleUpload(e.dataTransfer.files)
  }

  return (
    <div className="bg-white rounded-[14px] border-[0.8px] border-gray-200 p-6 shadow-sm space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-[14px] font-bold text-gray-900 flex items-center gap-1.5">
            {pathType === 'project' ? 'Documentos del Proyecto' : 'Documentos Globales del Cliente'}
          </h3>
          <p className="text-[11px] text-gray-500 mt-0.5">Bucket privado · Máx 2 MB por archivo</p>
        </div>
        <button
          onClick={fetchFiles}
          disabled={isLoading}
          className="text-gray-400 hover:text-gray-600 transition-colors p-1.5 rounded-md hover:bg-gray-50 disabled:opacity-50"
          title="Sincronizar archivos"
        >
          <RefreshCw size={14} className={isLoading ? 'animate-spin' : ''} />
        </button>
      </div>

      {/* Drag & Drop Upload Zone */}
      <div
        onDragOver={onDragOver}
        onDragLeave={onDragLeave}
        onDrop={onDrop}
        className={`border-2 border-dashed rounded-[10px] p-6 text-center transition-all cursor-pointer relative ${
          isDragOver
            ? 'border-[#E8193C] bg-red-50/20'
            : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50/50'
        }`}
      >
        <input
          type="file"
          id={`doc-upload-${pathType}`}
          className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
          onChange={e => handleUpload(e.target.files)}
          disabled={isUploading}
        />
        
        <div className="flex flex-col items-center justify-center space-y-2">
          {isUploading ? (
            <>
              <Loader2 className="w-8 h-8 text-[#E8193C] animate-spin" />
              <p className="text-[13px] font-medium text-gray-700">Subiendo documento...</p>
            </>
          ) : (
            <>
              <UploadCloud className="w-8 h-8 text-gray-400" />
              <div>
                <p className="text-[13px] font-semibold text-gray-700">
                  Arrastra un archivo aquí o <span className="text-[#E8193C] underline">búscalo</span>
                </p>
                <p className="text-[11px] text-gray-400 mt-1">Soporta cualquier extensión (.pdf, .png, .txt, .json, etc.)</p>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Files List */}
      {isLoading ? (
        <div className="space-y-2">
          {[1, 2].map(i => (
            <div key={i} className="h-12 bg-gray-50 rounded-lg animate-pulse border border-gray-100" />
          ))}
        </div>
      ) : files.length === 0 ? (
        <div className="text-center py-6 text-gray-400 text-[12px] italic border border-dashed border-gray-100 rounded-lg bg-gray-50/50">
          No hay documentos subidos en esta carpeta.
        </div>
      ) : (
        <div className="space-y-2 max-h-[220px] overflow-y-auto pr-1">
          {files.map(file => (
            <div
              key={file.name}
              className="flex items-center justify-between p-2.5 rounded-lg border border-gray-100 hover:border-gray-200 bg-[#F9FAFB] hover:bg-white transition-all group"
            >
              <div className="flex items-center gap-2.5 min-w-0 flex-1">
                <div className="shrink-0">{getFileIcon(file.name)}</div>
                <div className="min-w-0">
                  <p className="text-[12.5px] font-medium text-gray-700 truncate pr-2" title={file.name}>
                    {file.name}
                  </p>
                  <p className="text-[10px] text-gray-400 mt-0.5">
                    {formatBytes(file.metadata?.size)}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                <button
                  onClick={() => handleDownload(file.name)}
                  className="text-gray-400 hover:text-gray-700 p-1 bg-white hover:bg-gray-50 rounded border border-gray-100 shadow-sm"
                  title="Descargar archivo de forma segura"
                >
                  <Download size={13} />
                </button>
                <button
                  onClick={() => handleDelete(file.name)}
                  className="text-gray-400 hover:text-red-500 p-1 bg-white hover:bg-gray-50 rounded border border-gray-100 shadow-sm"
                  title="Eliminar archivo"
                >
                  <Trash2 size={13} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
