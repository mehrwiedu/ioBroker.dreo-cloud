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
