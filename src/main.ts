/*
 * Created with @iobroker/create-adapter v3.1.5
 */

import * as utils from '@iobroker/adapter-core';

import { validateConfig } from './lib/config';

class DreoCloud extends utils.Adapter {
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
		await this.setStateAsync('info.connection', {
			val: false,
			ack: true,
		});

		const validation = validateConfig(this.config);

		if (!validation.valid) {
			for (const error of validation.errors) {
				this.log.error(error);
			}

			this.log.error('DREO Cloud adapter startup aborted because the configuration is incomplete or invalid.');
			return;
		}

		this.log.info(`DREO Cloud adapter configuration is valid for region ${validation.config.region}.`);
		this.log.info('DREO SDK integration has not been enabled yet.');
	}

	/**
	 * Called when the adapter shuts down.
	 *
	 * @param callback Callback that must always be invoked
	 */
	private onUnload(callback: () => void): void {
		void this.setStateAsync('info.connection', {
			val: false,
			ack: true,
		}).finally(callback);
	}
}

if (require.main !== module) {
	module.exports = (options: Partial<utils.AdapterOptions> | undefined) => new DreoCloud(options);
} else {
	(() => new DreoCloud())();
}
