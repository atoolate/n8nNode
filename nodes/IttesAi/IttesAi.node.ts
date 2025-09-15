import type {
	IExecuteFunctions,
	INodeExecutionData,
	INodeType,
	INodeTypeDescription,
	IDataObject,
} from 'n8n-workflow';
import { NodeOperationError, NodeConnectionType } from 'n8n-workflow';

import { chatFields, chatOperations } from './ChatDescription';

export class IttesAi implements INodeType {
	description: INodeTypeDescription = {
		displayName: 'Ittes AI',
		name: 'ittesAi',
		icon: { light: 'file:ittesAi.svg', dark: 'file:ittesAi.dark.svg' },
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
