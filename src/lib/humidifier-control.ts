/**
 * Friendly-State identifiers confirmed for the DR-HHM001S and DR-HHM003S humidifiers.
 */
export type WritableHumidifierStateId =
	| 'mode'
	| 'fogLevel'
	| 'autoTargetHumidity'
	| 'sleepTargetHumidity'
	| 'humidityIndicatorLowerThreshold'
	| 'humidityIndicatorUpperThreshold';

/**
 * Public SDK surface required by the writable humidifier Friendly States.
 */
export interface WritableHumidifierDevice {
	/** Reported DREO model identifier. */
	readonly model: string;

	/** Sets native humidifier mode 0, 1, or 2. */
	setHumidifierMode(mode: number): Promise<void>;

	/** Sets manual fog output from 1 through 6. */
	setHumidifierFogLevel(level: number): Promise<void>;

	/** Sets automatic-mode target humidity from 30 through 90 percent. */
	setHumidifierAutoTargetHumidity(humidity: number): Promise<void>;

	/** Sets sleep-mode target humidity from 30 through 90 percent. */
	setHumidifierSleepTargetHumidity(humidity: number): Promise<void>;

	/** Sets the lower humidity-indicator threshold from 15 through 80 percent. */
	setHumidifierLowerHumidityThreshold(threshold: number): Promise<void>;

	/** Sets the upper humidity-indicator threshold from 20 through 85 percent. */
	setHumidifierUpperHumidityThreshold(threshold: number): Promise<void>;

	/** Switches the DR-HHM003S warm-mist heater. */
	setHumidifierWarmMist(enabled: boolean): Promise<void>;

	/** Sets the DR-HHM003S mood-light level from 0 through 2. */
	setHumidifierMoodLightLevel(level: number): Promise<void>;

	/** Sets the DR-HHM003S display level from 0 through 2. */
	setHumidifierDisplayLevel(level: number): Promise<void>;
}

interface HumidifierValueRange {
	min: number;
	max: number;
}

const HUMIDIFIER_VALUE_RANGES: Readonly<Record<WritableHumidifierStateId, HumidifierValueRange>> = {
	mode: {
		min: 0,
		max: 2,
	},
	fogLevel: {
		min: 1,
		max: 6,
	},
	autoTargetHumidity: {
		min: 30,
		max: 90,
	},
	sleepTargetHumidity: {
		min: 30,
		max: 90,
	},
	humidityIndicatorLowerThreshold: {
		min: 15,
		max: 80,
	},
	humidityIndicatorUpperThreshold: {
		min: 20,
		max: 85,
	},
};

/**
 * Determines whether a model has confirmed writable humidifier semantics.
 *
 * @param model Reported DREO model identifier.
 * @returns Whether the model has confirmed shared humidifier semantics.
 */
export function isWritableHumidifierModel(model: unknown): boolean {
	return model === 'DR-HHM001S' || model === 'DR-HHM003S';
}

/**
 * Determines whether a model has confirmed DR-HHM003S-only controls.
 *
 * @param model Reported DREO model identifier.
 * @returns Whether the model is the confirmed DR-HHM003S.
 */
export function isHhm003sHumidifierModel(model: unknown): boolean {
	return model === 'DR-HHM003S';
}

/**
 * Determines whether an identifier belongs to the confirmed humidifier write
 * surface.
 *
 * @param stateId Friendly-State identifier.
 * @returns Whether the identifier is writable through the humidifier SDK API.
 */
export function isWritableHumidifierStateId(stateId: string): stateId is WritableHumidifierStateId {
	return Object.prototype.hasOwnProperty.call(HUMIDIFIER_VALUE_RANGES, stateId);
}

/**
 * Converts an ioBroker-compatible value into a confirmed humidifier value.
 *
 * Numeric strings are accepted. Fractions, malformed values, values outside
 * the state-specific range, and writes for unsupported models are rejected.
 *
 * @param value Requested Friendly-State value.
 * @param stateId Humidifier Friendly-State identifier.
 * @param model Reported DREO model identifier.
 * @returns A confirmed integer value, or undefined.
 */
