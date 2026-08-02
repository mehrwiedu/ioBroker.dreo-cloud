import type {
	DreoDirectionalOscillationConfiguration,
	DreoDirectionalOscillationMode,
	DreoSceneConfiguration,
	DreoTimerConfiguration,
} from '@mehrwiedu/dreo-api';

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
 * Determines whether a model uses the confirmed directional `oscmode`
 * semantics.
 *
 * DR-HPF002S currently uses:
 * - 0: off
 * - 1: horizontal
 * - 2: vertical
 * - 3: horizontal and vertical
 *
 * Other product families can assign different meanings to the same RAW key.
 *
 * @param model The reported DREO model identifier.
 * @returns Whether directional oscillation is confirmed for the model.
 */
export function isDirectionalOscillationModel(model: unknown): boolean {
	return model === 'DR-HPF002S';
}

/**
 * Validates a reported directional oscillation mode.
 *
 * @param value The reported mode.
 * @returns A valid mode from 0 to 3, or undefined.
 */
export function normalizeDirectionalOscillationMode(value: unknown): DreoDirectionalOscillationMode | undefined {
	if (typeof value !== 'number' || !Number.isFinite(value) || !Number.isInteger(value) || value < 0 || value > 3) {
		return undefined;
	}

	return value as DreoDirectionalOscillationMode;
}

/**
 * Converts an ioBroker-compatible value into a directional oscillation mode.
 *
 * Numeric strings are accepted, while fractions and values outside 0 to 3
 * are rejected.
 *
 * @param value The requested mode.
 * @returns A valid mode from 0 to 3, or undefined.
 */
export function normalizeWritableDirectionalOscillationMode(
	value: unknown,
): DreoDirectionalOscillationMode | undefined {
	if (typeof value === 'string') {
		const normalizedValue = value.trim();

		if (normalizedValue.length === 0) {
			return undefined;
		}

		return normalizeDirectionalOscillationMode(Number(normalizedValue));
	}

	return normalizeDirectionalOscillationMode(value);
}

/**
 * Reads the effective angle of one directional oscillation axis.
 *
 * Non-preset values reported by the DREO app remain readable. Writing is
 * deliberately restricted separately to the confirmed quick presets.
 *
 * @param configuration The parsed native cruise configuration.
 * @param axis The requested horizontal or vertical axis.
 * @returns A positive whole-number angle, or undefined for invalid data.
 */
export function normalizeDirectionalOscillationAngle(
	configuration: DreoDirectionalOscillationConfiguration | undefined,
	axis: 'horizontal' | 'vertical',
): number | undefined {
	if (!configuration) {
		return undefined;
	}

	const angle = axis === 'horizontal' ? configuration.horizontalAngle : configuration.verticalAngle;

	if (typeof angle !== 'number' || !Number.isFinite(angle) || !Number.isInteger(angle) || angle <= 0) {
		return undefined;
	}

	return angle;
}

/**
 * Converts an ioBroker-compatible value into a confirmed directional
 * oscillation-angle quick preset.
 *
 * Numbers and numeric strings are accepted. Only 30, 60, 90, and 120
 * degrees are writable.
 *
 * @param value The requested angle.
 * @returns A confirmed preset, or undefined.
 */
export function normalizeWritableDirectionalOscillationAngle(value: unknown): 30 | 60 | 90 | 120 | undefined {
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
		![30, 60, 90, 120].includes(normalizedValue)
	) {
		return undefined;
	}

	return normalizedValue as 30 | 60 | 90 | 120;
}

/**
 * Determines whether a Friendly-State value can be acknowledged immediately.
 *
 * Failed writes are restored to the currently confirmed device value.
 * Successful writes are acknowledged only when the confirmed value already
 * equals the normalized written value. Actual value changes remain dependent
 * on a device report.
 *
 * @param confirmedValue The value currently confirmed by the device state.
 * @param writtenValue The normalized value accepted by the write path.
 * @param writeSucceeded Whether the SDK write completed successfully.
 * @returns The value to write with ack=true, or undefined while awaiting a report.
 */
export function selectFriendlyWriteAcknowledgementValue(
	confirmedValue: string | number | boolean | null | undefined,
	writtenValue: string | number | boolean | null | undefined,
	writeSucceeded: boolean,
): string | number | boolean | null | undefined {
	if (confirmedValue === undefined) {
		return undefined;
	}

	if (!writeSucceeded) {
		return confirmedValue;
	}

	return Object.is(confirmedValue, writtenValue) ? confirmedValue : undefined;
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

/**
 * Converts a structured native DREO power timer into a Friendly-State value.
 *
 * @param timer The parsed DREO timer configuration.
 * @param stateId The requested Friendly-State identifier.
 * @returns The Friendly-State value, or undefined for invalid data.
 */
export function normalizePowerTimerValue(
	timer: DreoTimerConfiguration | undefined,
	stateId: string,
): boolean | number | undefined {
	if (!timer || !Number.isFinite(timer.du) || !Number.isInteger(timer.du) || timer.du < 0 || timer.du > 719) {
		return undefined;
	}

	switch (stateId) {
		case 'duration':
			return timer.du;

		case 'active':
			return timer.du > 0;

		default:
			return undefined;
	}
}

/**
 * Normalizes a numeric indicator level whose effective state depends on
 * whether the complete device is powered on.
 *
 * Zero means off. Every positive finite level is treated as on so that
 * possible future or model-specific levels remain readable.
 *
 * @param value The native numeric level.
 * @param powerValue The native device power state.
 * @returns The effective on/off state, or undefined for an invalid level.
 */
export function normalizePowerScopedLevelOnState(value: unknown, powerValue: unknown): boolean | undefined {
	if (typeof value !== 'number' || !Number.isFinite(value) || value < 0) {
		return undefined;
	}

	const levelEnabled = value > 0;

	if (typeof powerValue !== 'boolean') {
		return levelEnabled;
	}

	return powerValue && levelEnabled;
}

/**
 * Selects the native RAW state represented by the Friendly State
 * `display.on`.
 *
 * A dedicated ledlevel control takes precedence when it is accompanied by
 * poweron. Otherwise lighton is used only when it does not represent a
 * complete main light with brightness and color-temperature controls.
 *
 * @param availableRawKeys The RAW capabilities available on the device.
 * @returns The selected RAW key, or undefined when no display control exists.
 */
export function selectDisplayRawKey(availableRawKeys: ReadonlySet<string>): 'ledlevel' | 'lighton' | undefined {
	if (availableRawKeys.has('ledlevel') && availableRawKeys.has('poweron')) {
		return 'ledlevel';
	}

	const hasMainLight =
		availableRawKeys.has('lighton') && availableRawKeys.has('brightness') && availableRawKeys.has('colortemp');

	if (availableRawKeys.has('lighton') && !hasMainLight) {
		return 'lighton';
	}

	return undefined;
}
