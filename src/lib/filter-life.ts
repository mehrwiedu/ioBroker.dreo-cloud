/**
 * Checks whether a DREO model has confirmed filter-life semantics.
 *
 * Both the DR-HAP009S air purifier and DR-HHM001S humidifier report the
 * remaining filter life through the native filtertime state.
 *
 * @param model Reported DREO model identifier.
 * @returns Whether filter-life semantics are confirmed for the model.
 */
export function isFilterLifeRemainingModel(model: unknown): boolean {
	return model === 'DR-HAP009S' || model === 'DR-HHM001S';
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
