/** Supported DREO cloud regions. */
export const DREO_REGIONS = ['EU', 'US', 'CN'] as const;

/** Supported DREO cloud region. */
export type DreoRegion = (typeof DREO_REGIONS)[number];

/** Validated configuration used to initialize the DREO client. */
export interface DreoCloudConfig {
	/** Email address of the DREO account. */
	email: string;

	/** Password of the DREO account. */
	password: string;

	/** Cloud region assigned to the DREO account. */
	region: DreoRegion;
}

/** Result returned after validating the native adapter configuration. */
export type ConfigValidationResult =
	| {
			/** Indicates that the configuration is valid. */
			valid: true;

			/** Normalized configuration values. */
			config: DreoCloudConfig;
	  }
	| {
			/** Indicates that the configuration is invalid. */
			valid: false;

			/** Human-readable validation errors. */
			errors: string[];
	  };

/**
 * Validates and normalizes the native adapter configuration.
 *
 * @param config Native ioBroker adapter configuration
 * @returns Validation result containing either normalized values or errors
 */
export function validateConfig(config: ioBroker.AdapterConfig): ConfigValidationResult {
	const errors: string[] = [];

	const email = config.email.trim();
	const password = config.password;
	const region = config.region;

	if (!email) {
		errors.push('DREO email address is missing.');
	}

	if (!password) {
		errors.push('DREO password is missing.');
	}

	if (!DREO_REGIONS.includes(region)) {
		errors.push(`Unsupported DREO cloud region: ${region}`);
	}

	if (errors.length > 0) {
		return {
			valid: false,
			errors,
		};
	}

	return {
		valid: true,
		config: {
			email,
			password,
			region,
		},
	};
}
