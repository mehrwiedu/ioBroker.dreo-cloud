import { expect } from 'chai';

import { isWritableSettingsStateId, type WritableSettingsDevice, writeSettingsBooleanState } from './settings-write';

interface RecordedCall {
	method: 'setMute' | 'setChildLock';
	enabled: boolean;
}

function createRecordingDevice(calls: RecordedCall[]): WritableSettingsDevice {
	return {
		setMute: enabled => {
			calls.push({
				method: 'setMute',
				enabled,
			});

			return Promise.resolve();
		},
		setChildLock: enabled => {
			calls.push({
				method: 'setChildLock',
				enabled,
			});

			return Promise.resolve();
		},
	};
}

describe('isWritableSettingsStateId', () => {
	it('accepts mute and child lock but rejects unknown settings', () => {
		expect(isWritableSettingsStateId('mute')).to.equal(true);
		expect(isWritableSettingsStateId('childLock')).to.equal(true);
		expect(isWritableSettingsStateId('unknown')).to.equal(false);
	});
});

describe('writeSettingsBooleanState', () => {
	it('forwards normalized child-lock values only to setChildLock', async () => {
		const calls: RecordedCall[] = [];
		const device = createRecordingDevice(calls);

		expect(await writeSettingsBooleanState(device, 'childLock', true)).to.equal(true);
		expect(await writeSettingsBooleanState(device, 'childLock', '0')).to.equal(false);

		expect(calls).to.deep.equal([
			{
				method: 'setChildLock',
				enabled: true,
			},
			{
				method: 'setChildLock',
				enabled: false,
			},
		]);
	});

	it('preserves the existing mute forwarding', async () => {
		const calls: RecordedCall[] = [];
		const device = createRecordingDevice(calls);

		expect(await writeSettingsBooleanState(device, 'mute', 'true')).to.equal(true);

		expect(calls).to.deep.equal([
			{
				method: 'setMute',
				enabled: true,
			},
		]);
	});

	it('rejects invalid boolean values without calling the SDK', async () => {
		const calls: RecordedCall[] = [];
		const device = createRecordingDevice(calls);
		let caughtError: unknown;

		try {
			await writeSettingsBooleanState(device, 'childLock', 'enabled');
		} catch (error) {
			caughtError = error;
		}

		expect(caughtError).to.be.instanceOf(Error);
		expect((caughtError as Error).message).to.equal('Invalid boolean value: enabled');
		expect(calls).to.deep.equal([]);
	});
});
