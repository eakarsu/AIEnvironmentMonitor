import React, { useState, useEffect } from 'react';

interface TourStep {
  title: string;
  content: string;
  target?: string;
}

const steps: TourStep[] = [
  { title: 'Welcome!', content: 'Welcome to AI Environment Monitor! Let us show you around.' },
  { title: 'Dashboard', content: 'This is your main dashboard. Click any card to explore environmental data.' },
  { title: 'Weather Impact', content: 'Track weather effects on crops and agriculture with AI analysis.' },
  { title: 'Carbon Footprint', content: 'Calculate and reduce your carbon emissions.' },
  { title: 'Recycling Sorter', content: 'Learn what can be recycled and how to dispose of items properly.' },
  { title: 'Energy Optimizer', content: 'Optimize your energy consumption with smart recommendations.' },
  { title: 'Water Quality', content: 'Monitor water quality and detect contamination.' },
  { title: 'You are all set!', content: 'Explore the features and use AI analysis for intelligent insights. Enjoy!' },
];

const OnboardingTour: React.FC = () => {
  const [currentStep, setCurrentStep] = useState(0);
  const [show, setShow] = useState(false);

  useEffect(() => {
    const seen = localStorage.getItem('onboarding_complete');
    if (!seen) setShow(true);
  }, []);

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      handleClose();
    }
  };

  const handleClose = () => {
    localStorage.setItem('onboarding_complete', 'true');
    setShow(false);
  };

  if (!show) return null;

  const step = steps[currentStep];

  return (
    <div className="onboarding-overlay" role="dialog" aria-label="Onboarding tour">
      <div className="onboarding-card">
        <div className="onboarding-progress">
          {steps.map((_, i) => (
            <div key={i} className={`onboarding-dot ${i === currentStep ? 'active' : i < currentStep ? 'completed' : ''}`} />
          ))}
        </div>
        <h2 className="onboarding-title">{step.title}</h2>
        <p className="onboarding-content">{step.content}</p>
        <div className="onboarding-actions">
          <button className="btn btn-secondary" onClick={handleClose}>Skip Tour</button>
          <button className="btn btn-primary" onClick={handleNext}>
            {currentStep === steps.length - 1 ? 'Get Started' : 'Next'}
          </button>
        </div>
        <div className="onboarding-counter">{currentStep + 1} / {steps.length}</div>
      </div>
    </div>
  );
};

export default OnboardingTour;
