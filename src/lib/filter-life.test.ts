import { expect } from 'chai';

import { getFilterLifeRemainingRawKey, isFilterLifeRemainingModel, normalizeFilterLifeRemaining } from './filter-life';

describe('shared filter-life remaining', () => {
	it('selects the confirmed native state for each supported model', () => {
		expect(getFilterLifeRemainingRawKey('DR-HAP009S')).to.equal('lifetime');
		expect(getFilterLifeRemainingRawKey('DR-HHM001S')).to.equal('filtertime');

		for (const model of ['DR-HCF007S', 'DR-HPF002S', '', null, undefined]) {
			expect(getFilterLifeRemainingRawKey(model)).to.equal(undefined);
		}
	});

	it('accepts exactly the two confirmed models', () => {
		expect(isFilterLifeRemainingModel('DR-HAP009S')).to.equal(true);
		expect(isFilterLifeRemainingModel('DR-HHM001S')).to.equal(true);

		for (const model of ['DR-HCF007S', 'DR-HPF002S', '', null, undefined]) {
			expect(isFilterLifeRemainingModel(model)).to.equal(false);
		}
	});

	it('accepts only integer percentages from 0 through 100', () => {
		for (const value of [0, 1, 43, 87, 100]) {
			expect(normalizeFilterLifeRemaining(value)).to.equal(value);
		}

		for (const value of [-1, 101, 1.5, '43', null, undefined, Number.NaN, Number.POSITIVE_INFINITY]) {
			expect(normalizeFilterLifeRemaining(value)).to.equal(undefined);
		}
	});
});
