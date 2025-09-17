// IttesAiChatModelNode.node.ts

import type {
	INodeType,
	INodeTypeDescription,
	ILoadOptionsFunctions,
	INodePropertyOptions,
	ISupplyDataFunctions,
	SupplyData,
} from 'n8n-workflow';
import { NodeConnectionType } from 'n8n-workflow';

// Import the ChatModel wrapper (from my previous code)
import { IttesAiChatModel } from './IttesAiChatModel';

export class IttesAiModel implements INodeType {
	description: INodeTypeDescription = {
		displayName: 'Ittes AI Chat Model',
		name: 'ittesAiChatModel',
		icon: { light: 'file:favicon_ittes.svg', dark: 'file:favicon_ittes.svg' },
		group: ['AI'],
		version: 1,
		description: 'Use Ittes AI models in AI Agent',
		defaults: {
			name: 'Ittes AI Chat Model',
		},
		codex: {
			categories: ['AI'],
			subcategories: {
				AI: ['Language Models'],
			},
			resources: {
				primaryDocumentation: [
					{
						url: 'https://docs.ittesai.com',
					},
				],
			},
		},
		inputs: [],
		outputs: [NodeConnectionType.AiLanguageModel],
		outputNames: ['Model'],
		credentials: [
			{
				name: 'ittesAiApi',
				required: true,
			},
		],
		properties: [
			{
				displayName:
					'Each model has different capabilities and costs. <a href="https://docs.ittesai.com/models" target="_blank">Learn more about available models</a>.',
				name: 'notice',
				type: 'notice',
				default: '',
			},
			{
				displayName: 'Model',
				name: 'model',
				type: 'options',
				description:
					'The model which will generate the completion. <a href="https://docs.ittesai.com/models">Learn more</a>.',
				typeOptions: {
					loadOptionsMethod: 'getModels',
				},
				default: '',
			},
			{
				displayName: 'Options',
				name: 'options',
				placeholder: 'Add Option',
				description: 'Additional options to configure',
				type: 'collection',
				default: {},
				options: [
					{
						displayName: 'Maximum Number of Tokens',
						name: 'maxTokens',
						default: 2048,
						type: 'number',
					},
					{
						displayName: 'Temperature',
						name: 'temperature',
						default: 0.7,
						type: 'number',
					},
					{
						displayName: 'Top P',
						name: 'topP',
						default: 1,
						type: 'number',
					},
					{
						displayName: 'Frequency Penalty',
						name: 'frequencyPenalty',
						default: 0,
						type: 'number',
					},
					{
						displayName: 'Presence Penalty',
						name: 'presencePenalty',
						default: 0,
						type: 'number',
					},
				],
			},
		],
	};

	methods = {
		loadOptions: {
			async getModels(this: ILoadOptionsFunctions): Promise<INodePropertyOptions[]> {
				try {
					const credentials = await this.getCredentials('ittesAiApi');
					const apiUrl = credentials.url as string;
					const fullUrl = `${apiUrl}/api/n8n/models`;
					
					console.log('getModels: Making GET request to:', fullUrl);

					const response = await this.helpers.httpRequest.call(this, {
						method: 'GET',
						url: fullUrl,
						headers: credentials.apiKey
							? {
								Authorization: `Bearer ${credentials.apiKey}`,
							}
							: {},
						json: true,
					});

					console.log('getModels response:', response);

					// Sometimes n8n wraps the response in a 'data' property
					const models = response.models ?? response.data?.models;

					if (!models || !Array.isArray(models)) {
						console.error('No models array in response:', response);
						return [
							{
								name: 'No models found',
								value: '',
							},
						];
					}

					return models.map((model: string) => ({
						name: model,
						value: model,
					}));
				} catch (error) {
					console.error('getModels error:', error);
					return [
						{
							name: 'Error fetching models',
							value: '',
							description: error instanceof Error ? error.message : String(error),
						},
					];
				}
			}, 
		},
	};

	async supplyData(this: ISupplyDataFunctions, itemIndex: number): Promise<SupplyData> {
		const modelName = this.getNodeParameter('model', itemIndex) as string;
		const options = this.getNodeParameter('options', itemIndex, {}) as {
			maxTokens?: number;
			temperature?: number;
			topP?: number;
			frequencyPenalty?: number;
			presencePenalty?: number;
		};
		const credentials = await this.getCredentials('ittesAiApi');

		const llm = new IttesAiChatModel({
			model: modelName,
			apiKey: credentials.apiKey as string,
			baseUrl: credentials.url as string,
			temperature: options.temperature ?? 0.7,
			maxTokens: options.maxTokens ?? 2048,
			topP: options.topP ?? 1,
			frequencyPenalty: options.frequencyPenalty ?? 0,
			presencePenalty: options.presencePenalty ?? 0,
			executionContext: this,
		});

		return {
			// must align with NodeConnectionType.AiLanguageModel
			response: llm,
		};
	}
}
