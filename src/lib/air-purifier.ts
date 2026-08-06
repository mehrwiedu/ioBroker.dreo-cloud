import {
	isDreoAirPurifierMode,
	isDreoAirQualityLevel,
	type DreoAirPurifierMode,
	type DreoAirQualityLevel,
} from '@mehrwiedu/dreo-api';

import { normalizeWritableBoolean } from './friendly-state';

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
 * SDK surface required by the writable air-purifier fan-level Friendly State.
 */
export interface WritableAirPurifierWindLevelDevice {
	/** Reported DREO model identifier. */
	readonly model: string;

	/**
	 * Sets the native DR-HAP009S fan level.
	 *
	 * @param level Confirmed integer fan level from 1 through 3.
	 */
	setAirPurifierWindLevel(level: number): Promise<void>;
}

/**
 * Validates a semantic DR-HAP009S fan-level value.
 *
 * Read values must already be exact integers in the confirmed range 1–3.
 *
 * @param value Semantic SDK state value.
 * @returns A confirmed fan level, or undefined.
 */
export function normalizeAirPurifierWindLevel(value: unknown): number | undefined {
	if (typeof value !== 'number' || !Number.isInteger(value) || value < 1 || value > 3) {
		return undefined;
	}

	return value;
}

/**
 * Validates an exact semantic DR-HAP009S PM2.5 reading.
 *
 * @param value Semantic SDK state value.
 * @returns A non-negative integer PM2.5 value, or undefined.
 */
export function normalizeAirPurifierPm25(value: unknown): number | undefined {
	if (typeof value !== 'number' || !Number.isFinite(value) || !Number.isInteger(value) || value < 0) {
		return undefined;
	}

	return value;
}

/**
 * Validates an exact semantic DR-HAP009S air-quality level.
 *
 * Human-readable labels are intentionally not added because the complete
 * category mapping has not yet been confirmed.
 *
 * @param value Semantic SDK state value.
 * @returns A confirmed numeric air-quality level from 1 through 4, or undefined.
 */
export function normalizeAirPurifierAirQualityLevel(value: unknown): DreoAirQualityLevel | undefined {
	return isDreoAirQualityLevel(value) ? value : undefined;
}

/**
 * Normalizes an ioBroker write into a confirmed DR-HAP009S fan level.
 *
 * Numeric strings are accepted for ioBroker compatibility. Unsupported
 * models, fractions and values outside 1–3 are rejected.
 *
 * @param value Requested ioBroker state value.
 * @param model Reported DREO model identifier.
 * @returns A confirmed fan level, or undefined.
 */
export function normalizeWritableAirPurifierWindLevel(value: unknown, model: unknown): number | undefined {
	if (!isAirPurifierModel(model)) {
		return undefined;
	}

	let normalizedValue = value;

	if (typeof value === 'string') {
		const trimmedValue = value.trim();

		if (trimmedValue.length === 0) {
			return undefined;
		}

		normalizedValue = Number(trimmedValue);
	}

	return normalizeAirPurifierWindLevel(normalizedValue);
}

/**
 * Normalizes and forwards an air-purifier fan-level write to the public SDK.
 *
 * Mode checks and native command semantics remain inside the SDK. The adapter
 * neither switches modes nor adds power or fan states.
 *
 * @param device Writable DREO air purifier.
 * @param value Requested ioBroker state value.
 * @returns The confirmed fan level forwarded to the SDK.
 */
export async function writeAirPurifierWindLevelState(
	device: WritableAirPurifierWindLevelDevice,
	value: unknown,
): Promise<number> {
	const level = normalizeWritableAirPurifierWindLevel(value, device.model);

	if (level === undefined) {
		throw new Error(`Invalid air purifier fan level for ${device.model}: ${String(value)}`);
	}

	await device.setAirPurifierWindLevel(level);

	return level;
}

/**
 * SDK surface required by the writable air-purifier mood-light states.
 */
export interface WritableAirPurifierMoodLightDevice {
	/** Reported DREO model identifier. */
	readonly model: string;

	/**
	 * Switches the native DR-HAP009S mood light.
	 *
	 * @param enabled Whether the mood light should be enabled.
	 */
	setAirPurifierMoodLight(enabled: boolean): Promise<void>;

	/**
	 * Sets the native DR-HAP009S mood-light level.
	 *
	 * @param level Confirmed integer level from 1 through 3.
	 */
	setAirPurifierMoodLightLevel(level: number): Promise<void>;
}

/**
 * Validates an exact semantic air-purifier boolean state.
 *
 * @param value Semantic SDK state value.
 * @returns The boolean value, or undefined.
 */
export function normalizeAirPurifierBoolean(value: unknown): boolean | undefined {
	return typeof value === 'boolean' ? value : undefined;
}

/**
 * Normalizes a writable air-purifier mood-light switch value.
 *
 * @param value Requested ioBroker state value.
 * @param model Reported DREO model identifier.
 * @returns The normalized boolean, or undefined.
 */
export function normalizeWritableAirPurifierMoodLight(value: unknown, model: unknown): boolean | undefined {
	if (!isAirPurifierModel(model)) {
		return undefined;
	}

	return normalizeWritableBoolean(value);
}

/**
 * Validates an exact semantic DR-HAP009S mood-light level.
 *
 * @param value Semantic SDK state value.
 * @returns An integer level from 1 through 3, or undefined.
 */
