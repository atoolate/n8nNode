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

// Main n8n node class for Ittes AI Chat Model
// This class acts as the bridge between n8n's AI Agent and your custom chat model implementation.
// It ensures the node is compatible with tool calling, streaming, and proper output types for agent workflows.
export class IttesAiModel implements INodeType {
	// Node metadata and configuration for n8n UI and workflow engine
	description: INodeTypeDescription = {
		displayName: 'Ittes AI Chat Model', // Shown in n8n UI
		name: 'ittesAiChatModel', // Internal node name
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
		inputs: [], // No direct input, only used as a model provider
		outputs: [NodeConnectionType.AiLanguageModel], // Ensures compatibility with AI Agent workflows
		outputNames: ['Model'],
		credentials: [
			{
				name: 'ittesAiApi', // Credential name for API key
				required: true,
			},
		],
		properties: [
			// Notice property for user guidance
			{
				displayName:
					'Each model has different capabilities and costs. <a href="https://docs.ittesai.com/models" target="_blank">Learn more about available models</a>.',
				name: 'notice',
				type: 'notice',
				default: '',
			},
			// Model selection dropdown, loaded dynamically from API
			{
				displayName: 'Model',
				name: 'model',
				type: 'options',
				description:
					'The model which will generate the completion. <a href="https://docs.ittesai.com/models">Learn more</a>.',
				typeOptions: {
					loadOptionsMethod: 'getModels', // Loads available models from API
				},
				default: '',
			},
			// Advanced options for model configuration
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

	// Dynamic options loader for model dropdown
	// WHY: This allows the node to fetch available models from your backend, so users always see up-to-date options.
	methods = {
		loadOptions: {
			async getModels(this: ILoadOptionsFunctions): Promise<INodePropertyOptions[]> {
				try {
					const credentials = await this.getCredentials('ittesAiApi');
					const apiUrl = credentials.url as string;
					const fullUrl = `${apiUrl}/api/n8n/models`;
					// WHY: Logging helps debug API connectivity and response issues
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

					// WHY: Some APIs wrap the models array in a 'data' property, so we check both
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

					// WHY: Map model names to dropdown options for n8n UI
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

	// Main data supplier for n8n AI Agent
	// WHY: This method returns a model object (not a string) so the agent can bind tools and interact with the model dynamically.
	async supplyData(this: ISupplyDataFunctions, itemIndex: number): Promise<SupplyData> {
		// Get user-selected model and options from node parameters
		const modelName = this.getNodeParameter('model', itemIndex) as string;
		const options = this.getNodeParameter('options', itemIndex, {}) as {
			maxTokens?: number;
			temperature?: number;
			topP?: number;
			frequencyPenalty?: number;
			presencePenalty?: number;
		};
		const credentials = await this.getCredentials('ittesAiApi');

		// WHY: Construct the chat model with all required parameters and execution context
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

		// WHY: Return the model object so the agent can call bindTools, chat, etc.
		return {
			response: llm,
		};
	}
}
