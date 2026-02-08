export type OcrResult = { text: string; confidence?: number }

export async function runOcr(imageUrl: string): Promise<OcrResult> {
  // TODO: replace with provider implementation (e.g., Google Vision)
  const { runOcrStub } = await import('./stub')
  return runOcrStub(imageUrl)
}
