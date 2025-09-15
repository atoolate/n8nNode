import type {
	IExecuteFunctions,
	INodeExecutionData,
	INodeType,
	INodeTypeDescription,
	IDataObject,
	ILoadOptionsFunctions,
	INodePropertyOptions,
} from 'n8n-workflow';
import { NodeOperationError, NodeConnectionType } from 'n8n-workflow';

import { chatFields, chatOperations } from './ChatDescription';

export class IttesAi implements INodeType {
	description: INodeTypeDescription = {
		displayName: 'Ittes AI',
		name: 'ittesAi',
		icon: { light: 'file:favicon_ittes.svg', dark: 'file:favicon_ittes.svg' },
		group: ['transform'],
		version: 1,
		subtitle: '={{$parameter["operation"] + ": " + $parameter["resource"]}}',
		description: 'Consume Ittes AI API',
		defaults: {
			name: 'Ittes AI',
		},
		inputs: [NodeConnectionType.Main],
		outputs: [NodeConnectionType.Main],
		credentials: [
			{
				name: 'ittesAiApi',
				required: true,
			},
		],
		properties: [
			{
				displayName: 'Resource',
				name: 'resource',
				type: 'options',
				noDataExpression: true,
				options: [
					{
						name: 'Chat',
						value: 'chat',
					},
				],
				default: 'chat',
			},
			...chatOperations,
			...chatFields,
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

	async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
		const items = this.getInputData();
		const returnData: INodeExecutionData[] = [];

		const resource = this.getNodeParameter('resource', 0) as string;
		const operation = this.getNodeParameter('operation', 0) as string;

		for (let i = 0; i < items.length; i++) {
			try {
				if (resource === 'chat') {
					if (operation === 'generate') {
						const credentials = await this.getCredentials('ittesAiApi');
						const prompt = this.getNodeParameter('prompt', i) as string;
						const model = this.getNodeParameter('model', i) as string;
						const systemContext = this.getNodeParameter('systemContext', i, '') as string;
						const temperature = this.getNodeParameter('temperature', i, 0.7) as number;
						const maxTokens = this.getNodeParameter('maxTokens', i, 2048) as number;
						const additionalFields = this.getNodeParameter(
							'additionalFields',
							i,
							{},
						) as IDataObject;

						const body: IDataObject = {
							prompt,
							model,
							system: systemContext, // Changed from systemContext to system to match your API
							temperature,
							maxTokens,
							...additionalFields,
						};

						// Construct the full URL manually
						const apiUrl = credentials.url as string;
						const fullUrl = `${apiUrl}/api/n8n/chat`;

						const response = await this.helpers.httpRequest.call(this, {
							method: 'POST',
							url: fullUrl,
							body,
							json: true,
							headers: credentials.apiKey
								? {
										Authorization: `Bearer ${credentials.apiKey}`,
								  }
								: {},
						});

						returnData.push({
							json: response as IDataObject,
							pairedItem: { item: i },
						});
					}
				}
			} catch (error) {
				if (this.continueOnFail()) {
					const errorMessage = error instanceof Error ? error.message : 'Unknown error';
					returnData.push({
						json: { error: errorMessage },
						pairedItem: { item: i },
					});
					continue;
				}
				throw new NodeOperationError(this.getNode(), error as Error, {
					itemIndex: i,
				});
			}
		}

		return [returnData];
	}
}
