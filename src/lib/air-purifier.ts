import { isDreoAirPurifierMode, type DreoAirPurifierMode } from '@mehrwiedu/dreo-api';

/**
 * Minimal identity required to distinguish Friendly-State definitions whose
 * generic semantics conflict with the confirmed DR-HAP009S semantics.
 */
export interface FriendlyStateIdentity {
	/** Friendly-State channel identifier. */
	channelId: string;

	/** Friendly-State identifier within the channel. */
	stateId: string;

	/** Native DREO RAW key represented by the definition. */
	rawKey: string;
}

/**
 * Determines whether the reported model is the confirmed air purifier.
 *
 * @param model Reported DREO model identifier.
 * @returns Whether the model is the DR-HAP009S.
 */
export function isAirPurifierModel(model: unknown): boolean {
	return model === 'DR-HAP009S';
}

/** Human-readable ioBroker labels for confirmed air-purifier modes. */
export const AIR_PURIFIER_MODE_STATES: Readonly<Record<DreoAirPurifierMode, string>> = {
	manual: 'Manual',
	'auto-regular': 'Auto',
	turbo: 'Turbo',
	sleep: 'Sleep',
};

/**
 * SDK surface required by the writable air-purifier mode Friendly State.
 */
export interface WritableAirPurifierModeDevice {
	/** Reported DREO model identifier. */
	readonly model: string;

	/**
	 * Sets the native air-purifier operating mode.
	 *
	 * @param mode Confirmed native DR-HAP009S mode.
	 */
	setAirPurifierMode(mode: DreoAirPurifierMode): Promise<void>;
}

/**
 * Validates a semantic air-purifier mode read from the SDK state.
 *
 * Reported values are intentionally not trimmed or translated. Only exact
 * confirmed native values are accepted.
 *
 * @param value Semantic SDK state value.
 * @returns A confirmed mode, or undefined.
 */
export function normalizeAirPurifierMode(value: unknown): DreoAirPurifierMode | undefined {
	return isDreoAirPurifierMode(value) ? value : undefined;
}

/**
 * Normalizes an ioBroker write into a confirmed DR-HAP009S mode.
 *
 * Surrounding whitespace is accepted for user-entered string values. Numeric
 * values, display labels and unsupported models are rejected.
 *
 * @param value Requested ioBroker state value.
 * @param model Reported DREO model identifier.
 * @returns A confirmed native mode, or undefined.
 */
export function normalizeWritableAirPurifierMode(value: unknown, model: unknown): DreoAirPurifierMode | undefined {
	if (!isAirPurifierModel(model) || typeof value !== 'string') {
		return undefined;
	}

	const normalizedValue = value.trim();

	return isDreoAirPurifierMode(normalizedValue) ? normalizedValue : undefined;
}

/**
 * Normalizes and forwards an air-purifier mode write to the public SDK.
 *
 * @param device Writable DREO air purifier.
 * @param value Requested ioBroker state value.
 * @returns The confirmed native mode forwarded to the SDK.
 */
export async function writeAirPurifierModeState(
	device: WritableAirPurifierModeDevice,
	value: unknown,
): Promise<DreoAirPurifierMode> {
	const mode = normalizeWritableAirPurifierMode(value, device.model);

	if (mode === undefined) {
		throw new Error(`Invalid air purifier mode for ${device.model}: ${String(value)}`);
	}

	await device.setAirPurifierMode(mode);

	return mode;
}

/**
 * Detects generic Friendly-State definitions that must not be exposed for the
 * DR-HAP009S because their meaning or value type differs from the confirmed
 * air-purifier semantics.
 *
 * Dedicated air-purifier definitions using the same RAW keys remain possible
 * because the complete channel, state and RAW-key identity is checked.
 *
 * @param model Reported DREO model identifier.
 * @param definition Friendly-State definition identity.
 * @returns Whether the generic definition conflicts with DR-HAP009S semantics.
 */
export function isConflictingGenericAirPurifierFriendlyState(
	model: unknown,
	definition: FriendlyStateIdentity,
): boolean {
	if (!isAirPurifierModel(model)) {
		return false;
	}

	return (
		(definition.channelId === 'fan' && definition.stateId === 'speed' && definition.rawKey === 'windlevel') ||
		(definition.channelId === 'fan' && definition.stateId === 'mode' && definition.rawKey === 'mode') ||
		(definition.channelId === 'moodLight' && definition.stateId === 'on' && definition.rawKey === 'rgblevel')
	);
}
