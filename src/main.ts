/*
 * Created with @iobroker/create-adapter v3.1.5
 */

import * as utils from '@iobroker/adapter-core';
import {
	DreoClient,
	type DiscoveredState,
	type DreoLogger,
	type ResolvedDevice,
	VERSION as dreoApiVersion,
} from '@mehrwiedu/dreo-api';

import { validateConfig } from './lib/config';

class DreoCloud extends utils.Adapter {
	private client?: DreoClient;

	public constructor(options: Partial<utils.AdapterOptions> = {}) {
		super({
			...options,
			name: 'dreo-cloud',
		});

		this.on('ready', this.onReady.bind(this));
		this.on('unload', this.onUnload.bind(this));
	}

	/**
	 * Called when ioBroker databases are connected and the adapter
	 * has received its configuration.
	 */
	private async onReady(): Promise<void> {
		await this.setConnectionState(false);

		this.log.info('DREO Cloud adapter started.');
		this.log.info(`Using @mehrwiedu/dreo-api ${dreoApiVersion}.`);

		const validation = validateConfig(this.config);

		if (!validation.valid) {
			for (const error of validation.errors) {
				this.log.error(error);
			}

			this.log.error('DREO Cloud adapter startup aborted because the configuration is incomplete or invalid.');
			return;
		}

		this.log.info(`DREO cloud region configured: ${validation.config.region}.`);
		this.log.info('Connecting to DREO cloud...');

		try {
			const client = await DreoClient.login({
				email: validation.config.email,
				password: validation.config.password,
				region: validation.config.region,
				logger: this.createDreoLogger(),
			});

			this.client = client;

			await this.setConnectionState(true);
			this.log.info('Connected to DREO cloud.');

			await this.initializeResolvedDevices(client);
		} catch (error) {
			await this.setConnectionState(false);
			this.log.error(`Failed to initialize DREO cloud connection: ${this.formatError(error)}`);
		}
	}

	/**
	 * Loads all FamilyTree-based devices and creates their basic ioBroker
	 * device and information objects.
	 *
	 * Friendly states, write support and runtime discovery are intentionally
	 * not initialized in this migration step.
	 *
	 * @param client Connected DREO client
	 */
	private async initializeResolvedDevices(client: DreoClient): Promise<void> {
		const resolvedDevices = await client.getResolvedDevices();

		this.log.info(`Resolved ${resolvedDevices.length} DREO device(s).`);

		await this.createDevicesRootObject();

		for (const resolvedDevice of resolvedDevices) {
			this.log.info(this.formatResolvedDeviceLogMessage(resolvedDevice));
			await this.createDeviceInfoObjects(resolvedDevice);
			await this.createRawDeviceObjects(resolvedDevice);
			await this.setDeviceInfoStates(resolvedDevice);
			await this.setRawDeviceStates(resolvedDevice);
		}
	}

	/**
	 * Creates the root channel containing all DREO devices.
	 */
	private async createDevicesRootObject(): Promise<void> {
		await this.setObjectNotExistsAsync('devices', {
			type: 'channel',
			common: {
				name: 'DREO devices',
			},
			native: {},
		});
	}

	/**
	 * Creates a device and its basic information states.
	 *
	 * @param resolvedDevice Device returned by the SDK
	 */
	private async createDeviceInfoObjects(resolvedDevice: ResolvedDevice): Promise<void> {
		const deviceId = this.createDeviceObjectId(resolvedDevice);
		const { device } = resolvedDevice;

		await this.setObjectNotExistsAsync(`devices.${deviceId}`, {
			type: 'device',
			common: {
				name: device.deviceName,
			},
			native: {
				sn: device.sn,
				model: device.model,
			},
		});

		await this.setObjectNotExistsAsync(`devices.${deviceId}.info`, {
			type: 'channel',
			common: {
				name: 'Device information',
			},
			native: {},
		});

		await this.setObjectNotExistsAsync(`devices.${deviceId}.info.name`, {
			type: 'state',
			common: {
				name: 'Name',
				type: 'string',
				role: 'info.name',
				read: true,
				write: false,
			},
			native: {},
		});

		await this.setObjectNotExistsAsync(`devices.${deviceId}.info.model`, {
			type: 'state',
			common: {
				name: 'Model',
				type: 'string',
				role: 'info.model',
				read: true,
				write: false,
			},
			native: {},
		});

		await this.setObjectNotExistsAsync(`devices.${deviceId}.info.serialNumber`, {
			type: 'state',
			common: {
				name: 'Serial number',
				type: 'string',
				role: 'info.serial',
				read: true,
				write: false,
			},
			native: {},
		});
	}

