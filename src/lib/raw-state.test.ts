import assert from 'node:assert/strict';

import { formatDiscoveredRawKeysMessage } from './raw-state';

describe('formatDiscoveredRawKeysMessage', () => {
	it('returns no message without discovered keys', () => {
		assert.equal(formatDiscoveredRawKeysMessage('Test device', []), undefined);
	});

	it('includes the concrete key for a single runtime discovery', () => {
		assert.equal(
			formatDiscoveredRawKeysMessage('Ventilator Büro', ['rssi']),
			'Discovered 1 new DREO RAW key for Ventilator Büro: rssi.',
		);
	});

	it('sorts and deduplicates multiple discovered keys', () => {
		assert.equal(
			formatDiscoveredRawKeysMessage('Luftbefeuchter', ['wifi', 'rssi', 'wifi']),
			'Discovered 2 new DREO RAW keys for Luftbefeuchter: rssi, wifi.',
		);
	});
});
