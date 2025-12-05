import React, { useState, useEffect } from 'react';

const GlobalErrorNotification = ({ 
  errors = [], 
  onRetry, 
  onDismiss, 
  maxVisible = 3,
  autoDismissTime = 5000 
}) => {
  const [visibleErrors, setVisibleErrors] = useState([]);

  useEffect(() => {
    // Update visible errors when errors prop changes
    setVisibleErrors(errors.slice(-maxVisible));
  }, [errors, maxVisible]);

  useEffect(() => {
    // Auto-dismiss errors after specified time
    if (autoDismissTime > 0) {
      const timer = setTimeout(() => {
        if (visibleErrors.length > 0) {
          const oldestError = visibleErrors[0];
          handleDismiss(oldestError.id);
        }
      }, autoDismissTime);

      return () => clearTimeout(timer);
    }
  }, [visibleErrors, autoDismissTime]);

  const handleRetry = (error) => {
    console.log('🔄 User requested retry for error:', error.type);
    if (onRetry) {
      onRetry(error);
    }
  };

  const handleDismiss = (errorId) => {
    setVisibleErrors(prev => prev.filter(error => error.id !== errorId));
    if (onDismiss) {
      onDismiss(errorId);
    }
  };

  const getErrorIcon = (type) => {
    switch (type) {
      case 'network': return '🌐';
      case 'validation': return '⚠️';
      case 'api': return '🔴';
      case 'timeout': return '⏱️';
      case 'critical': return '🚨';
      default: return '❌';
    }
  };

  const getErrorColor = (type) => {
    switch (type) {
      case 'network': return '#3498db';
      case 'validation': return '#f39c12';
      case 'api': return '#e74c3c';
      case 'timeout': return '#9b59b6';
      case 'critical': return '#c0392b';
      default: return '#95a5a6';
    }
  };

  const getRetryAction = (error) => {
    switch (error.type) {
      case 'network':
        return 'Check Connection';
      case 'api':
        return 'Retry Request';
      case 'timeout':
        return 'Try Again';
      case 'validation':
        return 'Fix & Retry';
      default:
        return 'Retry';
    }
  };

  if (visibleErrors.length === 0) {
    return null;
  }

  return (
    <div style={{
      position: 'fixed',
      top: '20px',
      right: '20px',
      zIndex: 10000,
      display: 'flex',
      flexDirection: 'column',
      gap: '10px',
      maxWidth: '400px'
    }}>
      {visibleErrors.map((error) => (
        <div
          key={error.id}
          style={{
            backgroundColor: '#fff',
            border: `3px solid ${getErrorColor(error.type)}`,
            borderRadius: '8px',
            boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
            padding: '15px',
            animation: 'slideInRight 0.3s ease-out',
            position: 'relative'
          }}
        >
          {/* Close button */}
          <button
            onClick={() => handleDismiss(error.id)}
            style={{
              position: 'absolute',
              top: '8px',
              right: '8px',
              background: 'none',
              border: 'none',
              fontSize: '18px',
              cursor: 'pointer',
              color: '#999',
              lineHeight: 1
            }}
            title="Dismiss"
          >
            ×
          </button>

          {/* Error content */}
          <div style={{ marginRight: '20px' }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              marginBottom: '8px'
            }}>
              <span style={{ 
                fontSize: '20px', 
                marginRight: '8px' 
              }}>
                {getErrorIcon(error.type)}
              </span>
              <strong style={{ 
                color: getErrorColor(error.type),
                fontSize: '14px'
              }}>
                {error.title || 'Cricket Scorer Error'}
              </strong>
            </div>

            <p style={{
              margin: '0 0 12px 0',
              fontSize: '13px',
              color: '#444',
              lineHeight: '1.4'
            }}>
              {error.message}
            </p>

            {/* Action buttons */}
            <div style={{ 
              display: 'flex', 
              gap: '8px',
              alignItems: 'center'
            }}>
              {error.retryable && (
                <button
                  onClick={() => handleRetry(error)}
                  style={{
                    backgroundColor: getErrorColor(error.type),
                    color: 'white',
                    border: 'none',
                    padding: '6px 12px',
                    borderRadius: '4px',
                    fontSize: '12px',
                    cursor: 'pointer',
                    fontWeight: 'bold'
                  }}
                  onMouseOver={(e) => {
                    e.target.style.opacity = '0.8';
                  }}
                  onMouseOut={(e) => {
                    e.target.style.opacity = '1';
                  }}
                >
                  {getRetryAction(error)}
                </button>
              )}

              <span style={{
                fontSize: '11px',
                color: '#666'
              }}>
                {new Date(error.timestamp).toLocaleTimeString()}
              </span>
            </div>
          </div>
        </div>
      ))}

      <style jsx>{`
        @keyframes slideInRight {
          from {
            transform: translateX(100%);
            opacity: 0;
          }
          to {
            transform: translateX(0);
            opacity: 1;
          }
        }
      `}</style>
    </div>
  );
};

export default GlobalErrorNotification;