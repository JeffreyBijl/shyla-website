export interface CompressedImage {
  blob: Blob
  width: number
  height: number
  base64: string
}

const MAX_DIMENSION = 1200
const MIN_WIDTH = 400
const MAX_FILE_SIZE = 10 * 1024 * 1024 // 10 MB
const JPEG_QUALITY = 0.80

export async function compressImage(file: File): Promise<CompressedImage> {
  if (file.size > MAX_FILE_SIZE) {
    throw new Error('Bestand is te groot (maximaal 10 MB)')
  }

  const bitmap = await loadImage(file)
  let { width, height } = bitmap

  if (width < MIN_WIDTH) {
    throw new Error('Afbeelding is te klein (minimaal 400px breed)')
  }

  if (width > MAX_DIMENSION || height > MAX_DIMENSION) {
    const ratio = Math.min(MAX_DIMENSION / width, MAX_DIMENSION / height)
    width = Math.round(width * ratio)
    height = Math.round(height * ratio)
  }

  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height
  const ctx = canvas.getContext('2d')!
  ctx.drawImage(bitmap, 0, 0, width, height)

  if ('close' in bitmap) (bitmap as ImageBitmap).close()

  const blob = await new Promise<Blob>((resolve, reject) => {
    canvas.toBlob(
      b => b ? resolve(b) : reject(new Error('Compressie mislukt')),
      'image/jpeg',
      JPEG_QUALITY
    )
  })

  const base64 = await blobToBase64(blob)

  return { blob, width, height, base64 }
}

async function loadImage(file: File): Promise<ImageBitmap | HTMLImageElement> {
  if (typeof createImageBitmap === 'function') {
    try {
      return await createImageBitmap(file)
    } catch {
      // HEIC/HEIF or unsupported format — fall through
    }
  }

  return new Promise<HTMLImageElement>((resolve, reject) => {
    const img = new Image()
    img.onload = () => {
      URL.revokeObjectURL(img.src)
      resolve(img)
    }
    img.onerror = () => {
      URL.revokeObjectURL(img.src)
      reject(new Error('Dit bestandsformaat wordt niet ondersteund. Probeer een JPEG of PNG.'))
    }
    img.src = URL.createObjectURL(file)
  })
}

function blobToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onloadend = () => {
      const result = reader.result as string
      resolve(result.split(',')[1])
    }
    reader.onerror = () => reject(new Error('Kan bestand niet lezen'))
    reader.readAsDataURL(blob)
  })
}

export async function compressWithToast(file: File): Promise<{ base64: string }> {
  const { toastProgress, toastError } = await import('./toast.js')
  const toast = toastProgress('Foto verkleinen...')
  try {
    const result = await compressImage(file)
    toast.dismiss()
    return result
  } catch (err) {
    toast.dismiss()
    const msg = err instanceof Error ? err.message : 'Foto verkleinen mislukt'
    toastError(msg)
    throw err
  }
}

export function slugify(title: string): string {
  return title
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
}
