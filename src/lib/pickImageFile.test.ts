import { describe, expect, it } from 'vitest'

import { pickImageFile } from './pickImageFile'

/**
 * Build a minimal `DataTransfer`-like object carrying the given files. jsdom's
 * `DataTransfer` does not let us populate `.files`, so we hand-roll the shape
 * the pure function reads (a `files` FileList-like with length + index access).
 */
function transferWith(files: File[]): DataTransfer {
  const list = {
    length: files.length,
    item: (i: number) => files[i] ?? null,
  } as unknown as FileList
  for (let i = 0; i < files.length; i++) {
    ;(list as unknown as Record<number, File>)[i] = files[i]
  }
  return { files: list } as unknown as DataTransfer
}

const imageFile = (name: string) =>
  new File(['x'], name, { type: 'image/png' })
const textFile = (name: string) =>
  new File(['x'], name, { type: 'text/plain' })

describe('pickImageFile', () => {
  it('returns the first image file', () => {
    const img = imageFile('a.png')
    expect(pickImageFile(transferWith([img]))).toBe(img)
  })

  it('returns undefined for a null DataTransfer', () => {
    expect(pickImageFile(null)).toBeUndefined()
  })

  it('returns undefined when no files are present', () => {
    expect(pickImageFile(transferWith([]))).toBeUndefined()
  })

  it('returns undefined when no file is an image', () => {
    expect(pickImageFile(transferWith([textFile('a.txt')]))).toBeUndefined()
  })

  it('returns the first image when files are mixed', () => {
    const img = imageFile('photo.png')
    const result = pickImageFile(transferWith([textFile('a.txt'), img]))
    expect(result).toBe(img)
  })
})
