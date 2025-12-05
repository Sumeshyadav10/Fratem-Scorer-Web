import React from 'react';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { 
      hasError: false, 
      error: null, 
      errorInfo: null,
      retryCount: 0
    };
  }

  static getDerivedStateFromError(error) {
    // Update state so the next render will show the fallback UI
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    console.error('🚨 Error Boundary caught an error:', {
      error: error.message,
      stack: error.stack,
      componentStack: errorInfo.componentStack,
      timestamp: new Date().toISOString()
    });

    this.setState({
      error,
      errorInfo
    });

    // Optional: Log error to external service
    // this.logErrorToService(error, errorInfo);
  }

  handleRetry = () => {
    const newRetryCount = this.state.retryCount + 1;
    
    console.log(`🔄 Attempting error recovery - Retry ${newRetryCount}`);
    
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
      retryCount: newRetryCount
    });

    // Optional: Reload the page if too many retries
    if (newRetryCount >= 3) {
      console.warn('🔄 Too many retries, reloading page...');
      window.location.reload();
    }
  };

  handleReload = () => {
    console.log('🔄 User requested page reload due to error');
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="error-boundary-container" style={{
          padding: '20px',
          margin: '20px',
          border: '2px solid #ff6b6b',
          borderRadius: '8px',
          backgroundColor: '#ffe0e0',
          textAlign: 'center',
          fontFamily: 'Arial, sans-serif'
        }}>
          <div style={{ marginBottom: '20px' }}>
            <h2 style={{ color: '#d63031', marginBottom: '10px' }}>
              🚨 Cricket Scorer Error
            </h2>
            <p style={{ color: '#636e72', marginBottom: '15px' }}>
              Something went wrong with the cricket scoring system. Don't worry - your match data is safe!
            </p>
          </div>

          <div style={{ 
            backgroundColor: '#fff', 
            padding: '15px', 
            borderRadius: '5px', 
            marginBottom: '20px',
            textAlign: 'left',
            border: '1px solid #ddd'
          }}>
            <h4 style={{ color: '#2d3436', marginBottom: '10px' }}>Error Details:</h4>
            <p style={{ 
              fontFamily: 'monospace', 
              fontSize: '12px', 
              color: '#e17055',
              wordBreak: 'break-word'
            }}>
              {this.state.error && this.state.error.message}
            </p>
            
            {process.env.NODE_ENV === 'development' && (
              <details style={{ marginTop: '10px' }}>
                <summary style={{ cursor: 'pointer', color: '#0984e3' }}>
                  Technical Details (Development Mode)
                </summary>
                <pre style={{ 
                  fontSize: '10px', 
                  backgroundColor: '#f8f9fa', 
                  padding: '10px', 
                  marginTop: '10px',
                  overflow: 'auto',
                  maxHeight: '200px'
                }}>
                  {this.state.error && this.state.error.stack}
                </pre>
              </details>
            )}
          </div>

          <div style={{ display: 'flex', gap: '10px', justifyContent: 'center' }}>
            <button 
              onClick={this.handleRetry}
              style={{
                backgroundColor: '#00b894',
                color: 'white',
                border: 'none',
                padding: '10px 20px',
                borderRadius: '5px',
                cursor: 'pointer',
                fontSize: '14px'
              }}
              onMouseOver={(e) => e.target.style.backgroundColor = '#00a085'}
              onMouseOut={(e) => e.target.style.backgroundColor = '#00b894'}
            >
              🔄 Try Again {this.state.retryCount > 0 && `(${this.state.retryCount})`}
            </button>
            
            <button 
              onClick={this.handleReload}
              style={{
                backgroundColor: '#0984e3',
                color: 'white',
                border: 'none',
                padding: '10px 20px',
                borderRadius: '5px',
                cursor: 'pointer',
                fontSize: '14px'
              }}
              onMouseOver={(e) => e.target.style.backgroundColor = '#0770c4'}
              onMouseOut={(e) => e.target.style.backgroundColor = '#0984e3'}
            >
              🔄 Reload Page
            </button>
          </div>

          <div style={{ 
            marginTop: '20px', 
            padding: '10px', 
            backgroundColor: '#e8f4f8', 
            borderRadius: '5px' 
          }}>
            <p style={{ 
              fontSize: '12px', 
              color: '#636e72', 
              margin: 0 
            }}>
              💡 <strong>What to do:</strong> Try clicking "Try Again" first. If the error persists, 
              click "Reload Page". Your match progress should be automatically saved.
            </p>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;