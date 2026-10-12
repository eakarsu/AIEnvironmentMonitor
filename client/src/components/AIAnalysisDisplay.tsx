import React from 'react';
import FormattedAIReport from './FormattedAIReport';

interface AIAnalysisProps {
  analysis: {
    success: boolean;
    analysis: any;
    recommendations: any[];
    severity?: string;
    confidence: number;
    rawResponse?: any;
  } | null;
  loading: boolean;
}

const AIAnalysisDisplay: React.FC<AIAnalysisProps> = ({ analysis, loading }) => {
  if (loading) return <FormattedAIReport loading response={null} />;
  if (!analysis) return null;

  const raw = analysis.rawResponse || {};
  return <FormattedAIReport title="AI analysis results" response={{
    analysis: analysis.analysis,
    recommendations: analysis.recommendations,
    ...(analysis.severity !== undefined ? { severity: analysis.severity } : {}),
    confidence: analysis.confidence,
    ...(raw.keyMetrics !== undefined ? { keyMetrics: raw.keyMetrics } : {}),
    ...(raw.environmentalImpact !== undefined ? { environmentalImpact: raw.environmentalImpact } : {}),
    ...(raw.actionPriority !== undefined ? { actionPriority: raw.actionPriority } : {}),
  }} />;
};

export default AIAnalysisDisplay;
