import { expect } from 'chai';

import {
	getConfirmedFanModeMetadata,
	isWritableFanModeModel,
	normalizeWritableFanMode,
	type WritableFanModeDevice,
	writeFanModeState,
} from './fan-mode';

function createRecordingDevice(model: string, calls: number[]): WritableFanModeDevice {
	return {
		model,
		setFanMode: mode => {
			calls.push(mode);

			return Promise.resolve();
		},
	};
}

describe('getConfirmedFanModeMetadata', () => {
	it('describes both confirmed ceiling-fan models', () => {
		for (const model of ['DR-HCF001S', 'DR-HCF007S']) {
			expect(getConfirmedFanModeMetadata(model)).to.deep.equal({
				min: 1,
				max: 4,
				step: 1,
				states: {
					1: 'Normal',
					2: 'Natural',
					3: 'Sleep',
					4: 'Reverse',
				},
			});
		}
	});

	it('describes the confirmed stand-fan modes', () => {
		expect(getConfirmedFanModeMetadata('DR-HPF002S')).to.deep.equal({
			min: 1,
			max: 6,
			step: 1,
			states: {
				1: 'Normal',
				2: 'Natural',
				3: 'Sleep',
				4: 'Auto',
				5: 'Turbo',
				6: 'Custom',
			},
		});
	});

	it('does not assign fan semantics to another device category', () => {
		expect(getConfirmedFanModeMetadata('DR-HSH034S')).to.equal(undefined);
		expect(isWritableFanModeModel('DR-HSH034S')).to.equal(false);
		expect(isWritableFanModeModel('DR-HCF007S')).to.equal(true);
		expect(isWritableFanModeModel('DR-HPF002S')).to.equal(true);
	});
});

describe('normalizeWritableFanMode', () => {
	it('accepts confirmed numeric values and numeric strings', () => {
		expect(normalizeWritableFanMode(1, 'DR-HCF007S')).to.equal(1);
		expect(normalizeWritableFanMode(' 4 ', 'DR-HCF007S')).to.equal(4);
		expect(normalizeWritableFanMode(6, 'DR-HPF002S')).to.equal(6);
		expect(normalizeWritableFanMode('5', 'DR-HPF002S')).to.equal(5);
	});

	it('rejects unsupported, fractional, and model-incompatible values', () => {
		expect(normalizeWritableFanMode(0, 'DR-HCF007S')).to.equal(undefined);
		expect(normalizeWritableFanMode(5, 'DR-HCF007S')).to.equal(undefined);
		expect(normalizeWritableFanMode(1.5, 'DR-HPF002S')).to.equal(undefined);
		expect(normalizeWritableFanMode(7, 'DR-HPF002S')).to.equal(undefined);
		expect(normalizeWritableFanMode('natural', 'DR-HPF002S')).to.equal(undefined);
		expect(normalizeWritableFanMode(1, 'DR-HSH034S')).to.equal(undefined);
	});
});

describe('writeFanModeState', () => {
	it('forwards only the normalized mode to setFanMode', async () => {
		const calls: number[] = [];
		const device = createRecordingDevice('DR-HPF002S', calls);

		expect(await writeFanModeState(device, '6')).to.equal(6);
		expect(await writeFanModeState(device, 1)).to.equal(1);
		expect(calls).to.deep.equal([6, 1]);
	});

	it('rejects invalid values without calling the SDK', async () => {
		const calls: number[] = [];
		const device = createRecordingDevice('DR-HCF007S', calls);
		let caughtError: unknown;

		try {
			await writeFanModeState(device, 5);
		} catch (error) {
			caughtError = error;
		}

		expect(caughtError).to.be.instanceOf(Error);
		expect((caughtError as Error).message).to.equal('Invalid fan mode for DR-HCF007S: 5');
		expect(calls).to.deep.equal([]);
	});
});
