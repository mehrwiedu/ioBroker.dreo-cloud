import { expect } from 'chai';

import {
	isHhm003sHumidifierModel,
	isWritableHumidifierModel,
	isWritableHumidifierStateId,
	normalizeWritableHhm003sHumidifierLevel,
	normalizeWritableHumidifierValue,
	type WritableHumidifierDevice,
	writeHhm003sDisplayLevelState,
	writeHhm003sMoodLightLevelState,
	writeHhm003sWarmMistState,
	writeHumidifierState,
} from './humidifier-control';

interface RecordedCall {
	method:
		| 'setHumidifierMode'
		| 'setHumidifierFogLevel'
		| 'setHumidifierAutoTargetHumidity'
		| 'setHumidifierSleepTargetHumidity'
		| 'setHumidifierLowerHumidityThreshold'
		| 'setHumidifierUpperHumidityThreshold'
		| 'setHumidifierWarmMist'
		| 'setHumidifierMoodLightLevel'
		| 'setHumidifierDisplayLevel';
	value: number | boolean;
}

function createRecordingDevice(model: string, calls: RecordedCall[]): WritableHumidifierDevice {
	return {
		model,
		setHumidifierMode: value => {
			calls.push({
				method: 'setHumidifierMode',
				value,
			});

			return Promise.resolve();
		},
		setHumidifierFogLevel: value => {
			calls.push({
				method: 'setHumidifierFogLevel',
				value,
			});

			return Promise.resolve();
		},
		setHumidifierAutoTargetHumidity: value => {
			calls.push({
				method: 'setHumidifierAutoTargetHumidity',
				value,
			});

			return Promise.resolve();
		},
		setHumidifierSleepTargetHumidity: value => {
			calls.push({
				method: 'setHumidifierSleepTargetHumidity',
				value,
			});

			return Promise.resolve();
		},
		setHumidifierLowerHumidityThreshold: value => {
			calls.push({
				method: 'setHumidifierLowerHumidityThreshold',
				value,
			});

			return Promise.resolve();
		},
		setHumidifierUpperHumidityThreshold: value => {
			calls.push({
				method: 'setHumidifierUpperHumidityThreshold',
				value,
			});

			return Promise.resolve();
		},
		setHumidifierWarmMist: value => {
			calls.push({
				method: 'setHumidifierWarmMist',
				value,
			});

			return Promise.resolve();
		},
		setHumidifierMoodLightLevel: value => {
			calls.push({
				method: 'setHumidifierMoodLightLevel',
				value,
			});

			return Promise.resolve();
		},
		setHumidifierDisplayLevel: value => {
			calls.push({
				method: 'setHumidifierDisplayLevel',
				value,
			});

			return Promise.resolve();
		},
	};
}

describe('humidifier model and state guards', () => {
	it('accepts both confirmed humidifier models', () => {
		expect(isWritableHumidifierModel('DR-HHM001S')).to.equal(true);
		expect(isWritableHumidifierModel('DR-HHM003S')).to.equal(true);
		expect(isWritableHumidifierModel('DR-HPF002S')).to.equal(false);
		expect(isWritableHumidifierModel('DR-HCF007S')).to.equal(false);
		expect(isWritableHumidifierModel(undefined)).to.equal(false);

		expect(isHhm003sHumidifierModel('DR-HHM003S')).to.equal(true);
		expect(isHhm003sHumidifierModel('DR-HHM001S')).to.equal(false);
		expect(isHhm003sHumidifierModel(undefined)).to.equal(false);
	});

	it('accepts exactly the six confirmed shared Friendly-State identifiers', () => {
		for (const stateId of [
			'mode',
			'fogLevel',
			'autoTargetHumidity',
			'sleepTargetHumidity',
			'humidityIndicatorLowerThreshold',
			'humidityIndicatorUpperThreshold',
		]) {
			expect(isWritableHumidifierStateId(stateId)).to.equal(true);
		}

		expect(isWritableHumidifierStateId('power')).to.equal(false);
		expect(isWritableHumidifierStateId('humidity')).to.equal(false);
		expect(isWritableHumidifierStateId('unknown')).to.equal(false);
	});
});

