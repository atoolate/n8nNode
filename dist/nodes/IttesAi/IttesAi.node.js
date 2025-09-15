"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.IttesAi = void 0;
const n8n_workflow_1 = require("n8n-workflow");
const ChatDescription_1 = require("./ChatDescription");
class IttesAi {
    constructor() {
        this.description = {
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
            inputs: ["main" /* NodeConnectionType.Main */],
            outputs: ["main" /* NodeConnectionType.Main */],
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
                ...ChatDescription_1.chatOperations,
                ...ChatDescription_1.chatFields,
            ],
        };
        // Register getModels as a loadOptions method for dynamic dropdowns
        this.methods = {
            loadOptions: {
                async getModels() {
                    var _a, _b;
                    try {
                        const credentials = await this.getCredentials('ittesAiApi');
                        const apiUrl = credentials.url;
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
                        const models = (_a = response.models) !== null && _a !== void 0 ? _a : (_b = response.data) === null || _b === void 0 ? void 0 : _b.models;
                        if (!models || !Array.isArray(models)) {
                            console.error('No models array in response:', response);
                            return [
                                {
                                    name: 'No models found',
                                    value: '',
                                },
                            ];
                        }
                        return models.map((model) => ({
                            name: model,
                            value: model,
                        }));
                    }
                    catch (error) {
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
    }
    async execute() {
        const items = this.getInputData();
        const returnData = [];
        const resource = this.getNodeParameter('resource', 0);
        const operation = this.getNodeParameter('operation', 0);
        for (let i = 0; i < items.length; i++) {
            try {
                if (resource === 'chat') {
                    if (operation === 'generate') {
                        const credentials = await this.getCredentials('ittesAiApi');
                        const prompt = this.getNodeParameter('prompt', i);
                        const model = this.getNodeParameter('model', i);
                        const systemContext = this.getNodeParameter('systemContext', i, '');
                        const temperature = this.getNodeParameter('temperature', i, 0.7);
                        const maxTokens = this.getNodeParameter('maxTokens', i, 2048);
                        const additionalFields = this.getNodeParameter('additionalFields', i, {});
                        const body = {
                            prompt,
                            model,
                            system: systemContext, // Changed from systemContext to system to match your API
                            temperature,
                            maxTokens,
                            ...additionalFields,
                        };
                        // Construct the full URL manually
                        const apiUrl = credentials.url;
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
                            json: response,
                            pairedItem: { item: i },
                        });
                    }
                }
            }
            catch (error) {
                if (this.continueOnFail()) {
                    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
                    returnData.push({
                        json: { error: errorMessage },
                        pairedItem: { item: i },
                    });
                    continue;
                }
                throw new n8n_workflow_1.NodeOperationError(this.getNode(), error, {
                    itemIndex: i,
                });
            }
        }
        return [returnData];
    }
}
exports.IttesAi = IttesAi;
