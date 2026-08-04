import { expect } from 'chai';

import {
	isWritableHumidifierModel,
	isWritableHumidifierStateId,
	normalizeWritableHumidifierValue,
	type WritableHumidifierDevice,
	writeHumidifierState,
} from './humidifier-control';

interface RecordedCall {
	method:
		| 'setHumidifierMode'
		| 'setHumidifierFogLevel'
		| 'setHumidifierAutoTargetHumidity'
		| 'setHumidifierSleepTargetHumidity';
	value: number;
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
	};
}

describe('humidifier model and state guards', () => {
	it('accepts only the confirmed humidifier model', () => {
		expect(isWritableHumidifierModel('DR-HHM001S')).to.equal(true);
		expect(isWritableHumidifierModel('DR-HPF002S')).to.equal(false);
		expect(isWritableHumidifierModel('DR-HCF007S')).to.equal(false);
		expect(isWritableHumidifierModel(undefined)).to.equal(false);
	});

	it('accepts exactly the four confirmed Friendly-State identifiers', () => {
		for (const stateId of ['mode', 'fogLevel', 'autoTargetHumidity', 'sleepTargetHumidity']) {
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

describe('writeHumidifierState', () => {
	it('forwards each state only to its matching SDK method', async () => {
		const calls: RecordedCall[] = [];
		const device = createRecordingDevice('DR-HHM001S', calls);

		expect(await writeHumidifierState(device, 'mode', '2')).to.equal(2);
		expect(await writeHumidifierState(device, 'fogLevel', 6)).to.equal(6);
		expect(await writeHumidifierState(device, 'autoTargetHumidity', 90)).to.equal(90);
		expect(await writeHumidifierState(device, 'sleepTargetHumidity', '30')).to.equal(30);

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
