import { Link } from 'react-router-dom'

export function NotFoundPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-50 px-4">
      <section className="rounded-lg border border-slate-200 bg-white p-6 text-center">
        <h1 className="text-2xl font-bold text-slate-950">Page not found</h1>
        <Link className="mt-4 inline-flex rounded-lg bg-slate-950 px-4 py-2 text-sm font-semibold text-white" to="/">
          Back to registration
        </Link>
      </section>
    </main>
  )
}
