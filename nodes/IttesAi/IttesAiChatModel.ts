import {
    ChatResult,
} from '@langchain/core/outputs';
import { AIMessage, BaseMessage } from '@langchain/core/messages';
import { ToolCall } from '@langchain/core/messages/tool';
import {
    BaseChatModel,
    type BaseChatModelParams,
} from '@langchain/core/language_models/chat_models';
import type { CallbackManagerForLLMRun } from '@langchain/core/callbacks/manager';
import type { ISupplyDataFunctions } from 'n8n-workflow';
import { Runnable } from '@langchain/core/runnables';

// Structure your API may return
interface ApiToolCall {
    name: string;
    arguments: Record<string, any>;
    id?: string;
}

interface ApiResponse {
    response?: string;
    tool_calls?: ApiToolCall[];
}

interface IttesAIInput extends BaseChatModelParams {
    apiKey: string;
    baseUrl: string;
    model: string;
    temperature?: number;
    maxTokens?: number;
    topP?: number;
    frequencyPenalty?: number;
    presencePenalty?: number;
    executionContext: ISupplyDataFunctions; // Pass the n8n execution context
    tools?: any[];
}

export class IttesAiChatModel extends BaseChatModel {
    apiKey: string;
    baseUrl: string;
    model: string;
    temperature?: number | undefined;
    maxTokens?: number | undefined;
    topP?: number | undefined;
    frequencyPenalty?: number | undefined;
    presencePenalty?: number | undefined;
    executionContext: ISupplyDataFunctions;
	tools: any[]; // To hold tools if any are passed

    constructor(fields: IttesAIInput) {
        super(fields);
        this.apiKey = fields.apiKey;
        this.baseUrl = fields.baseUrl;
        this.model = fields.model;
        this.temperature = fields.temperature;
        this.maxTokens = fields.maxTokens;
        this.topP = fields.topP;
        this.frequencyPenalty = fields.frequencyPenalty;
        this.presencePenalty = fields.presencePenalty;
        this.executionContext = fields.executionContext;
		this.tools = fields.tools ?? [];
    }

    _llmType(): string {
        return 'ittes-ai-chat';
    }

    override bindTools(tools: any[]): Runnable<any, any> {
        return new IttesAiChatModel({
            apiKey: this.apiKey,
            baseUrl: this.baseUrl,
            model: this.model,
            temperature: this.temperature ?? 0.7,
            maxTokens: this.maxTokens ?? 2048,
            topP: this.topP ?? 1,
            frequencyPenalty: this.frequencyPenalty ?? 0,
            presencePenalty: this.presencePenalty ?? 0,
            executionContext: this.executionContext,
            tools: tools,
        });
    }

    async _generate(
        messages: BaseMessage[],
        options: this['ParsedCallOptions'],
        _runManager?: CallbackManagerForLLMRun,
    ): Promise<ChatResult> {
        const systemMessage = messages.find((msg) => msg._getType() === 'system');
        const userMessage = messages.find((msg) => msg._getType() === 'human');

        const requestBody: any = {
            prompt: userMessage?.content ?? '',
            system: systemMessage?.content ?? undefined,
            model: this.model,
            temperature: this.temperature,
            maxTokens: this.maxTokens,
            topP: this.topP,
            frequencyPenalty: this.frequencyPenalty,
            presencePenalty: this.presencePenalty,
        };

        const tools = this.tools.concat((options as any).tools ?? []);
        if (tools.length > 0) {
            requestBody.tools = tools.map((tool: any) => ({
                name: tool.name,
                description: tool.description,
                parameters: tool.schema,
            }));
        }

        const json = (await this.executionContext.helpers.httpRequest({
            method: 'POST',
            url: `${this.baseUrl}/api/n8n/chat`,
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${this.apiKey}`,
            },
            body: requestBody,
            json: true,
        })) as ApiResponse;

        const generations: any[] = [];
        let content = '';
        const toolCalls: ToolCall[] = [];

        if (json.tool_calls && json.tool_calls.length > 0) {
            // API requested tool calls
            for (const toolCall of json.tool_calls) {
                toolCalls.push({
                    name: toolCall.name,
                    args: toolCall.arguments,
                    id: toolCall.id ?? `call_${Math.random().toString(36).slice(2)}`,
                    type: 'tool_call',
                });
            }
        } else {
            // API returned a standard text response
            content = json.response ?? '';
        }

        generations.push({
            text: content,
            message: new AIMessage({
                content: content,
                tool_calls: toolCalls,
            }),
        });

        return {
            generations,
            llmOutput: {},
        };
    }
}
