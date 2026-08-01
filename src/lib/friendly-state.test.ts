import { expect } from 'chai';

import {
	getConfiguredSleepLightDurationMinutes,
	normalizePowerScopedOnState,
	normalizeSleepLightSceneValue,
	normalizeWritableBoolean,
} from './friendly-state';

describe('normalizePowerScopedOnState', () => {
	it('returns true when power and target state are enabled', () => {
		expect(normalizePowerScopedOnState(true, true)).to.equal(true);
	});

	it('returns false when power is disabled although the target state is enabled', () => {
		expect(normalizePowerScopedOnState(true, false)).to.equal(false);
	});

	it('returns false when the target state is disabled although power is enabled', () => {
		expect(normalizePowerScopedOnState(false, true)).to.equal(false);
	});

	it('uses the target state directly when poweron is not available', () => {
		expect(normalizePowerScopedOnState(true, undefined)).to.equal(true);
	});

	it('returns false for a disabled target when poweron is not available', () => {
		expect(normalizePowerScopedOnState(false, undefined)).to.equal(false);
	});
});

describe('normalizeWritableBoolean', () => {
	it('keeps boolean values unchanged', () => {
		expect(normalizeWritableBoolean(true)).to.equal(true);
		expect(normalizeWritableBoolean(false)).to.equal(false);
	});

	it('accepts numeric boolean values', () => {
		expect(normalizeWritableBoolean(1)).to.equal(true);
		expect(normalizeWritableBoolean(0)).to.equal(false);
	});

	it('accepts unambiguous string values', () => {
		expect(normalizeWritableBoolean('true')).to.equal(true);
		expect(normalizeWritableBoolean(' FALSE ')).to.equal(false);
		expect(normalizeWritableBoolean('1')).to.equal(true);
		expect(normalizeWritableBoolean('0')).to.equal(false);
	});

	it('rejects ambiguous or unsupported values', () => {
		expect(normalizeWritableBoolean('yes')).to.equal(undefined);
		expect(normalizeWritableBoolean('')).to.equal(undefined);
		expect(normalizeWritableBoolean(2)).to.equal(undefined);
		expect(normalizeWritableBoolean(null)).to.equal(undefined);
	});
});

describe('normalizeSleepLightSceneValue', () => {
	const activeScene = {
		mode: 3,
		du: 600,
		minbri: 1,
		maxbri: 29,
	};

	it('maps an active scene to Friendly-State values', () => {
		expect(normalizeSleepLightSceneValue(activeScene, 'on')).to.equal(true);
		expect(normalizeSleepLightSceneValue(activeScene, 'duration')).to.equal(10);
		expect(normalizeSleepLightSceneValue(activeScene, 'startBrightness')).to.equal(29);
	});

	it('maps scene mode zero to an inactive sleep light', () => {
		expect(
			normalizeSleepLightSceneValue(
				{
					...activeScene,
					mode: 0,
				},
				'on',
			),
		).to.equal(false);
	});

	it('keeps an unconfigured duration visible as zero minutes', () => {
		expect(
			normalizeSleepLightSceneValue(
				{
					...activeScene,
					du: 0,
				},
				'duration',
			),
		).to.equal(0);
	});

	it('rejects malformed scene values', () => {
		expect(normalizeSleepLightSceneValue(undefined, 'on')).to.equal(undefined);
		expect(
			normalizeSleepLightSceneValue(
				{
					...activeScene,
					du: 650,
				},
				'duration',
			),
		).to.equal(undefined);
		expect(normalizeSleepLightSceneValue(activeScene, 'unknown')).to.equal(undefined);
	});
});

describe('getConfiguredSleepLightDurationMinutes', () => {
	it('returns valid configured durations', () => {
		expect(
			getConfiguredSleepLightDurationMinutes({
				mode: 0,
				du: 600,
				minbri: 1,
				maxbri: 29,
			}),
		).to.equal(10);

		expect(
			getConfiguredSleepLightDurationMinutes({
				mode: 0,
				du: 3600,
				minbri: 1,
				maxbri: 29,
			}),
		).to.equal(60);
	});

	it('rejects missing, unconfigured, or out-of-range durations', () => {
		expect(getConfiguredSleepLightDurationMinutes(undefined)).to.equal(undefined);

		expect(
			getConfiguredSleepLightDurationMinutes({
				mode: 0,
				du: 0,
				minbri: 1,
				maxbri: 0,
			}),
		).to.equal(undefined);

		expect(
			getConfiguredSleepLightDurationMinutes({
				mode: 0,
				du: 3660,
				minbri: 1,
				maxbri: 29,
			}),
		).to.equal(undefined);
	});
});