export function normalizeWritableHumidifierValue(value: unknown, stateId: string, model: unknown): number | undefined {
	if (!isWritableHumidifierModel(model) || !isWritableHumidifierStateId(stateId)) {
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

	const range = HUMIDIFIER_VALUE_RANGES[stateId];

	if (
		typeof normalizedValue !== 'number' ||
		!Number.isFinite(normalizedValue) ||
		!Number.isInteger(normalizedValue) ||
		normalizedValue < range.min ||
		normalizedValue > range.max
	) {
		return undefined;
	}

	return normalizedValue;
}

/**
 * Normalizes a DR-HHM003S indicator level.
 *
 * Confirmed values are 0 (off), 1 (low), and 2 (high).
 *
 * @param value Requested Friendly-State value.
 * @param model Reported DREO model identifier.
 * @returns A confirmed level, or undefined.
 */
export function normalizeWritableHhm003sHumidifierLevel(value: unknown, model: unknown): number | undefined {
	if (!isHhm003sHumidifierModel(model)) {
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

	if (
		typeof normalizedValue !== 'number' ||
		!Number.isFinite(normalizedValue) ||
		!Number.isInteger(normalizedValue) ||
		normalizedValue < 0 ||
		normalizedValue > 2
	) {
		return undefined;
	}

	return normalizedValue;
}

/**
 * Normalizes and forwards the DR-HHM003S warm-mist switch.
 *
 * @param device Writable DREO humidifier.
 * @param value Requested ioBroker value.
 * @returns The normalized boolean value.
 */
export async function writeHhm003sWarmMistState(device: WritableHumidifierDevice, value: unknown): Promise<boolean> {
	if (!isHhm003sHumidifierModel(device.model)) {
		throw new Error(`Warm mist is not supported for ${device.model}.`);
	}

	let normalizedValue: boolean | undefined;

	if (typeof value === 'boolean') {
		normalizedValue = value;
	} else if (value === 1 || value === '1' || value === 'true') {
		normalizedValue = true;
	} else if (value === 0 || value === '0' || value === 'false') {
		normalizedValue = false;
	}

	if (normalizedValue === undefined) {
		throw new Error(`Invalid humidifier warmMist value for ${device.model}: ${String(value)}`);
	}

	await device.setHumidifierWarmMist(normalizedValue);

	return normalizedValue;
}

/**
 * Normalizes and forwards the DR-HHM003S mood-light level.
 *
 * @param device Writable DREO humidifier.
 * @param value Requested ioBroker value.
 * @returns The normalized level.
 */
export async function writeHhm003sMoodLightLevelState(
	device: WritableHumidifierDevice,
	value: unknown,
): Promise<number> {
	const normalizedValue = normalizeWritableHhm003sHumidifierLevel(value, device.model);

	if (normalizedValue === undefined) {
		throw new Error(`Invalid humidifier moodLight level for ${device.model}: ${String(value)}`);
	}

	await device.setHumidifierMoodLightLevel(normalizedValue);

	return normalizedValue;
}

/**
 * Normalizes and forwards the DR-HHM003S display level.
 *
 * @param device Writable DREO humidifier.
 * @param value Requested ioBroker value.
 * @returns The normalized level.
 */
export async function writeHhm003sDisplayLevelState(device: WritableHumidifierDevice, value: unknown): Promise<number> {
	const normalizedValue = normalizeWritableHhm003sHumidifierLevel(value, device.model);

	if (normalizedValue === undefined) {
		throw new Error(`Invalid humidifier display level for ${device.model}: ${String(value)}`);
	}

	await device.setHumidifierDisplayLevel(normalizedValue);

	return normalizedValue;
}

/**
 * Normalizes and forwards a humidifier Friendly-State write to the matching
 * public SDK method.
 *
 * The adapter does not switch modes automatically and does not synthesize
 * writes to power, display, mood light, mute, or another humidity setting.
 *
 * @param device Writable DREO humidifier.
 * @param stateId Humidifier Friendly-State identifier.
 * @param value Requested ioBroker value.
 * @returns The normalized value accepted by the SDK.
 */
export async function writeHumidifierState(
	device: WritableHumidifierDevice,
	stateId: string,
	value: unknown,
): Promise<number> {
	const normalizedValue = normalizeWritableHumidifierValue(value, stateId, device.model);

	if (normalizedValue === undefined || !isWritableHumidifierStateId(stateId)) {
		throw new Error(`Invalid humidifier ${stateId} value for ${device.model}: ${String(value)}`);
	}

	switch (stateId) {
		case 'mode':
			await device.setHumidifierMode(normalizedValue);
			break;

		case 'fogLevel':
			await device.setHumidifierFogLevel(normalizedValue);
			break;

		case 'autoTargetHumidity':
			await device.setHumidifierAutoTargetHumidity(normalizedValue);
			break;

		case 'sleepTargetHumidity':
			await device.setHumidifierSleepTargetHumidity(normalizedValue);
			break;

		case 'humidityIndicatorLowerThreshold':
			await device.setHumidifierLowerHumidityThreshold(normalizedValue);
			break;

		case 'humidityIndicatorUpperThreshold':
			await device.setHumidifierUpperHumidityThreshold(normalizedValue);
			break;
	}

	return normalizedValue;
}
