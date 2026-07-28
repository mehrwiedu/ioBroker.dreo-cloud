import { expect } from 'chai';

import { normalizePowerScopedOnState, normalizeWritableBoolean } from './friendly-state';

describe('normalizePowerScopedOnState', () => {
	it('returns true when power and target state are enabled', () => {
		expect(normalizePowerScopedOnState(true, true)).to.equal(true);
	});

	it('returns false when power is disabled although the target state is enabled', () => {
		expect(normalizePowerScopedOnState(true, false)).to.equal(false);
	});

	it('returns false when the target state is disabled although power is enabled', () => {
		expect(normalizePowerScopedOnState(false, true)).to.equal(false);
	});

	it('uses the target state directly when poweron is not available', () => {
		expect(normalizePowerScopedOnState(true, undefined)).to.equal(true);
	});

	it('returns false for a disabled target when poweron is not available', () => {
		expect(normalizePowerScopedOnState(false, undefined)).to.equal(false);
	});
});

describe('normalizeWritableBoolean', () => {
	it('keeps boolean values unchanged', () => {
		expect(normalizeWritableBoolean(true)).to.equal(true);
		expect(normalizeWritableBoolean(false)).to.equal(false);
	});

	it('accepts numeric boolean values', () => {
		expect(normalizeWritableBoolean(1)).to.equal(true);
		expect(normalizeWritableBoolean(0)).to.equal(false);
	});

	it('accepts unambiguous string values', () => {
		expect(normalizeWritableBoolean('true')).to.equal(true);
		expect(normalizeWritableBoolean(' FALSE ')).to.equal(false);
		expect(normalizeWritableBoolean('1')).to.equal(true);
		expect(normalizeWritableBoolean('0')).to.equal(false);
	});

	it('rejects ambiguous or unsupported values', () => {
		expect(normalizeWritableBoolean('yes')).to.equal(undefined);
		expect(normalizeWritableBoolean('')).to.equal(undefined);
		expect(normalizeWritableBoolean(2)).to.equal(undefined);
		expect(normalizeWritableBoolean(null)).to.equal(undefined);
	});
});
