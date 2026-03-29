import { Component } from 'react'
import { AlertOctagon, RefreshCw } from 'lucide-react'

export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error }
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null })
    if (this.props.onReset) this.props.onReset()
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex flex-col items-center justify-center py-16 px-6 text-center">
          <div className="w-14 h-14 rounded-xl bg-red-500/10 border border-red-500/20 flex items-center justify-center mb-4">
            <AlertOctagon size={24} className="text-red-400" />
          </div>
          <h3 className="text-lg font-semibold text-white mb-2">Something went wrong</h3>
          <p className="text-sm text-steel max-w-md mb-1">
            {this.state.error?.message || 'An unexpected error occurred.'}
          </p>
          <p className="text-xs text-steel/50 font-mono mb-6 max-w-lg break-all">
            {this.state.error?.stack?.split('\n')[0] || ''}
          </p>
          <button
            onClick={this.handleReset}
            className="flex items-center gap-2 px-4 py-2 bg-neon/10 border border-neon/20 text-neon rounded-lg hover:bg-neon/20 transition-colors text-sm font-medium"
          >
            <RefreshCw size={14} />
            Try Again
          </button>
        </div>
      )
    }

    return this.props.children
  }
}
