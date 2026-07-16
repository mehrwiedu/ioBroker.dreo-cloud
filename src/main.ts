/*
 * Created with @iobroker/create-adapter v3.1.5
 */

import * as utils from '@iobroker/adapter-core';
import { DreoClient, type DreoLogger, type ResolvedDevice, VERSION as dreoApiVersion } from '@mehrwiedu/dreo-api';

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
	 * RAW states, friendly states and runtime discovery are intentionally
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
			await this.setDeviceInfoStates(resolvedDevice);
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