export function normalizeAirPurifierMoodLightLevel(value: unknown): number | undefined {
	return normalizeAirPurifierWindLevel(value);
}

/**
 * Normalizes a writable DR-HAP009S mood-light level.
 *
 * @param value Requested ioBroker state value.
 * @param model Reported DREO model identifier.
 * @returns An integer level from 1 through 3, or undefined.
 */
export function normalizeWritableAirPurifierMoodLightLevel(value: unknown, model: unknown): number | undefined {
	return normalizeWritableAirPurifierWindLevel(value, model);
}

/**
 * Normalizes and forwards a mood-light switch write to the public SDK.
 *
 * @param device Writable DREO air purifier.
 * @param value Requested ioBroker state value.
 * @returns The boolean value forwarded to the SDK.
 */
export async function writeAirPurifierMoodLightState(
	device: WritableAirPurifierMoodLightDevice,
	value: unknown,
): Promise<boolean> {
	const enabled = normalizeWritableAirPurifierMoodLight(value, device.model);

	if (enabled === undefined) {
		throw new Error(`Invalid air purifier mood-light state for ${device.model}: ${String(value)}`);
	}

	await device.setAirPurifierMoodLight(enabled);

	return enabled;
}

/**
 * Normalizes and forwards a mood-light level write to the public SDK.
 *
 * Native switch coupling remains entirely inside the SDK.
 *
 * @param device Writable DREO air purifier.
 * @param value Requested ioBroker state value.
 * @returns The level forwarded to the SDK.
 */
export async function writeAirPurifierMoodLightLevelState(
	device: WritableAirPurifierMoodLightDevice,
	value: unknown,
): Promise<number> {
	const level = normalizeWritableAirPurifierMoodLightLevel(value, device.model);

	if (level === undefined) {
		throw new Error(`Invalid air purifier mood-light level for ${device.model}: ${String(value)}`);
	}

	await device.setAirPurifierMoodLightLevel(level);

	return level;
}

/**
 * SDK surface required by the writable air-purifier display state.
 */
export interface WritableAirPurifierDisplayDevice {
	/** Reported DREO model identifier. */
	readonly model: string;

	/**
	 * Switches the native DR-HAP009S display.
	 *
	 * @param enabled Whether the display should be enabled.
	 */
	setAirPurifierDisplay(enabled: boolean): Promise<void>;
}

/**
 * SDK surface required by the writable power-recovery state.
 */
export interface WritableAirPurifierPowerRecoveryDevice {
	/** Reported DREO model identifier. */
	readonly model: string;

	/**
	 * Configures native DR-HAP009S power recovery.
	 *
	 * @param enabled Whether the purifier should resume after power returns.
	 */
	setAirPurifierPowerRecovery(enabled: boolean): Promise<void>;
}

/**
 * Normalizes a writable DR-HAP009S display value.
 *
 * @param value Requested ioBroker state value.
 * @param model Reported DREO model identifier.
 * @returns The normalized boolean, or undefined.
 */
export function normalizeWritableAirPurifierDisplay(value: unknown, model: unknown): boolean | undefined {
	if (!isAirPurifierModel(model)) {
		return undefined;
	}

	return normalizeWritableBoolean(value);
}

/**
 * Normalizes a writable DR-HAP009S power-recovery value.
 *
 * @param value Requested ioBroker state value.
 * @param model Reported DREO model identifier.
 * @returns The normalized boolean, or undefined.
 */
export function normalizeWritableAirPurifierPowerRecovery(value: unknown, model: unknown): boolean | undefined {
	if (!isAirPurifierModel(model)) {
		return undefined;
	}

	return normalizeWritableBoolean(value);
}

/**
 * Normalizes and forwards a display write to the public SDK.
 *
 * @param device Writable DREO air purifier.
 * @param value Requested ioBroker state value.
 * @returns The boolean value forwarded to the SDK.
 */
export async function writeAirPurifierDisplayState(
	device: WritableAirPurifierDisplayDevice,
	value: unknown,
): Promise<boolean> {
	const enabled = normalizeWritableAirPurifierDisplay(value, device.model);

	if (enabled === undefined) {
		throw new Error(`Invalid air purifier display state for ${device.model}: ${String(value)}`);
	}

	await device.setAirPurifierDisplay(enabled);

	return enabled;
}

/**
 * Normalizes and forwards a power-recovery write to the public SDK.
 *
 * @param device Writable DREO air purifier.
 * @param value Requested ioBroker state value.
 * @returns The boolean value forwarded to the SDK.
 */
export async function writeAirPurifierPowerRecoveryState(
	device: WritableAirPurifierPowerRecoveryDevice,
	value: unknown,
): Promise<boolean> {
	const enabled = normalizeWritableAirPurifierPowerRecovery(value, device.model);

	if (enabled === undefined) {
		throw new Error(`Invalid air purifier power-recovery state for ${device.model}: ${String(value)}`);
	}

	await device.setAirPurifierPowerRecovery(enabled);

	return enabled;
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
		(definition.channelId === 'moodLight' && definition.stateId === 'on' && definition.rawKey === 'rgblevel') ||
		(definition.channelId === 'display' &&
			definition.stateId === 'on' &&
			['lighton', 'ledlevel'].includes(definition.rawKey))
	);
}