describe('normalizeWritableHumidifierValue', () => {
	it('accepts confirmed numbers and numeric strings', () => {
		expect(normalizeWritableHumidifierValue(0, 'mode', 'DR-HHM001S')).to.equal(0);
		expect(normalizeWritableHumidifierValue(' 2 ', 'mode', 'DR-HHM001S')).to.equal(2);

		expect(normalizeWritableHumidifierValue(1, 'fogLevel', 'DR-HHM001S')).to.equal(1);
		expect(normalizeWritableHumidifierValue('6', 'fogLevel', 'DR-HHM001S')).to.equal(6);

		expect(normalizeWritableHumidifierValue(30, 'autoTargetHumidity', 'DR-HHM001S')).to.equal(30);
		expect(normalizeWritableHumidifierValue('90', 'autoTargetHumidity', 'DR-HHM001S')).to.equal(90);

		expect(normalizeWritableHumidifierValue(30, 'sleepTargetHumidity', 'DR-HHM001S')).to.equal(30);
		expect(normalizeWritableHumidifierValue('90', 'sleepTargetHumidity', 'DR-HHM001S')).to.equal(90);

		expect(normalizeWritableHumidifierValue(2, 'mode', 'DR-HHM003S')).to.equal(2);
		expect(normalizeWritableHumidifierValue(6, 'fogLevel', 'DR-HHM003S')).to.equal(6);
		expect(normalizeWritableHumidifierValue(90, 'autoTargetHumidity', 'DR-HHM003S')).to.equal(90);
		expect(normalizeWritableHumidifierValue(30, 'sleepTargetHumidity', 'DR-HHM003S')).to.equal(30);

		expect(normalizeWritableHumidifierValue(15, 'humidityIndicatorLowerThreshold', 'DR-HHM003S')).to.equal(15);
		expect(normalizeWritableHumidifierValue('80', 'humidityIndicatorLowerThreshold', 'DR-HHM003S')).to.equal(80);
		expect(normalizeWritableHumidifierValue(20, 'humidityIndicatorUpperThreshold', 'DR-HHM003S')).to.equal(20);
		expect(normalizeWritableHumidifierValue('85', 'humidityIndicatorUpperThreshold', 'DR-HHM003S')).to.equal(85);
	});

	it('rejects state-specific out-of-range and fractional values', () => {
		expect(normalizeWritableHumidifierValue(-1, 'mode', 'DR-HHM001S')).to.equal(undefined);
		expect(normalizeWritableHumidifierValue(3, 'mode', 'DR-HHM001S')).to.equal(undefined);

		expect(normalizeWritableHumidifierValue(0, 'fogLevel', 'DR-HHM001S')).to.equal(undefined);
		expect(normalizeWritableHumidifierValue(7, 'fogLevel', 'DR-HHM001S')).to.equal(undefined);

		expect(normalizeWritableHumidifierValue(29, 'autoTargetHumidity', 'DR-HHM001S')).to.equal(undefined);
		expect(normalizeWritableHumidifierValue(91, 'autoTargetHumidity', 'DR-HHM001S')).to.equal(undefined);

		expect(normalizeWritableHumidifierValue(29, 'sleepTargetHumidity', 'DR-HHM001S')).to.equal(undefined);
		expect(normalizeWritableHumidifierValue(91, 'sleepTargetHumidity', 'DR-HHM001S')).to.equal(undefined);

		expect(normalizeWritableHumidifierValue(14, 'humidityIndicatorLowerThreshold', 'DR-HHM003S')).to.equal(
			undefined,
		);
		expect(normalizeWritableHumidifierValue(81, 'humidityIndicatorLowerThreshold', 'DR-HHM003S')).to.equal(
			undefined,
		);
		expect(normalizeWritableHumidifierValue(19, 'humidityIndicatorUpperThreshold', 'DR-HHM003S')).to.equal(
			undefined,
		);
		expect(normalizeWritableHumidifierValue(86, 'humidityIndicatorUpperThreshold', 'DR-HHM003S')).to.equal(
			undefined,
		);

		expect(normalizeWritableHumidifierValue(1.5, 'mode', 'DR-HHM001S')).to.equal(undefined);
		expect(normalizeWritableHumidifierValue(60.5, 'autoTargetHumidity', 'DR-HHM001S')).to.equal(undefined);
	});

	it('rejects malformed values, unknown states, and unsupported models', () => {
		expect(normalizeWritableHumidifierValue('', 'mode', 'DR-HHM001S')).to.equal(undefined);
		expect(normalizeWritableHumidifierValue('auto', 'mode', 'DR-HHM001S')).to.equal(undefined);
		expect(normalizeWritableHumidifierValue(null, 'mode', 'DR-HHM001S')).to.equal(undefined);
		expect(normalizeWritableHumidifierValue(1, 'unknown', 'DR-HHM001S')).to.equal(undefined);
		expect(normalizeWritableHumidifierValue(1, 'mode', 'DR-HPF002S')).to.equal(undefined);
	});
});

