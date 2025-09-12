# n8n-nodes-ittes-ai

This is an n8n community node that lets you interact with your custom Ittes AI API in your n8n workflows.

The Ittes AI node allows you to send prompts to your AI API with specific models and system context.

[n8n](https://n8n.io/) is a [fair-code licensed](https://docs.n8n.io/reference/license/) workflow automation platform.

[Installation](#installation)  
[Operations](#operations)  
[Credentials](#credentials)  
[Compatibility](#compatibility)  
[Usage](#usage)  
[Resources](#resources)  
[Version history](#version-history)  

## Installation

Follow the [installation guide](https://docs.n8n.io/integrations/community-nodes/installation/) in the n8n community nodes documentation.

## Operations

* **Chat**: Generate text using your AI model
  * Generate: Send a prompt with specified model and system context

## Credentials

This node requires API credentials for your Ittes AI service. You'll need:

* **API URL**: The base URL of your Ittes AI API
* **API Key**: Your API authentication key

## Compatibility

* n8n v0.187.0 and above

## Usage

### Basic Usage

1. Add the Ittes AI node to your workflow
2. Configure your credentials (API URL and API Key)
3. Set the following parameters:
   - **Prompt**: The text prompt to send to the AI
   - **Model**: The AI model to use (e.g., gpt-3.5-turbo)
   - **System Context**: Optional system instructions for the AI
   - **Temperature**: Controls randomness (0-2, default 0.7)
   - **Max Tokens**: Maximum response length (default 2048)

### Advanced Options

The node also supports additional parameters:
- **Top P**: Controls diversity via nucleus sampling
- **Frequency Penalty**: Reduces repetition
- **Presence Penalty**: Encourages new topics

### Example API Request

Your API endpoint should expect POST requests to `/chat/completions` with this structure:

```json
{
  "prompt": "Write a hello world program",
  "model": "gpt-3.5-turbo",
  "systemContext": "You are a helpful programming assistant",
  "temperature": 0.7,
  "maxTokens": 2048
}
```

## Resources

* [n8n community nodes documentation](https://docs.n8n.io/integrations/community-nodes/)
* [n8n workflow automation platform](https://n8n.io/)

## Version history

* **0.1.0**: Initial version with chat completions support

## Development

To build and test this node:

```bash
npm install
npm run build
npm run lint
```

## License

[MIT](https://github.com/n8n-io/n8n-nodes-starter/blob/master/LICENSE.md)