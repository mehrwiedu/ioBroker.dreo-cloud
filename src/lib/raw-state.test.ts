import assert from 'node:assert/strict';

import type { DiscoveredState } from '@mehrwiedu/dreo-api';

import {
	formatDiscoveredRawKeysMessage,
	mapRawStateRole,
	mapRawStateType,
	restoreStoredRawStateMetadata,
} from './raw-state';

function createDiscoveredState(
	overrides: Partial<DiscoveredState> & Pick<DiscoveredState, 'key' | 'valueType'>,
): DiscoveredState {
	const { key, valueType, ...rest } = overrides;

	return {
		writable: false,
		category: 'unknown',
		description: key,
		known: true,
		...rest,
		key,
		valueType,
	};
}

describe('RAW state metadata', () => {
	it('maps SDK value types to the serialized ioBroker RAW-state types', () => {
		assert.equal(mapRawStateType(createDiscoveredState({ key: 'booleanState', valueType: 'boolean' })), 'boolean');
		assert.equal(mapRawStateType(createDiscoveredState({ key: 'numberState', valueType: 'number' })), 'number');
		assert.equal(mapRawStateType(createDiscoveredState({ key: 'stringState', valueType: 'string' })), 'string');
		assert.equal(mapRawStateType(createDiscoveredState({ key: 'objectState', valueType: 'object' })), 'string');
		assert.equal(mapRawStateType(createDiscoveredState({ key: 'unknownState', valueType: 'unknown' })), 'string');
	});

	it('uses specific official ioBroker roles for known diagnostic and information states', () => {
		assert.equal(
			mapRawStateRole(
				createDiscoveredState({
					key: 'connected',
					valueType: 'boolean',
					category: 'diagnostic',
				}),
			),
			'indicator.reachable',
		);

		assert.equal(
			mapRawStateRole(
				createDiscoveredState({
					key: 'wifi_rssi',
					valueType: 'number',
					category: 'diagnostic',
				}),
			),
			'value.rssi',
		);

		assert.equal(
			mapRawStateRole(createDiscoveredState({ key: 'module_firmware_version', valueType: 'string' })),
			'info.firmware',
		);
		assert.equal(
			mapRawStateRole(createDiscoveredState({ key: 'mcu_firmware_version', valueType: 'string' })),
			'info.firmware',
		);
		assert.equal(
			mapRawStateRole(createDiscoveredState({ key: 'module_hardware_model', valueType: 'string' })),
			'info.hardware',
		);
		assert.equal(
			mapRawStateRole(createDiscoveredState({ key: 'mcu_hardware_model', valueType: 'string' })),
			'info.hardware',
		);
		assert.equal(
			mapRawStateRole(createDiscoveredState({ key: 'module_hardware_mac', valueType: 'string' })),
			'info.mac',
		);
		assert.equal(
			mapRawStateRole(createDiscoveredState({ key: 'temperature', valueType: 'number' })),
			'value.temperature',
		);
	});

	it('uses json for serialized object-like RAW states', () => {
		assert.equal(
			mapRawStateRole(
				createDiscoveredState({
					key: 'timeron',
					valueType: 'object',
					category: 'information',
					constraint: { type: 'object' },
				}),
			),
			'json',
		);

		assert.equal(
			mapRawStateRole(
				createDiscoveredState({
					key: 'timeroff',
					valueType: 'string',
					category: 'information',
					constraint: { type: 'object' },
				}),
			),
			'json',
		);
	});

	it('falls back to roles compatible with the exposed ioBroker state type', () => {
		assert.equal(mapRawStateRole(createDiscoveredState({ key: 'someBoolean', valueType: 'boolean' })), 'indicator');
		assert.equal(mapRawStateRole(createDiscoveredState({ key: 'someNumber', valueType: 'number' })), 'value');
		assert.equal(mapRawStateRole(createDiscoveredState({ key: 'someString', valueType: 'string' })), 'text');
		assert.equal(mapRawStateRole(createDiscoveredState({ key: 'someUnknown', valueType: 'unknown' })), 'text');

		assert.equal(
			mapRawStateRole(
				createDiscoveredState({
					key: 'wifi_ssid',
					valueType: 'string',
					category: 'diagnostic',
				}),
			),
			'text',
		);
	});
});

describe('restoreStoredRawStateMetadata', () => {
	it('restores metadata for a previously runtime-discovered RAW state', () => {
		assert.deepEqual(
			restoreStoredRawStateMetadata({
				key: 'rssi',
				category: 'diagnostic',
				known: false,
				valueType: 'string',
				constraint: {
					type: 'string',
				},
			}),
			{
				key: 'rssi',
				description: 'rssi',
				writable: false,
				category: 'diagnostic',
				known: false,
				valueType: 'string',
				constraint: {
					type: 'string',
				},
			},
		);
	});

	it('falls back safely for optional stored metadata', () => {
		assert.deepEqual(
			restoreStoredRawStateMetadata({
				key: 'futureState',
				category: 'unexpected-category',
				known: true,
				valueType: 'number',
				constraint: {
					type: 'unexpected-type',
				},
			}),
			{
				key: 'futureState',
				description: 'futureState',
				writable: false,
				category: 'unknown',
				known: true,
				valueType: 'number',
			},
		);
	});

	it('rejects stored metadata without a usable key or value type', () => {
		assert.equal(
			restoreStoredRawStateMetadata({
				key: '',
				valueType: 'string',
			}),
			undefined,
		);

		assert.equal(
			restoreStoredRawStateMetadata({
				key: 'rssi',
				valueType: 'invalid',
			}),
			undefined,
		);
	});
});

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
