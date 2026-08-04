import { expect } from 'chai';

import {
	getConfirmedFanFavoriteMetadata,
	isWritableFanFavoriteModel,
	normalizeWritableFanFavorite,
	type WritableFanFavoriteDevice,
	writeFanFavoriteState,
} from './fan-favorite';

function createRecordingDevice(model: string, calls: number[]): WritableFanFavoriteDevice {
	return {
		model,
		setFanFavorite: slot => {
			calls.push(slot);

			return Promise.resolve();
		},
	};
}

describe('getConfirmedFanFavoriteMetadata', () => {
	it('describes both confirmed ceiling-fan models', () => {
		for (const model of ['DR-HCF001S', 'DR-HCF007S']) {
			expect(getConfirmedFanFavoriteMetadata(model)).to.deep.equal({
				min: 0,
				max: 5,
				step: 1,
				states: {
					0: 'None',
					1: 'Favorite 1',
					2: 'Favorite 2',
					3: 'Favorite 3',
					4: 'Favorite 4',
					5: 'Favorite 5',
				},
			});
		}
	});

	it('does not expose favorite semantics for other device categories', () => {
		expect(getConfirmedFanFavoriteMetadata('DR-HPF002S')).to.equal(undefined);
		expect(getConfirmedFanFavoriteMetadata('DR-HHM001S')).to.equal(undefined);
		expect(isWritableFanFavoriteModel('DR-HCF007S')).to.equal(true);
		expect(isWritableFanFavoriteModel('DR-HPF002S')).to.equal(false);
	});
});

describe('normalizeWritableFanFavorite', () => {
	it('accepts confirmed slots and numeric strings', () => {
		expect(normalizeWritableFanFavorite(1, 'DR-HCF001S')).to.equal(1);
		expect(normalizeWritableFanFavorite(' 3 ', 'DR-HCF007S')).to.equal(3);
		expect(normalizeWritableFanFavorite(5, 'DR-HCF007S')).to.equal(5);
	});

	it('rejects report-only zero and invalid values', () => {
		expect(normalizeWritableFanFavorite(0, 'DR-HCF007S')).to.equal(undefined);
		expect(normalizeWritableFanFavorite('0', 'DR-HCF007S')).to.equal(undefined);
		expect(normalizeWritableFanFavorite(6, 'DR-HCF007S')).to.equal(undefined);
		expect(normalizeWritableFanFavorite(2.5, 'DR-HCF007S')).to.equal(undefined);
		expect(normalizeWritableFanFavorite('', 'DR-HCF007S')).to.equal(undefined);
		expect(normalizeWritableFanFavorite('favorite 2', 'DR-HCF007S')).to.equal(undefined);
		expect(normalizeWritableFanFavorite(1, 'DR-HPF002S')).to.equal(undefined);
	});
});

describe('writeFanFavoriteState', () => {
	it('forwards only the normalized slot to setFanFavorite', async () => {
		const calls: number[] = [];
		const device = createRecordingDevice('DR-HCF007S', calls);

		expect(await writeFanFavoriteState(device, '2')).to.equal(2);
		expect(await writeFanFavoriteState(device, 5)).to.equal(5);
		expect(calls).to.deep.equal([2, 5]);
	});

	it('rejects invalid values without calling the SDK', async () => {
		const calls: number[] = [];
		const device = createRecordingDevice('DR-HCF001S', calls);
		let caughtError: unknown;

		try {
			await writeFanFavoriteState(device, 0);
		} catch (error) {
			caughtError = error;
		}

		expect(caughtError).to.be.instanceOf(Error);
		expect((caughtError as Error).message).to.equal('Invalid fan favorite for DR-HCF001S: 0');
		expect(calls).to.deep.equal([]);
	});
});
