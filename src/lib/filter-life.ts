export type FilterLifeRemainingRawKey = 'filtertime' | 'lifetime';

/**
 * Selects the confirmed native filter-life state for a DREO model.
 *
 * The DR-HHM001S humidifier uses filtertime for its optional cartridge,
 * while the DR-HAP009S air purifier reports required-filter life as lifetime.
 *
 * @param model Reported DREO model identifier.
 * @returns The confirmed native state key, or undefined for unsupported models.
 */
export function getFilterLifeRemainingRawKey(model: unknown): FilterLifeRemainingRawKey | undefined {
	if (model === 'DR-HAP009S') {
		return 'lifetime';
	}

	if (model === 'DR-HHM001S') {
		return 'filtertime';
	}

	return undefined;
}

/**
 * Checks whether a DREO model has confirmed filter-life semantics.
 *
 * @param model Reported DREO model identifier.
 * @returns Whether filter-life semantics are confirmed for the model.
 */
export function isFilterLifeRemainingModel(model: unknown): boolean {
	return getFilterLifeRemainingRawKey(model) !== undefined;
}

/**
 * Validates an exact semantic remaining filter-life percentage.
 *
 * @param value Semantic SDK state value.
 * @returns An integer percentage from 0 through 100, or undefined.
 */
export function normalizeFilterLifeRemaining(value: unknown): number | undefined {
	if (typeof value !== 'number' || !Number.isFinite(value) || !Number.isInteger(value) || value < 0 || value > 100) {
		return undefined;
	}

	return value;
}
