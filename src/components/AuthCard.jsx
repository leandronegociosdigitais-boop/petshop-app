import { PawPrint } from 'lucide-react'

export default function AuthCard({ title, description, children }) {
  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-950 px-4 py-8">
      <div className="w-full max-w-md rounded-2xl border border-slate-800 bg-slate-900 p-8 shadow-2xl">
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-violet-500/10">
            <PawPrint className="h-8 w-8 text-violet-400" />
          </div>
          <h1 className="text-2xl font-bold text-slate-100">{title}</h1>
          <p className="mt-2 text-sm text-slate-400">{description}</p>
        </div>
        {children}
      </div>
    </main>
  )
}
