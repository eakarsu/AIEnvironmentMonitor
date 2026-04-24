import React from 'react';
import './AIAnalysisDisplay.css';

interface AIAnalysisProps {
  analysis: {
    success: boolean;
    analysis: string;
    recommendations: string[];
    severity?: string;
    confidence: number;
    rawResponse?: any;
  } | null;
  loading: boolean;
}

const AIAnalysisDisplay: React.FC<AIAnalysisProps> = ({ analysis, loading }) => {
  if (loading) {
    return (
      <div className="ai-analysis">
        <div className="ai-loading">
          <div className="ai-loading-spinner"></div>
          <p>AI is analyzing your data...</p>
          <span className="ai-loading-subtext">Using Claude Haiku 4.5 via OpenRouter</span>
        </div>
      </div>
    );
  }

  if (!analysis) {
    return null;
  }

  const getSeverityColor = (severity?: string) => {
    switch (severity?.toLowerCase()) {
      case 'low': return 'var(--accent-success)';
      case 'medium': return 'var(--accent-warning)';
      case 'high': return 'var(--accent-danger)';
      case 'critical': return 'var(--accent-purple)';
      default: return 'var(--accent-primary)';
    }
  };

  const getConfidenceLevel = (confidence: number) => {
    if (confidence >= 0.8) return { label: 'High', color: 'var(--accent-success)' };
    if (confidence >= 0.6) return { label: 'Medium', color: 'var(--accent-warning)' };
    return { label: 'Low', color: 'var(--accent-danger)' };
  };

  const confidenceInfo = getConfidenceLevel(analysis.confidence);
  const rawData = analysis.rawResponse || {};

  return (
    <div className="ai-analysis animate-fade-in">
      <div className="ai-analysis-header">
        <div className="ai-analysis-icon">🤖</div>
        <div>
          <h3 className="ai-analysis-title">AI Analysis Results</h3>
          <p className="ai-analysis-subtitle">Powered by Claude Haiku 4.5</p>
        </div>
      </div>

      {/* Status Indicators */}
      <div className="ai-status-row">
        {analysis.severity && (
          <div className="ai-status-badge" style={{ borderColor: getSeverityColor(analysis.severity) }}>
            <span className="ai-status-dot" style={{ background: getSeverityColor(analysis.severity) }}></span>
            <span>Severity: <strong>{analysis.severity}</strong></span>
          </div>
        )}
        <div className="ai-status-badge" style={{ borderColor: confidenceInfo.color }}>
          <span className="ai-status-dot" style={{ background: confidenceInfo.color }}></span>
          <span>Confidence: <strong>{(analysis.confidence * 100).toFixed(0)}%</strong></span>
        </div>
        {rawData.actionPriority && (
          <div className="ai-status-badge">
            <span>Priority: <strong>{rawData.actionPriority}</strong></span>
          </div>
        )}
      </div>

      {/* Main Analysis */}
      <div className="ai-analysis-section">
        <h4 className="ai-analysis-section-title">
          <span>📊</span> Analysis
        </h4>
        <div className="ai-analysis-text">{analysis.analysis}</div>
      </div>

      {/* Key Metrics */}
      {rawData.keyMetrics && Object.keys(rawData.keyMetrics).length > 0 && (
        <div className="ai-analysis-section">
          <h4 className="ai-analysis-section-title">
            <span>📈</span> Key Metrics
          </h4>
          <div className="ai-metrics">
            {Object.entries(rawData.keyMetrics).map(([key, value]) => (
              <div className="ai-metric" key={key}>
                <div className="ai-metric-value">{String(value)}</div>
                <div className="ai-metric-label">{key.replace(/_/g, ' ')}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Environmental Impact */}
      {rawData.environmentalImpact && (
        <div className="ai-analysis-section">
          <h4 className="ai-analysis-section-title">
            <span>🌍</span> Environmental Impact
          </h4>
          <div className="ai-impact-box">
            {rawData.environmentalImpact}
          </div>
        </div>
      )}

      {/* Recommendations */}
      {analysis.recommendations && analysis.recommendations.length > 0 && (
        <div className="ai-analysis-section">
          <h4 className="ai-analysis-section-title">
            <span>💡</span> Recommendations
          </h4>
          <ul className="ai-recommendations">
            {analysis.recommendations.map((rec, index) => (
              <li key={index}>{rec}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};

export default AIAnalysisDisplay;
