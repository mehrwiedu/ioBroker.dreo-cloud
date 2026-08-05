/**
 * Minimal identity required to distinguish Friendly-State definitions whose
 * generic semantics conflict with the confirmed DR-HAP009S semantics.
 */
export interface FriendlyStateIdentity {
	/** Friendly-State channel identifier. */
	channelId: string;

	/** Friendly-State identifier within the channel. */
	stateId: string;

	/** Native DREO RAW key represented by the definition. */
	rawKey: string;
}

/**
 * Determines whether the reported model is the confirmed air purifier.
 *
 * @param model Reported DREO model identifier.
 * @returns Whether the model is the DR-HAP009S.
 */
export function isAirPurifierModel(model: unknown): boolean {
	return model === 'DR-HAP009S';
}

/**
 * Detects generic Friendly-State definitions that must not be exposed for the
 * DR-HAP009S because their meaning or value type differs from the confirmed
 * air-purifier semantics.
 *
 * Dedicated air-purifier definitions using the same RAW keys remain possible
 * because the complete channel, state and RAW-key identity is checked.
 *
 * @param model Reported DREO model identifier.
 * @param definition Friendly-State definition identity.
 * @returns Whether the generic definition conflicts with DR-HAP009S semantics.
 */
export function isConflictingGenericAirPurifierFriendlyState(
	model: unknown,
	definition: FriendlyStateIdentity,
): boolean {
	if (!isAirPurifierModel(model)) {
		return false;
	}

	return (
		(definition.channelId === 'fan' && definition.stateId === 'speed' && definition.rawKey === 'windlevel') ||
		(definition.channelId === 'fan' && definition.stateId === 'mode' && definition.rawKey === 'mode') ||
		(definition.channelId === 'moodLight' && definition.stateId === 'on' && definition.rawKey === 'rgblevel')
	);
}
