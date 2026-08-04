/**
 * Friendly-State identifiers confirmed for the DR-HHM001S humidifier.
 */
export type WritableHumidifierStateId = 'mode' | 'fogLevel' | 'autoTargetHumidity' | 'sleepTargetHumidity';

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
};

/**
 * Determines whether a model has confirmed writable humidifier semantics.
 *
 * @param model Reported DREO model identifier.
 * @returns Whether the model is the confirmed DR-HHM001S.
 */
export function isWritableHumidifierModel(model: unknown): boolean {
	return model === 'DR-HHM001S';
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
	}

	return normalizedValue;
}
