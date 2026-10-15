/**
 * Pick the first image file out of a drag-and-drop `DataTransfer`. Returns the
 * first entry in `dataTransfer.files` whose MIME type starts with `image/`, or
 * `undefined` when there is no `DataTransfer` or it carries no image file.
 * Pure (no React, no DOM side effects) so it can be unit-tested directly.
 */
export function pickImageFile(
  dataTransfer: DataTransfer | null,
): File | undefined {
  const files = dataTransfer?.files
  if (!files) return undefined
  for (let i = 0; i < files.length; i++) {
    const file = files[i]
    if (file && file.type.startsWith('image/')) return file
  }
  return undefined
}
