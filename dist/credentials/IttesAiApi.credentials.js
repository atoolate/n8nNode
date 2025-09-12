"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.IttesAiApi = void 0;
class IttesAiApi {
    constructor() {
        this.name = 'ittesAiApi';
        this.displayName = 'Ittes AI API';
        this.documentationUrl = 'https://docs.ittesai.com';
        this.properties = [
            {
                displayName: 'API URL',
                name: 'url',
                type: 'string',
                default: 'https://api.ittesai.com',
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
        this.authenticate = {
            type: 'generic',
            properties: {
                headers: {
                    Authorization: '=Bearer {{$credentials.apiKey}}',
                },
            },
        };
        this.test = {
            request: {
                baseURL: '={{$credentials.url}}',
                url: '/chat',
                method: 'POST',
                body: {
                    prompt: 'Test connection',
                    model: 'test',
                },
            },
        };
    }
}
exports.IttesAiApi = IttesAiApi;