	/**
	 * Creates the RAW channel and one read-only state object for every state
	 * discovered by the SDK.
	 *
	 * @param resolvedDevice Device returned by the SDK
	 */
	private async createRawDeviceObjects(resolvedDevice: ResolvedDevice): Promise<void> {
		const deviceId = this.createDeviceObjectId(resolvedDevice);

		await this.setObjectNotExistsAsync(`devices.${deviceId}.raw`, {
			type: 'channel',
			common: {
				name: 'Raw device state',
			},
			native: {},
		});

		for (const state of resolvedDevice.states) {
			await this.createRawStateObject(deviceId, state);
		}
	}

	/**
	 * Creates one read-only RAW state object.
	 *
	 * @param deviceId Sanitized ioBroker device ID
	 * @param state State discovered by the SDK
	 */
	private async createRawStateObject(deviceId: string, state: DiscoveredState): Promise<void> {
		const stateId = this.createRawStateObjectId(state.key);

		await this.setObjectNotExistsAsync(`devices.${deviceId}.raw.${stateId}`, {
			type: 'state',
			common: {
				name: state.description,
				type: this.mapRawStateType(state),
				role: this.mapRawStateRole(state),
				read: true,
				write: false,
			},
			native: {
				key: state.key,
				category: state.category,
				known: state.known,
				valueType: state.valueType,
				constraint: state.constraint,
			},
		});
	}

	/**
	 * Maps the SDK value type to an ioBroker state type.
	 *
	 * Object and unknown values are stored as JSON strings.
	 *
	 * @param state State discovered by the SDK
	 * @returns ioBroker state type
	 */
	private mapRawStateType(state: DiscoveredState): 'boolean' | 'number' | 'string' {
		switch (state.valueType) {
			case 'boolean':
				return 'boolean';

			case 'number':
				return 'number';

			case 'string':
				return 'string';

			case 'object':
			case 'unknown':
			default:
				return 'string';
		}
	}

	/**
	 * Maps SDK state metadata to a conservative ioBroker role.
	 *
	 * @param state State discovered by the SDK
	 * @returns ioBroker role
	 */
	private mapRawStateRole(state: DiscoveredState): string {
		if (state.category === 'information') {
			return 'info';
		}

		if (state.valueType === 'boolean') {
			return 'indicator';
		}

		return 'value';
	}

	/**
	 * Writes all currently available RAW values with acknowledgement.
	 *
	 * @param resolvedDevice Device returned by the SDK
	 */
	private async setRawDeviceStates(resolvedDevice: ResolvedDevice): Promise<void> {
		const deviceId = this.createDeviceObjectId(resolvedDevice);

		for (const state of resolvedDevice.states) {
			const rawValue = this.readRawStateValue(resolvedDevice, state.key);

			if (rawValue === undefined) {
				continue;
			}

			await this.setStateAsync(`devices.${deviceId}.raw.${this.createRawStateObjectId(state.key)}`, {
				val: this.normalizeRawStateValue(rawValue, state),
				ack: true,
			});
		}
	}

	/**
	 * Reads the current value of a RAW key from the resolved device status.
	 *
	 * @param resolvedDevice Device returned by the SDK
	 * @param key RAW state key
	 * @returns Current value or undefined
	 */
	private readRawStateValue(resolvedDevice: ResolvedDevice, key: string): unknown {
		const mixedState = resolvedDevice.state.data.mixed[key];

		if (!mixedState) {
			return undefined;
		}

		return mixedState.state;
	}

	/**
	 * Normalizes a RAW value so it matches the ioBroker object type.
	 *
	 * @param value Current RAW value
	 * @param state State metadata
	 * @returns ioBroker-compatible value
	 */
	private normalizeRawStateValue(value: unknown, state: DiscoveredState): string | number | boolean | null {
		if (value === null) {
			return null;
		}

		switch (state.valueType) {
			case 'boolean':
				return typeof value === 'boolean' ? value : Boolean(value);

			case 'number':
				return typeof value === 'number' ? value : Number(value);

			case 'string':
				return typeof value === 'string' ? value : this.stringifyRawStateValue(value);

			case 'object':
			case 'unknown':
			default:
				return this.stringifyRawStateValue(value);
		}
	}

	/**
	 * Serializes complex or unknown RAW values safely.
	 *
	 * @param value RAW value
	 * @returns String representation
	 */
	private stringifyRawStateValue(value: unknown): string {
		if (typeof value === 'string') {
			return value;
		}

		if (value === null) {
			return 'null';
		}

		if (typeof value === 'number' || typeof value === 'boolean' || typeof value === 'bigint') {
			return `${value}`;
		}

		if (typeof value === 'undefined') {
			return 'undefined';
		}

		if (typeof value === 'symbol') {
			return value.description ?? 'symbol';
		}

		try {
			const serializedValue = JSON.stringify(value);

			return serializedValue ?? '[Unserializable RAW value]';
		} catch {
			return '[Unserializable RAW value]';
		}
	}

