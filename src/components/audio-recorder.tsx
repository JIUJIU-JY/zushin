'use client'

import { useEffect, useRef, useState } from 'react'
import { Mic, Square, Upload, Trash2, RotateCcw } from 'lucide-react'

export type AudioChange =
  | { kind: 'new'; blob: Blob; ext: string }
  | { kind: 'removed' }

const MAX_AUDIO_SIZE = 20 * 1024 * 1024

export default function AudioRecorder({
  existingUrl,
  onChange,
}: {
  existingUrl?: string | null
  onChange: (c: AudioChange) => void
}) {
  const [recording, setRecording] = useState(false)
  const [newUrl, setNewUrl] = useState<string | null>(null)
  const [clearedExisting, setClearedExisting] = useState(false)
  const [micError, setMicError] = useState('')
  const recorderRef = useRef<MediaRecorder | null>(null)
  const chunksRef = useRef<Blob[]>([])
  const fileInputRef = useRef<HTMLInputElement | null>(null)

  // 释放新录音/上传产生的预览 URL，避免内存泄漏
  useEffect(() => {
    return () => { if (newUrl) URL.revokeObjectURL(newUrl) }
  }, [newUrl])

  async function startRecording() {
    setMicError('')
    if (
      typeof navigator === 'undefined' ||
      !navigator.mediaDevices?.getUserMedia ||
      typeof MediaRecorder === 'undefined'
    ) {
      setMicError('当前浏览器不支持录音，你也可以改用上传音频文件或文字输入')
      return
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      const recorder = new MediaRecorder(stream)
      chunksRef.current = []
      recorder.ondataavailable = (e) => { if (e.data.size > 0) chunksRef.current.push(e.data) }
      recorder.onstop = () => {
        const type = recorder.mimeType || 'audio/webm'
        const blob = new Blob(chunksRef.current, { type })
        const ext = type.includes('mp4') || type.includes('aac')
          ? 'm4a'
          : type.includes('ogg') ? 'ogg' : 'webm'
        if (newUrl) URL.revokeObjectURL(newUrl)
        setNewUrl(URL.createObjectURL(blob))
        setClearedExisting(true)
        onChange({ kind: 'new', blob, ext })
        stream.getTracks().forEach((t) => t.stop())
      }
      recorderRef.current = recorder
      recorder.start()
      setRecording(true)
    } catch (err) {
      console.error('录音失败:', err)
      setMicError('无法访问麦克风，你也可以改用上传音频文件或文字输入')
    }
  }

  function stopRecording() {
    recorderRef.current?.stop()
    setRecording(false)
  }

  function onPickFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file) return
    setMicError('')
    if (!file.type.startsWith('audio/')) { setMicError('请选择音频文件'); return }
    if (file.size > MAX_AUDIO_SIZE) { setMicError('音频文件不能超过 20MB'); return }
    if (newUrl) URL.revokeObjectURL(newUrl)
    setNewUrl(URL.createObjectURL(file))
    setClearedExisting(true)
    const ext = file.name.split('.').pop()?.toLowerCase() || 'webm'
    onChange({ kind: 'new', blob: file, ext })
  }

  function onDelete() {
    if (newUrl) URL.revokeObjectURL(newUrl)
    setNewUrl(null)
    setClearedExisting(true)
    onChange({ kind: 'removed' })
  }

  const showExisting = existingUrl && !clearedExisting
  const playUrl = newUrl || (showExisting ? existingUrl : null)

  return (
    <div className="border border-gray-200 rounded-2xl p-4 bg-gray-50 space-y-3">
      {playUrl ? (
        <>
          {/* eslint-disable-next-line jsx-a11y/media-has-caption */}
          <audio controls src={playUrl} className="w-full" />
          <div className="flex flex-wrap gap-2">
            {recording ? (
              <button
                onClick={stopRecording}
                className="flex items-center gap-1 text-sm px-3 py-1.5 rounded-full border border-red-200 text-red-600"
              >
                <Square size={14} /> 停止
              </button>
            ) : (
              <button
                onClick={startRecording}
                className="flex items-center gap-1 text-sm px-3 py-1.5 rounded-full border border-gray-200 text-gray-600"
              >
                <RotateCcw size={14} /> 重新录制
              </button>
            )}
            <button
              onClick={() => fileInputRef.current?.click()}
              className="flex items-center gap-1 text-sm px-3 py-1.5 rounded-full border border-gray-200 text-gray-600"
            >
              <Upload size={14} /> 上传替换
            </button>
            <button
              onClick={onDelete}
              className="flex items-center gap-1 text-sm px-3 py-1.5 rounded-full border border-red-200 text-red-600"
            >
              <Trash2 size={14} /> 删除
            </button>
          </div>
        </>
      ) : (
        <div className="flex flex-col items-center gap-3 py-2">
          {recording ? (
            <button
              onClick={stopRecording}
              className="flex items-center gap-2 px-5 py-2.5 rounded-full bg-red-500 text-white text-sm font-medium"
            >
              <Square size={16} /> 停止录音
            </button>
          ) : (
            <button
              onClick={startRecording}
              className="flex items-center gap-2 px-5 py-2.5 rounded-full bg-indigo-600 text-white text-sm font-medium"
            >
              <Mic size={16} /> 开始录音
            </button>
          )}
          <button
            onClick={() => fileInputRef.current?.click()}
            className="flex items-center gap-1 text-sm text-indigo-600"
          >
            <Upload size={14} /> 上传音频文件
          </button>
          <p className="text-xs text-gray-400">录音或上传通话/语音，保存后作为证据</p>
        </div>
      )}

      {recording && <p className="text-xs text-red-500 text-center">● 正在录音…点“停止”结束</p>}
      {micError && <p className="text-xs text-red-500 text-center">{micError}</p>}

      <input ref={fileInputRef} type="file" accept="audio/*" className="hidden" onChange={onPickFile} />
    </div>
  )
}
