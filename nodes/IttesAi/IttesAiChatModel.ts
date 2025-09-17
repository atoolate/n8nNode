import {
    ChatResult,
} from '@langchain/core/outputs';
import { AIMessage, BaseMessage, HumanMessage, SystemMessage, ToolMessage } from '@langchain/core/messages';
import { ToolCall } from '@langchain/core/messages/tool';
import {
    BaseChatModel,
    type BaseChatModelParams,
} from '@langchain/core/language_models/chat_models';
import type { CallbackManagerForLLMRun } from '@langchain/core/callbacks/manager';
import type { ISupplyDataFunctions } from 'n8n-workflow';
import { Runnable } from '@langchain/core/runnables';
import { convertToOpenAITool } from "@langchain/core/utils/function_calling"; // <-- IMPORT THIS


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
    temperature?: number | undefined;
    maxTokens?: number | undefined;
    topP?: number | undefined;
    frequencyPenalty?: number | undefined;
    presencePenalty?: number | undefined;
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
            ...this,
            tools: tools,
        });
    }

    async _generate(
        messages: BaseMessage[],
        options: this['ParsedCallOptions'],
        _runManager?: CallbackManagerForLLMRun,
    ): Promise<ChatResult> {
        // Correctly format messages into the structure your API expects
        const formattedMessages = messages.map(msg => {
            if (msg._getType() === 'system') {
                return { role: 'system', content: msg.content };
            }
            if (msg._getType() === 'human') {
                return { role: 'user', content: [{ type: 'text', text: msg.content }] };
            }
            if (msg._getType() === 'ai') {
                return { role: 'assistant', content: msg.content };
            }
            if (msg._getType() === 'tool') {
                return { role: 'tool', content: msg.content, tool_use_id: (msg as ToolMessage).tool_call_id };
            }
            return { role: 'user', content: msg.content };
        }).filter(msg => msg.role !== 'system'); // Remove system messages from the main prompt array

        const systemMessage = messages.find((msg) => msg._getType() === 'system') as SystemMessage | undefined;

        const requestBody: any = {
            prompt: formattedMessages,
            model: this.model,
            temperature: this.temperature,
            maxTokens: this.maxTokens,
            topP: this.topP,
            frequencyPenalty: this.frequencyPenalty,
            presencePenalty: this.presencePenalty,
        };

        // Add system message if it exists
        if (systemMessage) {
            requestBody.system = systemMessage.content;
        }

         // FIX: Correctly handle and convert tools
        if (this.tools && this.tools.length > 0) {
            requestBody.tools = this.tools.map((tool: any) => {
                // The n8n agent may wrap the tool. We need the core definition.
                const toolDefinition = tool.lc_kwargs?.function ?? tool;
                return convertToOpenAITool(toolDefinition);
            });
        }

        const json = (await this.executionContext.helpers.httpRequest({
            method: 'POST',
            url: `${this.baseUrl}/api/n8n/agent`,
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