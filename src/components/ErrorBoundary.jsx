import React from 'react'

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props)
    this.state = { hasError: false, error: null, errorInfo: null }
  }

  static getDerivedStateFromError(error) {
    return { hasError: true }
  }

  componentDidCatch(error, errorInfo) {
    console.error('Error Boundary caught an error:', error, errorInfo)
    this.setState({
      error: error,
      errorInfo: errorInfo
    })
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          padding: '2rem',
          background: '#fee2e2',
          border: '1px solid #fecaca',
          borderRadius: '8px',
          margin: '2rem',
          fontFamily: 'monospace'
        }}>
          <h2 style={{ color: '#dc2626', marginBottom: '1rem' }}>
            🚨 Something went wrong
          </h2>
          <details style={{ whiteSpace: 'pre-wrap' }}>
            <summary style={{ cursor: 'pointer', marginBottom: '1rem' }}>
              Click to see error details
            </summary>
            <div style={{ background: '#fef2f2', padding: '1rem', borderRadius: '4px' }}>
              <strong>Error:</strong> {this.state.error && this.state.error.toString()}
              <br />
              <strong>Component Stack:</strong>
              {this.state.errorInfo?.componentStack || 'No stack trace available'}
            </div>
          </details>
          <button 
            onClick={() => window.location.reload()}
            style={{
              marginTop: '1rem',
              padding: '0.5rem 1rem',
              background: '#dc2626',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer'
            }}
          >
            Reload Page
          </button>
        </div>
      )
    }

    return this.props.children
  }
}

export default ErrorBoundary
