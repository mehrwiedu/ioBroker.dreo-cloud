import { expect } from 'chai';

import { validateConfig } from './lib/config';

describe('validateConfig', () => {
	it('accepts a complete EU configuration', () => {
		const result = validateConfig({
			email: ' adapter@example.com ',
			password: 'secret',
			region: 'EU',
		});

		expect(result.valid).to.equal(true);

		if (result.valid) {
			expect(result.config).to.deep.equal({
				email: 'adapter@example.com',
				password: 'secret',
				region: 'EU',
			});
		}
	});

	it('rejects missing credentials', () => {
		const result = validateConfig({
			email: ' ',
			password: '',
			region: 'EU',
		});

		expect(result.valid).to.equal(false);

		if (!result.valid) {
			expect(result.errors).to.include('DREO email address is missing.');
			expect(result.errors).to.include('DREO password is missing.');
		}
	});

	it('rejects an unsupported region', () => {
		const result = validateConfig({
			email: 'adapter@example.com',
			password: 'secret',
			region: 'INVALID' as ioBroker.AdapterConfig['region'],
		});

		expect(result.valid).to.equal(false);

		if (!result.valid) {
			expect(result.errors).to.include('Unsupported DREO cloud region: INVALID');
		}
	});
});
