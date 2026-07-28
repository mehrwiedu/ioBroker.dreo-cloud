/**
 * Normalizes an on/off state whose effective value may depend on the device power state.
 *
 * Devices without a separate power state use the target state directly.
 *
 * @param targetValue The raw target state value.
 * @param powerValue The raw device power state value, if available.
 * @returns The effective boolean state.
 */
export function normalizePowerScopedOnState(targetValue: unknown, powerValue: unknown): boolean {
	const isTargetEnabled = typeof targetValue === 'boolean' ? targetValue : Boolean(targetValue);

	if (powerValue === undefined) {
		return isTargetEnabled;
	}

	const isPowered = typeof powerValue === 'boolean' ? powerValue : Boolean(powerValue);

	return isPowered && isTargetEnabled;
}

/**
 * Converts an ioBroker-compatible state value into an unambiguous boolean.
 *
 * @param value The state value to normalize.
 * @returns The normalized boolean, or undefined when the value is ambiguous.
 */
export function normalizeWritableBoolean(value: unknown): boolean | undefined {
	if (typeof value === 'boolean') {
		return value;
	}

	if (value === 1 || value === '1') {
		return true;
	}

	if (value === 0 || value === '0') {
		return false;
	}

	if (typeof value === 'string') {
		const normalizedValue = value.trim().toLowerCase();

		if (normalizedValue === 'true') {
			return true;
		}

		if (normalizedValue === 'false') {
			return false;
		}
	}

	return undefined;
}
