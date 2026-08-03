const CEILING_FAN_MODE_STATES: Readonly<Record<string, string>> = {
	1: 'Normal',
	2: 'Natural',
	3: 'Sleep',
	4: 'Reverse',
};

const STAND_FAN_MODE_STATES: Readonly<Record<string, string>> = {
	1: 'Normal',
	2: 'Natural',
	3: 'Sleep',
	4: 'Auto',
	5: 'Turbo',
	6: 'Custom',
};

/**
 * Minimum, maximum, increment, and display labels for a confirmed fan-mode
 * implementation.
 */
export interface ConfirmedFanModeMetadata {
	/** Lowest confirmed native mode value. */
	min: number;

	/** Highest confirmed native mode value. */
	max: number;

	/** Required numeric increment. */
	step: number;

	/** Human-readable ioBroker state labels. */
	states: Record<string, string>;
}

/**
 * SDK surface required by the writable fan-mode Friendly State.
 */
export interface WritableFanModeDevice {
	/** Reported DREO model identifier. */
	readonly model: string;

	/**
	 * Sets the native fan operating mode.
	 *
	 * @param mode Confirmed native mode value.
	 */
	setFanMode(mode: number): Promise<void>;
}

/**
 * Returns the confirmed Friendly-State metadata for a DREO fan model.
 *
 * Models using a different or unconfirmed `mode` semantic deliberately return
 * undefined.
 *
 * @param model The reported DREO model identifier.
 * @returns Confirmed metadata, or undefined for an unsupported model.
 */
export function getConfirmedFanModeMetadata(model: unknown): ConfirmedFanModeMetadata | undefined {
	switch (model) {
		case 'DR-HCF001S':
		case 'DR-HCF007S':
			return {
				min: 1,
				max: 4,
				step: 1,
				states: { ...CEILING_FAN_MODE_STATES },
			};

		case 'DR-HPF002S':
			return {
				min: 1,
				max: 6,
				step: 1,
				states: { ...STAND_FAN_MODE_STATES },
			};

		default:
			return undefined;
	}
}

/**
 * Determines whether the adapter may expose a writable fan-mode state for a
 * model.
 *
 * @param model The reported DREO model identifier.
 * @returns Whether the model has confirmed native fan-mode semantics.
 */
export function isWritableFanModeModel(model: unknown): boolean {
	return getConfirmedFanModeMetadata(model) !== undefined;
}

/**
 * Converts an ioBroker-compatible value into a confirmed native fan mode.
 *
 * Numeric strings are accepted. Fractions, unsupported values, and
 * unconfirmed models are rejected.
 *
 * @param value The requested Friendly-State value.
 * @param model The reported DREO model identifier.
 * @returns A confirmed native mode, or undefined.
 */
export function normalizeWritableFanMode(value: unknown, model: unknown): number | undefined {
	const metadata = getConfirmedFanModeMetadata(model);

	if (!metadata) {
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
		normalizedValue < metadata.min ||
		normalizedValue > metadata.max ||
		metadata.states[String(normalizedValue)] === undefined
	) {
		return undefined;
	}

	return normalizedValue;
}

/**
 * Normalizes and forwards a fan-mode Friendly-State write to the public SDK.
 *
 * @param device The writable DREO fan.
 * @param value The requested ioBroker state value.
 * @returns The normalized mode accepted by the SDK write path.
 */
export async function writeFanModeState(device: WritableFanModeDevice, value: unknown): Promise<number> {
	const mode = normalizeWritableFanMode(value, device.model);

	if (mode === undefined) {
		throw new Error(`Invalid fan mode for ${device.model}: ${String(value)}`);
	}

	await device.setFanMode(mode);

	return mode;
}
