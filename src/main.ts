/*
 * Created with @iobroker/create-adapter v3.1.5
 */

import * as utils from '@iobroker/adapter-core';
import { DreoClient, type DreoLogger, VERSION as dreoApiVersion } from '@mehrwiedu/dreo-api';

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
		} catch (error) {
			await this.setConnectionState(false);
			this.log.error(`Failed to connect to DREO cloud: ${this.formatError(error)}`);
		}
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
