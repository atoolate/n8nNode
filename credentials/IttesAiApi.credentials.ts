import type { ICredentialType, INodeProperties } from 'n8n-workflow';

export class IttesAiApi implements ICredentialType {
	name = 'ittesAiApi';

	displayName = 'Ittes AI API';

	documentationUrl = 'https://docs.ittesai.com';

	properties: INodeProperties[] = [
		{
			displayName: 'API URL',
			name: 'url',
			type: 'string',
			default: 'https://dev.ittesai.com',
			description: 'The base URL for your Ittes AI API',
			required: true,
		},
		{
			displayName: 'API Key',
			name: 'apiKey',
			type: 'string',
			typeOptions: { password: true },
			default: '',
			description: 'Your Ittes AI API key',
			required: false,
		},
	];

	authenticate = {
		type: 'generic',
		properties: {
			headers: {
				Authorization: '=Bearer {{$credentials.apiKey}}',
			},
		},
	} as const;

	test = {
		request: {
			baseURL: '={{$credentials.url}}',
			url: '/chat',
			method: 'POST' as const,
			body: {
				prompt: 'Test connection',
				model: 'test',
			},
		},
	};
}