import imageCompression from 'browser-image-compression'
import { supabase } from '@/lib/supabase'

const COMPRESS_OPTIONS = {
  maxWidthOrHeight: 1600, // 长边最多 1600px
  maxSizeMB: 0.5, // 目标约 0.5MB
  useWebWorker: true,
}

/**
 * 把图片逐张压缩后上传到 evidence 桶，返回成功上传的路径数组。
 * 压缩失败时退回上传原图；上传失败时抛错，交给调用方处理（保持各页面原有的错误提示）。
 */
export async function uploadEvidencePhotos(files: File[], userId: string): Promise<string[]> {
  const paths: string[] = []

  for (const file of files) {
    let toUpload: File = file
    try {
      toUpload = await imageCompression(file, COMPRESS_OPTIONS)
    } catch (err) {
      // 压缩失败不阻断上传，退回原图
      console.error('图片压缩失败，改为上传原图:', err)
      toUpload = file
    }

    const ext = file.name.split('.').pop()?.toLowerCase() || 'jpg'
    const path = `${userId}/${crypto.randomUUID()}.${ext}`
    const { error } = await supabase.storage.from('evidence').upload(path, toUpload)
    if (error) {
      throw new Error('图片上传失败:' + error.message)
    }
    paths.push(path)
  }

  return paths
}
