import type { DreoSceneConfiguration } from '@mehrwiedu/dreo-api';

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

/**
 * Converts a structured DREO sleep-light scene into a Friendly-State value.
 *
 * @param scene The parsed DREO scene configuration.
 * @param stateId The requested Friendly-State identifier.
 * @returns The Friendly-State value, or undefined for invalid data.
 */
export function normalizeSleepLightSceneValue(
	scene: DreoSceneConfiguration | undefined,
	stateId: string,
): boolean | number | undefined {
	if (!scene) {
		return undefined;
	}

	switch (stateId) {
		case 'on':
			return scene.mode === 3;

		case 'duration':
			if (!Number.isFinite(scene.du) || !Number.isInteger(scene.du) || scene.du < 0 || scene.du % 60 !== 0) {
				return undefined;
			}

			return scene.du / 60;

		case 'startBrightness':
			return Number.isFinite(scene.maxbri) ? scene.maxbri : undefined;

		default:
			return undefined;
	}
}

/**
 * Returns a configured duration suitable for restarting the sleep-light scene.
 *
 * @param scene The parsed DREO scene configuration.
 * @returns Whole minutes from 10 to 60, or undefined when no valid duration is configured.
 */
export function getConfiguredSleepLightDurationMinutes(scene: DreoSceneConfiguration | undefined): number | undefined {
	const duration = normalizeSleepLightSceneValue(scene, 'duration');

	if (typeof duration !== 'number' || !Number.isInteger(duration) || duration < 10 || duration > 60) {
		return undefined;
	}

	return duration;
}
