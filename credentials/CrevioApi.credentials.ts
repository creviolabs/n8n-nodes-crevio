import type {
	IAuthenticateGeneric,
	Icon,
	ICredentialTestRequest,
	ICredentialType,
	INodeProperties,
} from 'n8n-workflow';

export class CrevioApi implements ICredentialType {
	name = 'crevioApi';

	displayName = 'Crevio API';

	icon: Icon = { light: 'file:../icons/crevio.svg', dark: 'file:../icons/crevio.dark.svg' };

	documentationUrl = 'https://crevio.co/docs/developer/guides/quickstart';

	properties: INodeProperties[] = [
		{
			displayName: 'API Token',
			name: 'apiToken',
			type: 'string',
			typeOptions: { password: true },
			required: true,
			default: '',
			description:
				'Create one in Crevio under Settings → Developer → API Keys. API keys need the Business plan.',
		},
		{
			displayName: 'API URL',
			name: 'baseUrl',
			type: 'string',
			default: 'https://api.crevio.co/v1',
			description: 'Leave as is unless Crevio support gives you a different address',
		},
	];

	authenticate: IAuthenticateGeneric = {
		type: 'generic',
		properties: {
			headers: {
				Authorization: '=Bearer {{$credentials.apiToken}}',
			},
		},
	};

	test: ICredentialTestRequest = {
		request: {
			baseURL: '={{$credentials.baseUrl.replace(/\\/+$/, "")}}',
			url: '/status',
			method: 'GET',
		},
	};
}
