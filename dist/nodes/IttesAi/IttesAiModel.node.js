"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.IttesAiModel = void 0;
const IttesAiChatModel_1 = require("./IttesAiChatModel");
class IttesAiModel {
    constructor() {
        this.description = {
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
            outputs: ["ai_languageModel" /* NodeConnectionType.AiLanguageModel */],
            outputNames: ['Model'],
            credentials: [
                {
                    name: 'ittesAiApi',
                    required: true,
                },
            ],
            properties: [
                {
                    displayName: 'Each model has different capabilities and costs. <a href="https://docs.ittesai.com/models" target="_blank">Learn more about available models</a>.',
                    name: 'notice',
                    type: 'notice',
                    default: '',
                },
                {
                    displayName: 'Model',
                    name: 'model',
                    type: 'options',
                    description: 'The model which will generate the completion. <a href="https://docs.ittesai.com/models">Learn more</a>.',
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
                            description: 'Controls randomness: Lowering results in less random completions. As the temperature approaches zero, the model will become deterministic and repetitive.',
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
                            description: 'Controls diversity via nucleus sampling: 0.5 means half of all likelihood-weighted options are considered. We generally recommend altering this or temperature but not both.',
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
                            description: "Positive values penalize new tokens based on their existing frequency in the text so far, decreasing the model's likelihood to repeat the same line verbatim",
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
                            description: "Positive values penalize new tokens based on whether they appear in the text so far, increasing the model's likelihood to talk about new topics",
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
        this.methods = {
            loadOptions: {
                async getModels() {
                    var _a, _b;
                    try {
                        const credentials = await this.getCredentials('ittesAiApi');
                        const apiUrl = credentials.url;
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
                        const models = (_a = response.models) !== null && _a !== void 0 ? _a : (_b = response.data) === null || _b === void 0 ? void 0 : _b.models;
                        if (!models || !Array.isArray(models)) {
                            console.error('IttesAiModel: No models array in response:', response);
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
    }
    async supplyData(itemIndex) {
        const modelName = this.getNodeParameter('model', itemIndex);
        const nodeOptions = this.getNodeParameter('options', itemIndex, {});
        const credentials = await this.getCredentials('ittesAiApi');
        const baseUrl = credentials.url;
        const apiKey = credentials.apiKey;
        return {
            response: new IttesAiChatModel_1.IttesAIChatModel({
                model: modelName,
                baseUrl,
                apiKey,
                ...nodeOptions,
            }),
        };
    }
}
exports.IttesAiModel = IttesAiModel;
