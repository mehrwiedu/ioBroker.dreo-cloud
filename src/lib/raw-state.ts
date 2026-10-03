import type { DiscoveredState } from '@mehrwiedu/dreo-api';

export type RawStateType = 'boolean' | 'number' | 'string' | 'mixed';

const RAW_STATE_ROLES_BY_KEY: Readonly<Record<string, string>> = {
	connected: 'indicator.reachable',
	wifi_rssi: 'value.rssi',
	module_firmware_version: 'info.firmware',
	mcu_firmware_version: 'info.firmware',
	module_hardware_model: 'info.hardware',
	mcu_hardware_model: 'info.hardware',
	module_hardware_mac: 'info.mac',
	temperature: 'value.temperature',
};

/**
 * Maps the SDK RAW-state value type to the ioBroker state type used by the
 * adapter. Object-like and unknown values are serialized before being written,
 * therefore they are exposed as strings.
 *
 * @param state Discovered SDK state metadata.
 * @returns ioBroker type used for the RAW state.
 */
export function mapRawStateType(state: DiscoveredState): RawStateType {
	switch (state.valueType) {
		case 'boolean':
			return 'boolean';

		case 'number':
			return 'number';

		case 'string':
			return 'string';

		case 'object':
		case 'unknown':
		default:
			return 'string';
	}
}

/**
 * Maps a discovered DREO RAW state to an ioBroker-compatible role.
 *
 * Known diagnostic/information states use specific semantic roles where an
 * official ioBroker role exists. Other RAW states fall back to a role matching
 * their exposed ioBroker type without inventing additional semantics.
 *
 * @param state Discovered SDK state metadata.
 * @returns ioBroker role used for the RAW state.
 */
export function mapRawStateRole(state: DiscoveredState): string {
	const explicitRole = RAW_STATE_ROLES_BY_KEY[state.key];

	if (explicitRole) {
		return explicitRole;
	}

	if (state.valueType === 'object' || state.constraint?.type === 'object') {
		return 'json';
	}

	switch (mapRawStateType(state)) {
		case 'boolean':
			return 'indicator';

		case 'number':
			return 'value';

		case 'string':
		case 'mixed':
		default:
			return 'text';
	}
}

const RAW_STATE_VALUE_TYPES = new Set<DiscoveredState['valueType']>([
	'boolean',
	'number',
	'string',
	'object',
	'unknown',
]);

const RAW_STATE_CATEGORIES = new Set<DiscoveredState['category']>([
	'control',
	'sensor',
	'diagnostic',
	'configuration',
	'information',
	'unknown',
]);

function isRecord(value: unknown): value is Record<string, unknown> {
	return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function isRawStateValueType(value: unknown): value is DiscoveredState['valueType'] {
	return typeof value === 'string' && RAW_STATE_VALUE_TYPES.has(value as DiscoveredState['valueType']);
}

function isRawStateCategory(value: unknown): value is DiscoveredState['category'] {
	return typeof value === 'string' && RAW_STATE_CATEGORIES.has(value as DiscoveredState['category']);
}

function restoreStoredRawStateConstraint(value: unknown): DiscoveredState['constraint'] {
	if (!isRecord(value) || !isRawStateValueType(value.type)) {
		return undefined;
	}

	switch (value.type) {
		case 'boolean':
			return { type: 'boolean' };

		case 'number':
			return { type: 'number' };

		case 'string':
			return { type: 'string' };

		case 'object':
			return { type: 'object' };

		case 'unknown':
			return { type: 'unknown' };
	}
}

/**
 * Restores the SDK metadata required to refresh an already stored RAW object.
 *
 * Runtime-discovered RAW states can survive an adapter upgrade even when the
 * corresponding key is not part of the next startup snapshot. Their native
 * metadata is therefore used to refresh ioBroker type and role information.
 *
 * @param native Stored ioBroker native metadata.
 * @returns Restored RAW-state metadata, or undefined for unusable metadata.
 */
export function restoreStoredRawStateMetadata(native: unknown): DiscoveredState | undefined {
	if (
		!isRecord(native) ||
		typeof native.key !== 'string' ||
		native.key.trim().length === 0 ||
		!isRawStateValueType(native.valueType)
	) {
		return undefined;
	}

	const constraint = restoreStoredRawStateConstraint(native.constraint);

	return {
		key: native.key,
		description: native.key,
		writable: false,
		category: isRawStateCategory(native.category) ? native.category : 'unknown',
		known: native.known === true,
		valueType: native.valueType,
		...(constraint ? { constraint } : {}),
	};
}

/**
 * Creates a deterministic log message for RAW keys first discovered during
 * runtime.
 *
 * @param deviceName Human-readable DREO device name.
 * @param keys Newly discovered native state keys.
 * @returns A formatted message, or undefined when no keys were supplied.
 */
export function formatDiscoveredRawKeysMessage(deviceName: string, keys: readonly string[]): string | undefined {
	const uniqueKeys = [...new Set(keys)].sort((left, right) => left.localeCompare(right));

	if (uniqueKeys.length === 0) {
		return undefined;
	}

	const keyLabel = uniqueKeys.length === 1 ? 'key' : 'keys';

	return `Discovered ${uniqueKeys.length} new DREO RAW ${keyLabel} for ${deviceName}: ${uniqueKeys.join(', ')}.`;
}
