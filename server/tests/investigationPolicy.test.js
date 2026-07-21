'use strict';
const test = require('node:test'); const assert = require('node:assert/strict'); const { normalizeObservation, assertTransition } = require('../domain/investigationPolicy');
test('observation preserves unit calibration and source', () => { const o = normalizeObservation({ siteId: 's1', deviceId: 'd1', calibrationVersion: 'c4', unit: 'ug/m3', value: 14, observedAt: '2026-01-01T00:00:00Z', sourceId: 'gateway:44', validRange: { min: 0, max: 10 } }); assert.equal(o.outlier, true); assert.equal(o.unit, 'ug/m3'); });
test('non-finite values rejected', () => assert.throws(() => normalizeObservation({ siteId: 's', deviceId: 'd', calibrationVersion: 'c', unit: 'x', value: Infinity, observedAt: '2026-01-01' }), /finite/));
test('analyst controls acceptance', () => assert.throws(() => assertTransition('qc_pending', 'accepted', { role: 'device' }), /analyst/));
