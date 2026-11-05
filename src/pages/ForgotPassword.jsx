import { useState } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import AuthCard from '../components/AuthCard'

export default function ForgotPassword() {
  const [email, setEmail] = useState('')
  const [sending, setSending] = useState(false)
  const [sent, setSent] = useState(false)
  const [error, setError] = useState('')

  async function handleSubmit(event) {
    event.preventDefault()
    if (sending) return
    setSending(true)
    setError('')
    try {
      const { error: requestError } = await supabase.auth.resetPasswordForEmail(email.trim(), {
        redirectTo: `${window.location.origin}/redefinir-senha`,
      })
      if (requestError) throw requestError
      setSent(true)
    } catch (requestError) {
      setError(requestError.status === 429
        ? 'Aguarde alguns minutos antes de solicitar outro link.'
        : 'Não foi possível enviar o link agora. Tente novamente em alguns minutos.')
    } finally {
      setSending(false)
    }
  }

  return (
    <AuthCard title="Recuperar acesso" description="Receba um link para criar uma nova senha.">
      {sent ? (
        <div role="status" className="rounded-lg border border-emerald-500/20 bg-emerald-500/10 p-4 text-sm text-emerald-300">
          Se houver uma conta com esse e-mail, você receberá um link de recuperação. Confira também a pasta de spam.
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label htmlFor="recovery-email" className="mb-2 block text-sm font-medium text-slate-300">E-mail de acesso</label>
            <input id="recovery-email" type="email" autoComplete="email" required value={email} onChange={event => setEmail(event.target.value)} disabled={sending}
              className="w-full rounded-lg border border-slate-700 bg-slate-800 px-4 py-3 text-slate-100 focus:outline-none focus:ring-2 focus:ring-violet-500" />
          </div>
          {error && <p role="alert" className="text-sm text-red-400">{error}</p>}
          <button type="submit" disabled={sending} className="w-full rounded-lg bg-violet-600 px-4 py-3 font-semibold text-white hover:bg-violet-500 disabled:opacity-50">
            {sending ? 'Enviando...' : 'Enviar link de recuperação'}
          </button>
        </form>
      )}
      <Link to="/login" className="mt-6 block text-center text-sm text-violet-400 hover:text-violet-300">Voltar ao login</Link>
    </AuthCard>
  )
}