describe('DR-HHM003S specific controls', () => {
	it('accepts only confirmed 0 through 2 indicator levels', () => {
		expect(normalizeWritableHhm003sHumidifierLevel(0, 'DR-HHM003S')).to.equal(0);
		expect(normalizeWritableHhm003sHumidifierLevel('1', 'DR-HHM003S')).to.equal(1);
		expect(normalizeWritableHhm003sHumidifierLevel(2, 'DR-HHM003S')).to.equal(2);

		expect(normalizeWritableHhm003sHumidifierLevel(-1, 'DR-HHM003S')).to.equal(undefined);
		expect(normalizeWritableHhm003sHumidifierLevel(3, 'DR-HHM003S')).to.equal(undefined);
		expect(normalizeWritableHhm003sHumidifierLevel(1.5, 'DR-HHM003S')).to.equal(undefined);
		expect(normalizeWritableHhm003sHumidifierLevel(1, 'DR-HHM001S')).to.equal(undefined);
	});

	it('forwards warm mist and both indicator levels only to their matching SDK methods', async () => {
		const calls: RecordedCall[] = [];
		const device = createRecordingDevice('DR-HHM003S', calls);

		expect(await writeHhm003sWarmMistState(device, true)).to.equal(true);
		expect(await writeHhm003sMoodLightLevelState(device, '1')).to.equal(1);
		expect(await writeHhm003sDisplayLevelState(device, 2)).to.equal(2);

		expect(calls).to.deep.equal([
			{
				method: 'setHumidifierWarmMist',
				value: true,
			},
			{
				method: 'setHumidifierMoodLightLevel',
				value: 1,
			},
			{
				method: 'setHumidifierDisplayLevel',
				value: 2,
			},
		]);
	});

	it('rejects HHM003S-only writes for another humidifier model', async () => {
		const calls: RecordedCall[] = [];
		const device = createRecordingDevice('DR-HHM001S', calls);
		const actions = [
			() => writeHhm003sWarmMistState(device, true),
			() => writeHhm003sMoodLightLevelState(device, 1),
			() => writeHhm003sDisplayLevelState(device, 1),
		];

		for (const action of actions) {
			let caughtError: unknown;

			try {
				await action();
			} catch (error) {
				caughtError = error;
			}

			expect(caughtError).to.be.instanceOf(Error);
		}

		expect(calls).to.deep.equal([]);
	});
});

describe('writeHumidifierState', () => {
	it('forwards each state only to its matching SDK method', async () => {
		const calls: RecordedCall[] = [];
		const device = createRecordingDevice('DR-HHM001S', calls);

		expect(await writeHumidifierState(device, 'mode', '2')).to.equal(2);
		expect(await writeHumidifierState(device, 'fogLevel', 6)).to.equal(6);
		expect(await writeHumidifierState(device, 'autoTargetHumidity', 90)).to.equal(90);
		expect(await writeHumidifierState(device, 'sleepTargetHumidity', '30')).to.equal(30);
		expect(await writeHumidifierState(device, 'humidityIndicatorLowerThreshold', 35)).to.equal(35);
		expect(await writeHumidifierState(device, 'humidityIndicatorUpperThreshold', '65')).to.equal(65);

		expect(calls).to.deep.equal([
			{
				method: 'setHumidifierMode',
				value: 2,
			},
			{
				method: 'setHumidifierFogLevel',
				value: 6,
			},
			{
				method: 'setHumidifierAutoTargetHumidity',
				value: 90,
			},
			{
				method: 'setHumidifierSleepTargetHumidity',
				value: 30,
			},
			{
				method: 'setHumidifierLowerHumidityThreshold',
				value: 35,
			},
			{
				method: 'setHumidifierUpperHumidityThreshold',
				value: 65,
			},
		]);
	});

	it('forwards explicitly requested identical values', async () => {
		const calls: RecordedCall[] = [];
		const device = createRecordingDevice('DR-HHM001S', calls);

		expect(await writeHumidifierState(device, 'mode', 1)).to.equal(1);
		expect(await writeHumidifierState(device, 'mode', 1)).to.equal(1);

		expect(calls).to.deep.equal([
			{
				method: 'setHumidifierMode',
				value: 1,
			},
			{
				method: 'setHumidifierMode',
				value: 1,
			},
		]);
	});

	it('rejects invalid values without calling the SDK', async () => {
		const calls: RecordedCall[] = [];
		const device = createRecordingDevice('DR-HHM001S', calls);
		let caughtError: unknown;

		try {
			await writeHumidifierState(device, 'fogLevel', 0);
		} catch (error) {
			caughtError = error;
		}

		expect(caughtError).to.be.instanceOf(Error);
		expect((caughtError as Error).message).to.equal('Invalid humidifier fogLevel value for DR-HHM001S: 0');
		expect(calls).to.deep.equal([]);
	});
});
