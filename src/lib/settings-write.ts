import { normalizeWritableBoolean } from './friendly-state';

export type WritableSettingsStateId = 'mute' | 'childLock' | 'filterInstalled';

/**
 * Public SDK methods required by writable Friendly States in the settings
 * channel.
 */
export interface WritableSettingsDevice {
	/**
	 * Sets the native panel-mute state.
	 *
	 * @param enabled Whether panel sounds should be muted.
	 */
	setMute(enabled: boolean): Promise<void>;

	/**
	 * Sets the native child-lock state.
	 *
	 * @param enabled Whether the child lock should be enabled.
	 */
	setChildLock(enabled: boolean): Promise<void>;

	/**
	 * Confirms whether the humidifier filter is installed.
	 *
	 * @param enabled Whether the installed filter should be marked active.
	 */
	setHumidifierFilterInstalled(enabled: boolean): Promise<void>;
}

/**
 * Identifies the Friendly States under settings that have a confirmed native
 * SDK write method.
 *
 * @param stateId The Friendly-State identifier below the settings channel.
 * @returns Whether the state is writable.
 */
export function isWritableSettingsStateId(stateId: string): stateId is WritableSettingsStateId {
	return stateId === 'mute' || stateId === 'childLock' || stateId === 'filterInstalled';
}

/**
 * Normalizes and forwards a writable boolean settings state to the
 * corresponding public SDK method.
 *
 * @param device The writable DREO device.
 * @param stateId The confirmed writable settings state.
 * @param value The ioBroker state value.
 * @returns The normalized value accepted by the SDK write path.
 */
export async function writeSettingsBooleanState(
	device: WritableSettingsDevice,
	stateId: WritableSettingsStateId,
	value: unknown,
): Promise<boolean> {
	const booleanValue = normalizeWritableBoolean(value);

	if (booleanValue === undefined) {
		throw new Error(`Invalid boolean value: ${String(value)}`);
	}

	if (stateId === 'mute') {
		await device.setMute(booleanValue);
	} else if (stateId === 'childLock') {
		await device.setChildLock(booleanValue);
	} else {
		await device.setHumidifierFilterInstalled(booleanValue);
	}

	return booleanValue;
}
