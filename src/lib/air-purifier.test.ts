import { expect } from 'chai';

import {
	AIR_PURIFIER_MODE_STATES,
	isAirPurifierModel,
	isConflictingGenericAirPurifierFriendlyState,
	normalizeAirPurifierBoolean,
	normalizeAirPurifierMode,
	normalizeAirPurifierMoodLightLevel,
	normalizeAirPurifierWindLevel,
	normalizeWritableAirPurifierDisplay,
	normalizeWritableAirPurifierMode,
	normalizeWritableAirPurifierMoodLight,
	normalizeWritableAirPurifierMoodLightLevel,
	normalizeWritableAirPurifierPowerRecovery,
	normalizeWritableAirPurifierWindLevel,
	type WritableAirPurifierDisplayDevice,
	type WritableAirPurifierModeDevice,
	type WritableAirPurifierMoodLightDevice,
	type WritableAirPurifierPowerRecoveryDevice,
	type WritableAirPurifierWindLevelDevice,
	writeAirPurifierDisplayState,
	writeAirPurifierModeState,
	writeAirPurifierMoodLightLevelState,
	writeAirPurifierMoodLightState,
	writeAirPurifierPowerRecoveryState,
	writeAirPurifierWindLevelState,
} from './air-purifier';

describe('DR-HAP009S generic Friendly-State separation', () => {
	it('recognizes only the confirmed air-purifier model', () => {
		expect(isAirPurifierModel('DR-HAP009S')).to.equal(true);
		expect(isAirPurifierModel('DR-HHM001S')).to.equal(false);
		expect(isAirPurifierModel('DR-HPF002S')).to.equal(false);
		expect(isAirPurifierModel(undefined)).to.equal(false);
	});

	it('blocks the conflicting generic definitions for DR-HAP009S', () => {
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

		for (const rawKey of ['lighton', 'ledlevel']) {
			expect(
				isConflictingGenericAirPurifierFriendlyState('DR-HAP009S', {
					channelId: 'display',
					stateId: 'on',
					rawKey,
				}),
			).to.equal(true);
		}
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
			{
				channelId: 'airPurifierDisplay',
				stateId: 'on',
				rawKey: 'ledalwayson',
			},
			{
				channelId: 'airPurifierSettings',
				stateId: 'powerRecovery',
				rawKey: 'autoon',
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

			expect(
				isConflictingGenericAirPurifierFriendlyState(model, {
					channelId: 'display',
					stateId: 'on',
					rawKey: 'ledlevel',
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

describe('DR-HAP009S fan level', () => {
	it('accepts only exact semantic integer levels from 1 through 3', () => {
		for (const level of [1, 2, 3]) {
			expect(normalizeAirPurifierWindLevel(level)).to.equal(level);
		}

		expect(normalizeAirPurifierWindLevel(0)).to.equal(undefined);
		expect(normalizeAirPurifierWindLevel(4)).to.equal(undefined);
		expect(normalizeAirPurifierWindLevel(1.5)).to.equal(undefined);
		expect(normalizeAirPurifierWindLevel(Number.NaN)).to.equal(undefined);
		expect(normalizeAirPurifierWindLevel('2')).to.equal(undefined);
		expect(normalizeAirPurifierWindLevel(null)).to.equal(undefined);
	});

	it('normalizes confirmed numeric writes only for DR-HAP009S', () => {
		expect(normalizeWritableAirPurifierWindLevel(1, 'DR-HAP009S')).to.equal(1);
		expect(normalizeWritableAirPurifierWindLevel(' 2 ', 'DR-HAP009S')).to.equal(2);
		expect(normalizeWritableAirPurifierWindLevel('3', 'DR-HAP009S')).to.equal(3);

		expect(normalizeWritableAirPurifierWindLevel(0, 'DR-HAP009S')).to.equal(undefined);
		expect(normalizeWritableAirPurifierWindLevel(4, 'DR-HAP009S')).to.equal(undefined);
		expect(normalizeWritableAirPurifierWindLevel(1.5, 'DR-HAP009S')).to.equal(undefined);
		expect(normalizeWritableAirPurifierWindLevel('2.5', 'DR-HAP009S')).to.equal(undefined);
		expect(normalizeWritableAirPurifierWindLevel('', 'DR-HAP009S')).to.equal(undefined);
		expect(normalizeWritableAirPurifierWindLevel('manual', 'DR-HAP009S')).to.equal(undefined);
		expect(normalizeWritableAirPurifierWindLevel(2, 'DR-HPF002S')).to.equal(undefined);
		expect(normalizeWritableAirPurifierWindLevel(2, undefined)).to.equal(undefined);
	});

	it('forwards only the normalized level to setAirPurifierWindLevel', async () => {
		const calls: number[] = [];
		const device: WritableAirPurifierWindLevelDevice = {
			model: 'DR-HAP009S',
			setAirPurifierWindLevel: level => {
				calls.push(level);

				return Promise.resolve();
			},
		};

		expect(await writeAirPurifierWindLevelState(device, ' 2 ')).to.equal(2);
		expect(await writeAirPurifierWindLevelState(device, 3)).to.equal(3);
		expect(await writeAirPurifierWindLevelState(device, 3)).to.equal(3);
		expect(calls).to.deep.equal([2, 3, 3]);
	});

	it('rejects invalid levels without calling the SDK', async () => {
		const calls: number[] = [];
		const device: WritableAirPurifierWindLevelDevice = {
			model: 'DR-HAP009S',
			setAirPurifierWindLevel: level => {
				calls.push(level);

				return Promise.resolve();
			},
		};
		let caughtError: unknown;

		try {
			await writeAirPurifierWindLevelState(device, 4);
		} catch (error) {
			caughtError = error;
		}

		expect(caughtError).to.be.instanceOf(Error);
		expect((caughtError as Error).message).to.equal('Invalid air purifier fan level for DR-HAP009S: 4');
		expect(calls).to.deep.equal([]);
	});
});

describe('DR-HAP009S mood light', () => {
	it('accepts only exact semantic boolean switch values', () => {
		expect(normalizeAirPurifierBoolean(true)).to.equal(true);
		expect(normalizeAirPurifierBoolean(false)).to.equal(false);

		expect(normalizeAirPurifierBoolean(1)).to.equal(undefined);
		expect(normalizeAirPurifierBoolean(0)).to.equal(undefined);
		expect(normalizeAirPurifierBoolean('true')).to.equal(undefined);
		expect(normalizeAirPurifierBoolean(null)).to.equal(undefined);
	});

	it('normalizes writable switch values only for DR-HAP009S', () => {
		expect(normalizeWritableAirPurifierMoodLight(true, 'DR-HAP009S')).to.equal(true);
		expect(normalizeWritableAirPurifierMoodLight(false, 'DR-HAP009S')).to.equal(false);
		expect(normalizeWritableAirPurifierMoodLight(1, 'DR-HAP009S')).to.equal(true);
		expect(normalizeWritableAirPurifierMoodLight(0, 'DR-HAP009S')).to.equal(false);
		expect(normalizeWritableAirPurifierMoodLight(' true ', 'DR-HAP009S')).to.equal(true);
		expect(normalizeWritableAirPurifierMoodLight('false', 'DR-HAP009S')).to.equal(false);

		expect(normalizeWritableAirPurifierMoodLight(2, 'DR-HAP009S')).to.equal(undefined);
		expect(normalizeWritableAirPurifierMoodLight('yes', 'DR-HAP009S')).to.equal(undefined);
		expect(normalizeWritableAirPurifierMoodLight(true, 'DR-HHM001S')).to.equal(undefined);
		expect(normalizeWritableAirPurifierMoodLight(true, undefined)).to.equal(undefined);
	});

	it('accepts only mood-light levels from 1 through 3', () => {
		for (const level of [1, 2, 3]) {
			expect(normalizeAirPurifierMoodLightLevel(level)).to.equal(level);
			expect(normalizeWritableAirPurifierMoodLightLevel(String(level), 'DR-HAP009S')).to.equal(level);
		}

		expect(normalizeAirPurifierMoodLightLevel(0)).to.equal(undefined);
		expect(normalizeAirPurifierMoodLightLevel(4)).to.equal(undefined);
		expect(normalizeAirPurifierMoodLightLevel('2')).to.equal(undefined);
		expect(normalizeWritableAirPurifierMoodLightLevel(1.5, 'DR-HAP009S')).to.equal(undefined);
		expect(normalizeWritableAirPurifierMoodLightLevel(2, 'DR-HPF002S')).to.equal(undefined);
	});

	it('forwards switch writes only to setAirPurifierMoodLight', async () => {
		const switchCalls: boolean[] = [];
		const levelCalls: number[] = [];
		const device: WritableAirPurifierMoodLightDevice = {
			model: 'DR-HAP009S',
			setAirPurifierMoodLight: enabled => {
				switchCalls.push(enabled);
				return Promise.resolve();
			},
			setAirPurifierMoodLightLevel: level => {
				levelCalls.push(level);
				return Promise.resolve();
			},
		};

		expect(await writeAirPurifierMoodLightState(device, 'true')).to.equal(true);
		expect(await writeAirPurifierMoodLightState(device, false)).to.equal(false);
		expect(switchCalls).to.deep.equal([true, false]);
		expect(levelCalls).to.deep.equal([]);
	});

	it('forwards level writes only to setAirPurifierMoodLightLevel', async () => {
		const switchCalls: boolean[] = [];
		const levelCalls: number[] = [];
		const device: WritableAirPurifierMoodLightDevice = {
			model: 'DR-HAP009S',
			setAirPurifierMoodLight: enabled => {
				switchCalls.push(enabled);
				return Promise.resolve();
			},
			setAirPurifierMoodLightLevel: level => {
				levelCalls.push(level);
				return Promise.resolve();
			},
		};

		expect(await writeAirPurifierMoodLightLevelState(device, '2')).to.equal(2);
		expect(await writeAirPurifierMoodLightLevelState(device, 3)).to.equal(3);
		expect(await writeAirPurifierMoodLightLevelState(device, 3)).to.equal(3);
		expect(switchCalls).to.deep.equal([]);
		expect(levelCalls).to.deep.equal([2, 3, 3]);
	});

	it('rejects invalid values without calling either SDK method', async () => {
		const switchCalls: boolean[] = [];
		const levelCalls: number[] = [];
		const device: WritableAirPurifierMoodLightDevice = {
			model: 'DR-HAP009S',
			setAirPurifierMoodLight: enabled => {
				switchCalls.push(enabled);
				return Promise.resolve();
			},
			setAirPurifierMoodLightLevel: level => {
				levelCalls.push(level);
				return Promise.resolve();
			},
		};
		const errors: Error[] = [];

		for (const operation of [
			() => writeAirPurifierMoodLightState(device, 'yes'),
			() => writeAirPurifierMoodLightLevelState(device, 4),
		]) {
			try {
				await operation();
			} catch (error) {
				if (error instanceof Error) {
					errors.push(error);
				}
			}
		}

		expect(errors.map(error => error.message)).to.deep.equal([
			'Invalid air purifier mood-light state for DR-HAP009S: yes',
			'Invalid air purifier mood-light level for DR-HAP009S: 4',
		]);
		expect(switchCalls).to.deep.equal([]);
		expect(levelCalls).to.deep.equal([]);
	});
});

describe('DR-HAP009S display and power recovery', () => {
	it('normalizes writable display values only for DR-HAP009S', () => {
		expect(normalizeWritableAirPurifierDisplay(true, 'DR-HAP009S')).to.equal(true);
		expect(normalizeWritableAirPurifierDisplay(0, 'DR-HAP009S')).to.equal(false);
		expect(normalizeWritableAirPurifierDisplay(' true ', 'DR-HAP009S')).to.equal(true);

		expect(normalizeWritableAirPurifierDisplay(2, 'DR-HAP009S')).to.equal(undefined);
		expect(normalizeWritableAirPurifierDisplay('yes', 'DR-HAP009S')).to.equal(undefined);
		expect(normalizeWritableAirPurifierDisplay(true, 'DR-HPF002S')).to.equal(undefined);
		expect(normalizeWritableAirPurifierDisplay(true, undefined)).to.equal(undefined);
	});

	it('normalizes writable power-recovery values only for DR-HAP009S', () => {
		expect(normalizeWritableAirPurifierPowerRecovery(true, 'DR-HAP009S')).to.equal(true);
		expect(normalizeWritableAirPurifierPowerRecovery(0, 'DR-HAP009S')).to.equal(false);
		expect(normalizeWritableAirPurifierPowerRecovery(' false ', 'DR-HAP009S')).to.equal(false);

		expect(normalizeWritableAirPurifierPowerRecovery(2, 'DR-HAP009S')).to.equal(undefined);
		expect(normalizeWritableAirPurifierPowerRecovery('yes', 'DR-HAP009S')).to.equal(undefined);
		expect(normalizeWritableAirPurifierPowerRecovery(true, 'DR-HHM001S')).to.equal(undefined);
		expect(normalizeWritableAirPurifierPowerRecovery(true, undefined)).to.equal(undefined);
	});

	it('forwards display writes only to setAirPurifierDisplay', async () => {
		const calls: boolean[] = [];
		const device: WritableAirPurifierDisplayDevice = {
			model: 'DR-HAP009S',
			setAirPurifierDisplay: enabled => {
				calls.push(enabled);
				return Promise.resolve();
			},
		};

		expect(await writeAirPurifierDisplayState(device, 'true')).to.equal(true);
		expect(await writeAirPurifierDisplayState(device, false)).to.equal(false);
		expect(calls).to.deep.equal([true, false]);
	});

	it('forwards power recovery only to setAirPurifierPowerRecovery', async () => {
		const calls: boolean[] = [];
		const device: WritableAirPurifierPowerRecoveryDevice = {
			model: 'DR-HAP009S',
			setAirPurifierPowerRecovery: enabled => {
				calls.push(enabled);
				return Promise.resolve();
			},
		};

		expect(await writeAirPurifierPowerRecoveryState(device, 'false')).to.equal(false);
		expect(await writeAirPurifierPowerRecoveryState(device, true)).to.equal(true);
		expect(calls).to.deep.equal([false, true]);
	});

	it('rejects invalid values without calling either SDK method', async () => {
		const displayCalls: boolean[] = [];
		const recoveryCalls: boolean[] = [];

		const displayDevice: WritableAirPurifierDisplayDevice = {
			model: 'DR-HAP009S',
			setAirPurifierDisplay: enabled => {
				displayCalls.push(enabled);
				return Promise.resolve();
			},
		};

		const recoveryDevice: WritableAirPurifierPowerRecoveryDevice = {
			model: 'DR-HAP009S',
			setAirPurifierPowerRecovery: enabled => {
				recoveryCalls.push(enabled);
				return Promise.resolve();
			},
		};

		const errors: Error[] = [];

		for (const operation of [
			() => writeAirPurifierDisplayState(displayDevice, 'yes'),
			() => writeAirPurifierPowerRecoveryState(recoveryDevice, 2),
		]) {
			try {
				await operation();
			} catch (error) {
				if (error instanceof Error) {
					errors.push(error);
				}
			}
		}

		expect(errors.map(error => error.message)).to.deep.equal([
			'Invalid air purifier display state for DR-HAP009S: yes',
			'Invalid air purifier power-recovery state for DR-HAP009S: 2',
		]);
		expect(displayCalls).to.deep.equal([]);
		expect(recoveryCalls).to.deep.equal([]);
	});
});
