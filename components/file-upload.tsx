'use client';

import { useState, useRef, useCallback } from 'react';
import { Upload, X, Loader2, CheckCircle2, AlertCircle, Image as ImageIcon, FileText, File } from 'lucide-react';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'motion/react';

interface FileUploadProps {
  onUpload: (file: File) => Promise<void>;
  accept?: string;
  maxSizeMB?: number;
  className?: string;
  disabled?: boolean;
}

interface UploadingFile {
  file: File;
  progress: number;
  status: 'uploading' | 'complete' | 'error';
  error?: string;
}

export function FileUpload({ onUpload, accept, maxSizeMB = 25, className, disabled }: FileUploadProps) {
  const [isDragOver, setIsDragOver] = useState(false);
  const [uploadingFiles, setUploadingFiles] = useState<UploadingFile[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFiles = useCallback(async (files: FileList | null) => {
    if (!files || files.length === 0) return;

    for (const file of Array.from(files)) {
      if (maxSizeMB && file.size > maxSizeMB * 1024 * 1024) {
        setUploadingFiles(prev => [...prev, { file, progress: 0, status: 'error', error: `File exceeds ${maxSizeMB}MB limit` }]);
        continue;
      }

      const entry: UploadingFile = { file, progress: 0, status: 'uploading' };
      setUploadingFiles(prev => [...prev, entry]);

      try {
        await onUpload(file);
        setUploadingFiles(prev => prev.map(f => f.file === file ? { ...f, progress: 100, status: 'complete' } : f));
        setTimeout(() => {
          setUploadingFiles(prev => prev.filter(f => f.file !== file));
        }, 2000);
      } catch {
        setUploadingFiles(prev => prev.map(f => f.file === file ? { ...f, status: 'error', error: 'Upload failed' } : f));
      }
    }
  }, [onUpload, maxSizeMB]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    if (!disabled) handleFiles(e.dataTransfer.files);
  }, [disabled, handleFiles]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    if (!disabled) setIsDragOver(true);
  }, [disabled]);

  const formatSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  return (
    <div className={cn('space-y-3', className)}>
      <div
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={() => setIsDragOver(false)}
        onClick={() => !disabled && inputRef.current?.click()}
        className={cn(
          'border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors',
          isDragOver ? 'border-[#6c5ce7] bg-[#6c5ce7]/10' : 'border-white/10 hover:border-white/20 bg-white/[0.02]',
          disabled && 'opacity-50 cursor-not-allowed'
        )}
      >
        <Upload className="w-8 h-8 mx-auto mb-2 text-white/30" />
        <p className="text-sm text-white/50">
          Drop files here or <span className="text-[#6c5ce7]">browse</span>
        </p>
        <p className="text-xs text-white/30 mt-1">Max {maxSizeMB}MB per file</p>
        <input
          ref={inputRef}
          type="file"
          className="hidden"
          accept={accept}
          multiple
          onChange={e => handleFiles(e.target.files)}
        />
      </div>

      <AnimatePresence>
        {uploadingFiles.map((uf, i) => (
          <motion.div
            key={`${uf.file.name}-${i}`}
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="flex items-center gap-3 p-2 rounded-lg bg-white/[0.03]"
          >
            {uf.status === 'uploading' && <Loader2 className="w-4 h-4 text-[#6c5ce7] animate-spin shrink-0" />}
            {uf.status === 'complete' && <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />}
            {uf.status === 'error' && <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />}
            <div className="flex-1 min-w-0">
              <p className="text-xs text-white/70 truncate">{uf.file.name}</p>
              <p className="text-xs text-white/30">{formatSize(uf.file.size)}</p>
            </div>
            {uf.status === 'error' && (
              <button
                onClick={() => setUploadingFiles(prev => prev.filter(f => f !== uf))}
                className="text-white/30 hover:text-white/60"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}

export function FileIcon({ contentType }: { contentType: string }) {
  if (contentType.startsWith('image/')) return <ImageIcon className="h-4 w-4 text-blue-400" />;
  if (contentType.includes('pdf')) return <FileText className="h-4 w-4 text-red-400" />;
  return <File className="h-4 w-4 text-zinc-400" />;
}

export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}
