/**
 * Creates a deterministic log message for RAW keys first discovered during
 * runtime.
 *
 * @param deviceName Human-readable DREO device name.
 * @param keys Newly discovered native state keys.
 * @returns A formatted message, or undefined when no keys were supplied.
 */
export function formatDiscoveredRawKeysMessage(deviceName: string, keys: readonly string[]): string | undefined {
	const uniqueKeys = [...new Set(keys)].sort((left, right) => left.localeCompare(right));

	if (uniqueKeys.length === 0) {
		return undefined;
	}

	const keyLabel = uniqueKeys.length === 1 ? 'key' : 'keys';

	return `Discovered ${uniqueKeys.length} new DREO RAW ${keyLabel} for ${deviceName}: ${uniqueKeys.join(', ')}.`;
}
