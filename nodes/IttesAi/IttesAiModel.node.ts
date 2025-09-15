import type {
	ISupplyDataFunctions,
	INodeType,
	INodeTypeDescription,
	SupplyData,
	ILoadOptionsFunctions,
	INodePropertyOptions,
} from 'n8n-workflow';

import { NodeConnectionType } from 'n8n-workflow';

export class IttesAiModel implements INodeType {
	description: INodeTypeDescription = {
		displayName: 'Ittes AI Model',
		name: 'ittesAiModel',
		icon: { light: 'file:favicon_ittes.svg', dark: 'file:favicon_ittes.svg' },
		group: ['transform'],
		version: 1,
		description: 'Use Ittes AI models in AI Agent',
		defaults: {
			name: 'Ittes AI Model',
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
		// eslint-disable-next-line n8n-nodes-base/node-class-description-inputs-wrong-regular-node
		inputs: [],
		// eslint-disable-next-line n8n-nodes-base/node-class-description-outputs-wrong
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
				routing: {
					send: {
						type: 'body',
						property: 'model',
					},
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
						description: 'The maximum number of tokens to generate in the completion',
						type: 'number',
						typeOptions: {
							minValue: 1,
							maxValue: 8192,
						},
						routing: {
							send: {
								type: 'body',
								property: 'maxTokens',
							},
						},
					},
					{
						displayName: 'Temperature',
						name: 'temperature',
						default: 0.7,
						typeOptions: { minValue: 0, maxValue: 2, numberStepSize: 0.1 },
						description:
							'Controls randomness: Lowering results in less random completions. As the temperature approaches zero, the model will become deterministic and repetitive.',
						type: 'number',
						routing: {
							send: {
								type: 'body',
								property: 'temperature',
							},
						},
					},
					{
						displayName: 'Top P',
						name: 'topP',
						default: 1,
						typeOptions: { minValue: 0, maxValue: 1, numberStepSize: 0.1 },
						description:
							'Controls diversity via nucleus sampling: 0.5 means half of all likelihood-weighted options are considered. We generally recommend altering this or temperature but not both.',
						type: 'number',
						routing: {
							send: {
								type: 'body',
								property: 'topP',
							},
						},
					},
					{
						displayName: 'Frequency Penalty',
						name: 'frequencyPenalty',
						default: 0,
						typeOptions: { minValue: -2, maxValue: 2, numberStepSize: 0.1 },
						description:
							"Positive values penalize new tokens based on their existing frequency in the text so far, decreasing the model's likelihood to repeat the same line verbatim",
						type: 'number',
						routing: {
							send: {
								type: 'body',
								property: 'frequencyPenalty',
							},
						},
					},
					{
						displayName: 'Presence Penalty',
						name: 'presencePenalty',
						default: 0,
						typeOptions: { minValue: -2, maxValue: 2, numberStepSize: 0.1 },
						description:
							"Positive values penalize new tokens based on whether they appear in the text so far, increasing the model's likelihood to talk about new topics",
						type: 'number',
						routing: {
							send: {
								type: 'body',
								property: 'presencePenalty',
							},
						},
					},
				],
			},
		],
	};

	// Register getModels as a loadOptions method for dynamic dropdowns
	methods = {
		loadOptions: {
			async getModels(this: ILoadOptionsFunctions): Promise<INodePropertyOptions[]> {
				try {
					const credentials = await this.getCredentials('ittesAiApi');
					const apiUrl = credentials.url as string;
					const fullUrl = `${apiUrl}/api/n8n/models`;
					
					console.log('IttesAiModel getModels: Making GET request to:', fullUrl);

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

					console.log('IttesAiModel getModels response:', response);

					// Sometimes n8n wraps the response in a 'data' property
					const models = response.models ?? response.data?.models;

					if (!models || !Array.isArray(models)) {
						console.error('IttesAiModel: No models array in response:', response);
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
					console.error('IttesAiModel getModels error:', error);
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
		const nodeOptions = this.getNodeParameter('options', itemIndex, {}) as object;

		const ittesAiModel = {
			invoke: async (input: string, options?: { systemMessage?: string }) => {
				const body = {
					prompt: input,
					model: modelName,
					system: options?.systemMessage || '',
					...nodeOptions,
					...options,
				};

				const response = await this.helpers.httpRequestWithAuthentication.call(
					this,
					'ittesAiApi',
					{
						method: 'POST',
						url: '/api/n8n/chat',
						body,
						json: true,
					},
				);

				return response.content || response.message || response.response || response;
			},
			// Implement tools if needed in the future
		};

		return {
			response: ittesAiModel,
		};
	}
}