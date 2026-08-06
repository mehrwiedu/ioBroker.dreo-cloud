import { expect } from 'chai';

import {
	AIR_PURIFIER_MODE_STATES,
	isAirPurifierModel,
	isConflictingGenericAirPurifierFriendlyState,
	normalizeAirPurifierMode,
	normalizeWritableAirPurifierMode,
	type WritableAirPurifierModeDevice,
	writeAirPurifierModeState,
} from './air-purifier';

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

describe('DR-HAP009S operating mode', () => {
	it('exposes all four confirmed native modes with readable labels', () => {
		expect(AIR_PURIFIER_MODE_STATES).to.deep.equal({
			manual: 'Manual',
			'auto-regular': 'Auto',
			turbo: 'Turbo',
			sleep: 'Sleep',
		});
	});

	it('accepts only exact confirmed semantic read values', () => {
		for (const mode of ['manual', 'auto-regular', 'turbo', 'sleep']) {
			expect(normalizeAirPurifierMode(mode)).to.equal(mode);
		}

		expect(normalizeAirPurifierMode(' auto-regular ')).to.equal(undefined);
		expect(normalizeAirPurifierMode('auto')).to.equal(undefined);
		expect(normalizeAirPurifierMode(1)).to.equal(undefined);
		expect(normalizeAirPurifierMode(null)).to.equal(undefined);
	});

	it('normalizes confirmed string writes only for DR-HAP009S', () => {
		expect(normalizeWritableAirPurifierMode('manual', 'DR-HAP009S')).to.equal('manual');
		expect(normalizeWritableAirPurifierMode(' auto-regular ', 'DR-HAP009S')).to.equal('auto-regular');
		expect(normalizeWritableAirPurifierMode('turbo', 'DR-HAP009S')).to.equal('turbo');
		expect(normalizeWritableAirPurifierMode('sleep', 'DR-HAP009S')).to.equal('sleep');

		expect(normalizeWritableAirPurifierMode('auto', 'DR-HAP009S')).to.equal(undefined);
		expect(normalizeWritableAirPurifierMode('Auto', 'DR-HAP009S')).to.equal(undefined);
		expect(normalizeWritableAirPurifierMode('', 'DR-HAP009S')).to.equal(undefined);
		expect(normalizeWritableAirPurifierMode(1, 'DR-HAP009S')).to.equal(undefined);
		expect(normalizeWritableAirPurifierMode('manual', 'DR-HHM001S')).to.equal(undefined);
		expect(normalizeWritableAirPurifierMode('manual', undefined)).to.equal(undefined);
	});

	it('forwards only the normalized mode to setAirPurifierMode', async () => {
		const calls: string[] = [];
		const device: WritableAirPurifierModeDevice = {
			model: 'DR-HAP009S',
			setAirPurifierMode: mode => {
				calls.push(mode);

				return Promise.resolve();
			},
		};

		expect(await writeAirPurifierModeState(device, ' auto-regular ')).to.equal('auto-regular');
		expect(await writeAirPurifierModeState(device, 'sleep')).to.equal('sleep');
		expect(calls).to.deep.equal(['auto-regular', 'sleep']);
	});

	it('rejects invalid writes without calling the SDK', async () => {
		const calls: string[] = [];
		const device: WritableAirPurifierModeDevice = {
			model: 'DR-HAP009S',
			setAirPurifierMode: mode => {
				calls.push(mode);

				return Promise.resolve();
			},
		};
		let caughtError: unknown;

		try {
			await writeAirPurifierModeState(device, 'auto');
		} catch (error) {
			caughtError = error;
		}

		expect(caughtError).to.be.instanceOf(Error);
		expect((caughtError as Error).message).to.equal('Invalid air purifier mode for DR-HAP009S: auto');
		expect(calls).to.deep.equal([]);
	});
});
