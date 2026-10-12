import React, { useState } from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import axios from 'axios';
import NativeAIControls from '../components/NativeAIControls';
import FormattedAIReport from '../components/FormattedAIReport';
import AIAnalysisDisplay from '../components/AIAnalysisDisplay';
import Login from '../pages/Login';
import AIResults from '../pages/AIResults';
import AIInsights from '../pages/AIInsights';
import AIBacklog from '../pages/AIBacklog';
import CarbonFootprint from '../pages/CarbonFootprint';
import WeatherImpact from '../pages/WeatherImpact';
import WaterQuality from '../pages/WaterQuality';
import EnergyOptimizer from '../pages/EnergyOptimizer';
import RecyclingSorter from '../pages/RecyclingSorter';
import Batch03Features from '../pages/Batch03Features';
import { MemoryRouter } from 'react-router-dom';

jest.mock('axios');

test('Batch 03 AI prompts offer three context-specific fill-only examples', () => {
  const priorFetch = global.fetch;
  const fetchSpy = jest.fn();
  global.fetch = fetchSpy;
  render(<Batch03Features />);
  fireEvent.click(screen.getByRole('button', { name: /No carbon-offset marketplace agent/ }));
  for (const name of ['Scenario', 'Data sample', 'Executive review']) {
    fireEvent.click(screen.getByRole('button', { name }));
    expect(screen.getByPlaceholderText(/Optional JSON input/).value).toContain('No carbon-offset marketplace agent');
    expect(fetchSpy).not.toHaveBeenCalled();
  }
  global.fetch = priorFetch;
});

test.each([
  [CarbonFootprint, 'Add New Activity', ['Commute sample', 'Office energy sample', 'Food waste sample']],
  [WeatherImpact, 'Add New Record', ['Drought sample', 'Heavy rain sample', 'Cool spell sample']],
  [WaterQuality, 'Add New Sample', ['Municipal sample', 'Reservoir sample', 'River sample']],
  [EnergyOptimizer, 'Add New Device', ['Air conditioning sample', 'Office lighting sample', 'Water heater sample']],
  [RecyclingSorter, 'Add New Item', ['Plastic bottle sample', 'Cardboard box sample', 'Used battery sample']],
])('%p presents three complete fill-only samples', async (Page, openLabel, labels) => {
  axios.get.mockResolvedValueOnce({ data: [] });
  const { container } = render(<MemoryRouter><Page user={{ id: 1, email: '', name: '' }} onLogout={() => {}} /></MemoryRouter>);
  fireEvent.click(await screen.findByRole('button', { name: new RegExp(openLabel) }));
  for (const label of labels) {
    fireEvent.click(screen.getByRole('button', { name: label }));
    const controls = container.querySelectorAll('.modal form input, .modal form textarea, .modal form select');
    expect(controls.length).toBeGreaterThan(1);
    controls.forEach(control => {
      if (control.type !== 'checkbox') expect(control.value).not.toBe('');
    });
    expect(axios.post).not.toHaveBeenCalled();
  }
});

function PresetFixture({ submit }) {
  const [required, setRequired] = useState('');
  const [optional, setOptional] = useState('');
  const [recordId, setRecordId] = useState('real-record-b');
  return <NativeAIControls context="water quality">
    <form onSubmit={event => { event.preventDefault(); submit(); }}>
      <input data-ai-field="itemDescription" aria-label="Item description" required value={required} onChange={event => setRequired(event.target.value)} />
      <textarea data-ai-field="notes" aria-label="Notes" value={optional} onChange={event => setOptional(event.target.value)} />
      <select data-ai-field="recordId" aria-label="Record" value={recordId} onChange={event => setRecordId(event.target.value)}><option value="real-record-a">A</option><option value="real-record-b">B</option></select>
      <input data-ai-field="upload" aria-label="Upload" type="file" />
      <button type="submit">Run</button>
    </form>
  </NativeAIControls>;
}

test('all presets fill required and optional fields without submitting or replacing record and file', () => {
  const submit = jest.fn();
  render(<PresetFixture submit={submit} />);
  for (const name of ['Demo AI · Quick review', 'Demo AI · Team planning', 'Demo AI · Detailed review']) {
    fireEvent.click(screen.getByRole('button', { name }));
    expect(screen.getByLabelText('Item description')).not.toHaveValue('');
    expect(screen.getByLabelText('Notes')).not.toHaveValue('');
    expect(screen.getByLabelText('Record')).toHaveValue('real-record-b');
    expect(screen.getByLabelText('Upload').files).toHaveLength(0);
    expect(submit).not.toHaveBeenCalled();
  }
  expect(screen.getByRole('status')).toHaveTextContent('Supply actual');
});

