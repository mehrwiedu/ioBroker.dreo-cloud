import { expect } from 'chai';

import { isAirPurifierModel, isConflictingGenericAirPurifierFriendlyState } from './air-purifier';

describe('DR-HAP009S generic Friendly-State separation', () => {
	it('recognizes only the confirmed air-purifier model', () => {
		expect(isAirPurifierModel('DR-HAP009S')).to.equal(true);
		expect(isAirPurifierModel('DR-HHM001S')).to.equal(false);
		expect(isAirPurifierModel('DR-HPF002S')).to.equal(false);
		expect(isAirPurifierModel(undefined)).to.equal(false);
	});

	it('blocks the three conflicting generic definitions for DR-HAP009S', () => {
		expect(
			isConflictingGenericAirPurifierFriendlyState('DR-HAP009S', {
				channelId: 'fan',
				stateId: 'speed',
				rawKey: 'windlevel',
			}),
		).to.equal(true);

		expect(
			isConflictingGenericAirPurifierFriendlyState('DR-HAP009S', {
				channelId: 'fan',
				stateId: 'mode',
				rawKey: 'mode',
			}),
		).to.equal(true);

		expect(
			isConflictingGenericAirPurifierFriendlyState('DR-HAP009S', {
				channelId: 'moodLight',
				stateId: 'on',
				rawKey: 'rgblevel',
			}),
		).to.equal(true);
	});

	it('keeps valid shared DR-HAP009S definitions available', () => {
		for (const definition of [
			{
				channelId: 'power',
				stateId: 'on',
				rawKey: 'poweron',
			},
			{
				channelId: 'settings',
				stateId: 'mute',
				rawKey: 'muteon',
			},
			{
				channelId: 'settings',
				stateId: 'childLock',
				rawKey: 'childlockon',
			},
		]) {
			expect(isConflictingGenericAirPurifierFriendlyState('DR-HAP009S', definition)).to.equal(false);
		}
	});

	it('does not block dedicated definitions using related RAW keys', () => {
		for (const definition of [
			{
				channelId: 'airPurifier',
				stateId: 'fanLevel',
				rawKey: 'windlevel',
			},
			{
				channelId: 'airPurifier',
				stateId: 'mode',
				rawKey: 'mode',
			},
			{
				channelId: 'airPurifierMoodLight',
				stateId: 'level',
				rawKey: 'rgblevel',
			},
		]) {
			expect(isConflictingGenericAirPurifierFriendlyState('DR-HAP009S', definition)).to.equal(false);
		}
	});

	it('does not change the generic definitions for other models', () => {
		for (const model of ['DR-HHM001S', 'DR-HPF002S', 'DR-HCF007S']) {
			expect(
				isConflictingGenericAirPurifierFriendlyState(model, {
					channelId: 'fan',
					stateId: 'speed',
					rawKey: 'windlevel',
				}),
			).to.equal(false);

			expect(
				isConflictingGenericAirPurifierFriendlyState(model, {
					channelId: 'fan',
					stateId: 'mode',
					rawKey: 'mode',
				}),
			).to.equal(false);

			expect(
				isConflictingGenericAirPurifierFriendlyState(model, {
					channelId: 'moodLight',
					stateId: 'on',
					rawKey: 'rgblevel',
				}),
			).to.equal(false);
		}
	});
});