	/**
	 * Creates a stable RAW state ID.
	 *
	 * @param key Original DREO state key
	 * @returns Sanitized RAW state ID
	 */
	private createRawStateObjectId(key: string): string {
		return this.sanitizeObjectId(key);
	}

	/**
	 * Writes the current FamilyTree device information to ioBroker.
	 *
	 * @param resolvedDevice Device returned by the SDK
	 */
	private async setDeviceInfoStates(resolvedDevice: ResolvedDevice): Promise<void> {
		const deviceId = this.createDeviceObjectId(resolvedDevice);
		const { device } = resolvedDevice;

		await this.setStateAsync(`devices.${deviceId}.info.name`, {
			val: device.deviceName,
			ack: true,
		});

		await this.setStateAsync(`devices.${deviceId}.info.model`, {
			val: device.model,
			ack: true,
		});

		await this.setStateAsync(`devices.${deviceId}.info.serialNumber`, {
			val: device.sn,
			ack: true,
		});
	}

	/**
	 * Creates a stable ioBroker object ID from the DREO serial number.
	 *
	 * @param resolvedDevice Device returned by the SDK
	 * @returns Sanitized device object ID
	 */
	private createDeviceObjectId(resolvedDevice: ResolvedDevice): string {
		return this.sanitizeObjectId(resolvedDevice.device.sn);
	}

	/**
	 * Sanitizes a DREO identifier for use as an ioBroker object ID segment.
	 *
	 * @param value Identifier to sanitize
	 * @returns Sanitized identifier
	 */
	private sanitizeObjectId(value: string): string {
		return value
			.trim()
			.replace(/[^a-zA-Z0-9_-]/g, '_')
			.replace(/_+/g, '_')
			.replace(/^_+|_+$/g, '');
	}

	/**
	 * Formats a resolved device for diagnostic startup logging.
	 *
	 * @param resolvedDevice Device returned by the SDK
	 * @returns Human-readable device description
	 */
	private formatResolvedDeviceLogMessage(resolvedDevice: ResolvedDevice): string {
		const { device } = resolvedDevice;

		return `DREO device: ${device.deviceName} (${device.model}, ${device.sn})`;
	}

	/**
	 * Creates the logger passed to the DREO SDK.
	 *
	 * @returns Logger forwarding SDK messages to ioBroker
	 */
	private createDreoLogger(): DreoLogger {
		return {
			debug: (message, data) => {
				this.log.debug(this.formatSdkLogMessage(message, data));
			},
			info: (message, data) => {
				this.log.info(this.formatSdkLogMessage(message, data));
			},
			warn: (message, data) => {
				this.log.warn(this.formatSdkLogMessage(message, data));
			},
			error: (message, data) => {
				this.log.error(this.formatSdkLogMessage(message, data));
			},
		};
	}

	/**
	 * Formats a message received from the DREO SDK.
	 *
	 * @param message SDK log message
	 * @param data Optional SDK log data
	 * @returns Formatted ioBroker log message
	 */
	private formatSdkLogMessage(message: string, data?: unknown): string {
		if (data === undefined) {
			return `[SDK] ${message}`;
		}

		return `[SDK] ${message} ${this.stringifyLogData(data)}`;
	}

	/**
	 * Safely serializes SDK log data.
	 *
	 * @param data Data to serialize
	 * @returns Serialized representation
	 */
	private stringifyLogData(data: unknown): string {
		try {
			return JSON.stringify(data);
		} catch {
			return String(data);
		}
	}

	/**
	 * Converts an unknown error into a readable message.
	 *
	 * @param error Error value
	 * @returns Readable error message
	 */
	private formatError(error: unknown): string {
		return error instanceof Error ? error.message : String(error);
	}

	/**
	 * Updates the standard ioBroker connection indicator.
	 *
	 * @param connected Current cloud connection state
	 */
	private async setConnectionState(connected: boolean): Promise<void> {
		await this.setStateAsync('info.connection', {
			val: connected,
			ack: true,
		});
	}

	/**
	 * Called when the adapter shuts down.
	 *
	 * @param callback Callback that must always be invoked
	 */
	private onUnload(callback: () => void): void {
		try {
			this.client?.disconnect();
			this.client = undefined;

			void this.setConnectionState(false)
				.catch(error => {
					this.log.warn(`Failed to reset connection state during shutdown: ${this.formatError(error)}`);
				})
				.finally(() => {
					this.log.info('DREO Cloud adapter stopped.');
					callback();
				});
		} catch (error) {
			this.log.warn(`Error during DREO Cloud adapter shutdown: ${this.formatError(error)}`);
			callback();
		}
	}
}

if (require.main !== module) {
	module.exports = (options: Partial<utils.AdapterOptions> | undefined) => new DreoCloud(options);
} else {
	(() => new DreoCloud())();
}
