import type { ICredentialType, INodeProperties } from 'n8n-workflow';
export declare class IttesAiApi implements ICredentialType {
    name: string;
    displayName: string;
    documentationUrl: string;
    properties: INodeProperties[];
    authenticate: {
        readonly type: "generic";
        readonly properties: {
            readonly headers: {
                readonly Authorization: "=Bearer {{$credentials.apiKey}}";
            };
        };
    };
    test: {
        request: {
            baseURL: string;
            url: string;
            method: "POST";
            body: {
                prompt: string;
                model: string;
            };
        };
    };
}
