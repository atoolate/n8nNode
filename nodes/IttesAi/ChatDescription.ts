import type { INodeProperties } from 'n8n-workflow';

export const chatOperations: INodeProperties[] = [
	{
		displayName: 'Operation',
		name: 'operation',
		type: 'options',
		noDataExpression: true,
		displayOptions: {
			show: {
				resource: ['chat'],
			},
		},
		options: [
			{
				name: 'Make API Request to Ittes AI',
				value: 'generate',
				action: 'Make API Request to Ittes AI',
				description: 'Make API Request to Ittes AI',
			},
		],
		default: 'generate',
	},
];

export const chatFields: INodeProperties[] = [
	{
		displayName: 'Prompt',
		name: 'prompt',
		type: 'string',
		required: true,
		displayOptions: {
			show: {
				operation: ['generate'],
				resource: ['chat'],
			},
		},
		default: '',
		description: 'The prompt to send to the AI model',
		typeOptions: {
			rows: 4,
		},
	},
	{
		displayName: 'AI Model',
		name: 'model',
		type: 'string',
		required: true,
		displayOptions: {
			show: {
				operation: ['generate'],
				resource: ['chat'],
			},
		},
        options: [
            // INSERT AVALIABLE MODELS HERE
            {
                name: 'gpt-3.5-turbo',
                value: 'gpt-3.5-turbo',
                description: 'OpenAI GPT-3.5 Turbo model',
            },
            {
                name: 'gpt-4',
                value: 'gpt-4',
                description: 'OpenAI GPT-4 model',
            },
            {
                name: 'custom-model',
                value: 'custom-model',
                description: 'A custom model of your choice',
            },
        ],
		default: 'gpt-3.5-turbo',
		description: 'The AI model to use for generation',
		placeholder: 'gpt-3.5-turbo',
	},
	{
		displayName: 'System Context',
		name: 'systemContext',
		type: 'string',
		displayOptions: {
			show: {
				operation: ['generate'],
				resource: ['chat'],
			},
		},
		default: 'You are a helpful assistant orchistrating API calls between n8n and external APIs.',
		description: 'System context or instructions for the AI model',
		typeOptions: {
			rows: 3,
		},
	},
	{
		displayName: 'Temperature',
		name: 'temperature',
		type: 'number',
		displayOptions: {
			show: {
				operation: ['generate'],
				resource: ['chat'],
			},
		},
		default: 0.7,
		description: 'Controls randomness in the output. Higher values make output more random.',
		typeOptions: {
			minValue: 0,
			maxValue: 2,
			numberStepSize: 0.1,
		},
	},
	{
		displayName: 'Max Tokens',
		name: 'maxTokens',
		type: 'number',
		displayOptions: {
			show: {
				operation: ['generate'],
				resource: ['chat'],
			},
		},
		default: 2048,
		description: 'Maximum number of tokens to generate',
		typeOptions: {
			minValue: 1,
			maxValue: 8192,
		},
	},
	{
		displayName: 'Additional Fields',
		name: 'additionalFields',
		type: 'collection',
		placeholder: 'Add Field',
		default: {},
		displayOptions: {
			show: {
				operation: ['generate'],
				resource: ['chat'],
			},
		},
		options: [
			{
				displayName: 'Top P',
				name: 'topP',
				type: 'number',
				default: 1,
				description: 'Controls diversity via nucleus sampling',
				typeOptions: {
					minValue: 0,
					maxValue: 1,
					numberStepSize: 0.1,
				},
			},
			{
				displayName: 'Frequency Penalty',
				name: 'frequencyPenalty',
				type: 'number',
				default: 0,
				description: 'Decreases likelihood of repeating tokens',
				typeOptions: {
					minValue: -2,
					maxValue: 2,
					numberStepSize: 0.1,
				},
			},
			{
				displayName: 'Presence Penalty',
				name: 'presencePenalty',
				type: 'number',
				default: 0,
				description: 'Increases likelihood of new topics',
				typeOptions: {
					minValue: -2,
					maxValue: 2,
					numberStepSize: 0.1,
				},
			},
		],
	},
];