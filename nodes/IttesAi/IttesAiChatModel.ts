import { LLM, type BaseLLMParams } from '@langchain/core/language_models/llms';
import type { CallbackManagerForLLMRun } from '@langchain/core/callbacks/manager';

interface IttesAIInput extends BaseLLMParams {
	apiKey: string;
	baseUrl: string;
	model: string;
	temperature?: number | undefined;
	maxTokens?: number | undefined;
	topP?: number | undefined;
	frequencyPenalty?: number | undefined;
	presencePenalty?: number | undefined;
}

export class IttesAIChatModel extends LLM {
	apiKey: string;
	baseUrl: string;
	model: string;
	temperature?: number | undefined;
	maxTokens?: number | undefined;
	topP?: number | undefined;
	frequencyPenalty?: number | undefined;
	presencePenalty?: number | undefined;

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
	}

	_llmType(): string {
		return 'ittes-ai';
	}

	/**
	 * Core method to call the Ittes AI API and return the response.
	 */
	/* eslint-disable @typescript-eslint/no-unused-vars */
	async _call(
		prompt: string,
		_options: this['ParsedCallOptions'],
		_runManager?: CallbackManagerForLLMRun,
	): Promise<string> {
		try {
			const requestBody: any = {
				prompt,
				model: this.model,
				temperature: this.temperature,
				maxTokens: this.maxTokens,
				topP: this.topP,
				frequencyPenalty: this.frequencyPenalty,
				presencePenalty: this.presencePenalty,
			};

			const response = await fetch(`${this.baseUrl}/api/n8n/chat`, {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
					Authorization: `Bearer ${this.apiKey}`,
				},
				body: JSON.stringify(requestBody),
			});

			if (!response.ok) {
				throw new Error(`HTTP error! status: ${response.status}`);
			}

			const json = (await response.json()) as {
				output?: string;
				content?: string;
				message?: string;
				response?: string;
			};
			return json.output || json.content || json.message || json.response || '';
		} catch (error) {
			console.error('Error in IttesAIChatModel._call:', error);
			throw error;
		}
	}
	/* eslint-enable @typescript-eslint/no-unused-vars */
}
