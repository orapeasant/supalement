export default function SchedulePage() {
  return (
    <div>
      <h1 className="text-2xl font-semibold mb-2">Schedule</h1>
      <p>Generate a plan in the Generate tab.</p>
      <a href="/app/schedule/generate" className="inline-block rounded bg-black text-white py-2 px-3 mt-3">Generate</a>
      <div className="mt-6 text-sm text-gray-600">
        <p>
          This app provides informational estimates based on supplement labels and may be inaccurate. It is not medical advice. Consult a healthcare professional for medical decisions.
        </p>
      </div>
    </div>
  )
}
