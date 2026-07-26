import { expect } from 'chai';

import { normalizePowerScopedOnState } from './friendly-state';

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
