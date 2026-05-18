import { Component } from 'react'

export default class ErrorBoundary extends Component {
  state = { error: null }

  static getDerivedStateFromError(error) {
    return { error }
  }

  componentDidCatch(error, info) {
    console.error('ErrorBoundary caught:', error, info)
  }

  render() {
    if (this.state.error) {
      return (
        <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-red-500/30 rounded-xl p-6 max-w-lg w-full">
            <h2 className="text-lg font-bold text-red-400 mb-2">Erro ao carregar pagina</h2>
            <pre className="text-sm text-slate-400 whitespace-pre-wrap break-words bg-slate-800 p-3 rounded-lg overflow-auto max-h-60">
              {this.state.error.message || String(this.state.error)}
            </pre>
            <button
              onClick={() => this.setState({ error: null })}
              className="mt-4 px-4 py-2 bg-violet-600 hover:bg-violet-500 text-white rounded-lg text-sm font-medium transition-colors"
            >
              Tentar novamente
            </button>
          </div>
        </div>
      )
    }
    return this.props.children
  }
}
