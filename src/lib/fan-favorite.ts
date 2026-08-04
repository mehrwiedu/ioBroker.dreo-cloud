const CEILING_FAN_FAVORITE_STATES: Readonly<Record<string, string>> = {
	0: 'None',
	1: 'Favorite 1',
	2: 'Favorite 2',
	3: 'Favorite 3',
	4: 'Favorite 4',
	5: 'Favorite 5',
};

/**
 * Metadata for the confirmed ceiling-fan favorite implementation.
 *
 * Native value 0 reports that no favorite is currently active. Only slots
 * 1 through 5 are confirmed writable.
 */
export interface ConfirmedFanFavoriteMetadata {
	/** Lowest reportable native value. */
	min: number;

	/** Highest confirmed favorite slot. */
	max: number;

	/** Required numeric increment. */
	step: number;

	/** Generic ioBroker display labels. */
	states: Record<string, string>;
}

/**
 * SDK surface required by the writable favorite Friendly State.
 */
export interface WritableFanFavoriteDevice {
	/** Reported DREO model identifier. */
	readonly model: string;

	/**
	 * Activates a native favorite slot.
	 *
	 * @param slot Confirmed favorite slot from 1 through 5.
	 */
	setFanFavorite(slot: number): Promise<void>;
}

/**
 * Returns confirmed favorite metadata for supported ceiling-fan models.
 *
 * @param model Reported DREO model identifier.
 * @returns Favorite metadata or undefined for an unsupported model.
 */
export function getConfirmedFanFavoriteMetadata(model: unknown): ConfirmedFanFavoriteMetadata | undefined {
	switch (model) {
		case 'DR-HCF001S':
		case 'DR-HCF007S':
			return {
				min: 0,
				max: 5,
				step: 1,
				states: { ...CEILING_FAN_FAVORITE_STATES },
			};

		default:
			return undefined;
	}
}

/**
 * Determines whether a model has confirmed native favorite semantics.
 *
 * @param model Reported DREO model identifier.
 * @returns Whether the model supports the writable favorite state.
 */
export function isWritableFanFavoriteModel(model: unknown): boolean {
	return getConfirmedFanFavoriteMetadata(model) !== undefined;
}

/**
 * Normalizes an ioBroker write into a confirmed favorite slot.
 *
 * Native value 0 is a report-only status and is deliberately rejected.
 * Numeric strings for slots 1 through 5 are accepted.
 *
 * @param value Requested Friendly-State value.
 * @param model Reported DREO model identifier.
 * @returns Confirmed slot or undefined.
 */
export function normalizeWritableFanFavorite(value: unknown, model: unknown): number | undefined {
	if (!isWritableFanFavoriteModel(model)) {
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
		normalizedValue < 1 ||
		normalizedValue > 5
	) {
		return undefined;
	}

	return normalizedValue;
}

/**
 * Normalizes and forwards a favorite write to the SDK.
 *
 * @param device Writable DREO ceiling fan.
 * @param value Requested ioBroker state value.
 * @returns Confirmed slot forwarded to the SDK.
 */
export async function writeFanFavoriteState(device: WritableFanFavoriteDevice, value: unknown): Promise<number> {
	const slot = normalizeWritableFanFavorite(value, device.model);

	if (slot === undefined) {
		throw new Error(`Invalid fan favorite for ${device.model}: ${String(value)}`);
	}

	await device.setFanFavorite(slot);

	return slot;
}
