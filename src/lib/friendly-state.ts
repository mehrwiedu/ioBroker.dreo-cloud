export function normalizePowerScopedOnState(
	targetValue: unknown,
	powerValue: unknown,
): boolean {
	const isTargetEnabled = typeof targetValue === 'boolean' ? targetValue : Boolean(targetValue);

	if (powerValue === undefined) {
		return isTargetEnabled;
	}

	const isPowered = typeof powerValue === 'boolean' ? powerValue : Boolean(powerValue);

	return isPowered && isTargetEnabled;
}
