// This file extends the AdapterConfig type from "@iobroker/types"

declare global {
	namespace ioBroker {
		interface AdapterConfig {
			email: string;
			password: string;
			region: 'EU' | 'US' | 'CN';
		}
	}
}

export {};