test('AI Insights preset fills item description and optional municipality without generation', () => {
  render(<MemoryRouter><AIInsights user={{ id: 1, email: '', name: '' }} onLogout={() => {}} /></MemoryRouter>);
  fireEvent.click(screen.getByRole('button', { name: 'recycling-sort' }));
  fireEvent.click(screen.getByRole('button', { name: 'Demo AI · Team planning' }));
  expect(screen.getByPlaceholderText(/greasy pizza box/)).toHaveValue('Swollen lithium-ion laptop battery');
  expect(screen.getByPlaceholderText(/San Francisco/)).toHaveValue('Portland, OR');
  expect(axios.post).not.toHaveBeenCalled();
});

test('vendor ranking preset fills target and optional preferences without generation', () => {
  render(<AIBacklog user={{ id: 1, email: '', name: '' }} onLogout={() => {}} />);
  fireEvent.click(screen.getByRole('button', { name: 'offsets' }));
  fireEvent.click(screen.getByRole('button', { name: 'Demo AI · Detailed review' }));
  expect(screen.getByLabelText('Target tonnes CO2e')).toHaveValue(5);
  expect(screen.getByLabelText(/Preferences \(optional\)/).value).toContain('durable carbon removals');
  expect(axios.post).not.toHaveBeenCalled();
});

test('returned structured values display as sections, facts, and a table including false, zero and empty string', () => {
  render(<FormattedAIReport response={{ result: { findings: [{ measure: 'Water', value: 0, verified: false, note: '' }], summary: { complete: false, count: 0, detail: '' } } }} />);
  expect(screen.getByRole('table')).toBeInTheDocument();
  expect(screen.getAllByText('No').length).toBeGreaterThan(0);
  expect(screen.getAllByText('0').length).toBeGreaterThan(0);
  expect(screen.getAllByText('Empty string').length).toBeGreaterThan(0);
  expect(screen.getByText('Summary')).toBeInTheDocument();
});

test('saved analysis detail renders structured JSON rather than a raw JSON string', () => {
  render(<AIAnalysisDisplay loading={false} analysis={{ success: true, analysis: '{"risk":{"action_required":false,"count":0,"note":""}}', recommendations: [], confidence: 0 }} />);
  expect(screen.getByText('Risk')).toBeInTheDocument();
  expect(screen.getAllByText('No').length).toBeGreaterThan(0);
  expect(screen.getAllByText('0').length).toBeGreaterThan(0);
  expect(screen.getByText('Empty string')).toBeInTheDocument();
});

test('history detail renders saved structured result', async () => {
  axios.get.mockResolvedValueOnce({ data: { data: [{ id: 1, analysis_type: 'test', domain: 'water', entity_id: null, result: { risk: { action_required: false, count: 0, note: '' } }, model_used: 'fixture', confidence: 0, created_at: '2026-01-01T00:00:00Z' }], pagination: { totalPages: 1 } } });
  render(<MemoryRouter><AIResults user={{ id: 1, email: '', name: '' }} onLogout={() => {}} /></MemoryRouter>);
  await waitFor(() => expect(screen.getByText(/Risk Action required/)).toBeInTheDocument());
  fireEvent.click(screen.getByText(/Risk Action required/));
  expect(screen.getByText('Action required')).toBeInTheDocument();
  expect(screen.getAllByText('Empty string').length).toBeGreaterThan(0);
});

test('demo fill uses configured endpoint and does not submit login', async () => {
  axios.get.mockResolvedValueOnce({ data: { email: 'demo@example.test', password: 'fixture-only' } });
  render(<Login onLogin={jest.fn()} />);
  fireEvent.click(screen.getByRole('button', { name: 'Fill demo credentials' }));
  await waitFor(() => expect(screen.getByPlaceholderText('Enter your email')).toHaveValue('demo@example.test'));
  expect(screen.getByPlaceholderText('Enter your password')).toHaveValue('fixture-only');
  expect(axios.post).not.toHaveBeenCalled();
});

test('missing demo credentials stay explicit', async () => {
  axios.get.mockRejectedValueOnce(new Error('unavailable'));
  render(<Login onLogin={jest.fn()} />);
  fireEvent.click(screen.getByRole('button', { name: 'Fill demo credentials' }));
  await waitFor(() => expect(screen.getByText(/Demo credentials are unavailable/)).toBeInTheDocument());
  expect(axios.post).not.toHaveBeenCalled();
});
