export async function runOcrStub(imageUrl: string) {
  return {
    text: `Serving Size 1 Tablet\nVitamin C 500 mg 556%\nVitamin D 20 mcg 100%\nCalcium 200 mg 15%`,
    confidence: 0.8,
  }
}
