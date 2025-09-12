module.exports = {
	root: true,
	env: {
		browser: true,
		es6: true,
		node: true,
	},
	parser: '@typescript-eslint/parser',
	parserOptions: {
		project: 'tsconfig.json',
		sourceType: 'module',
		extraFileExtensions: ['.json'],
	},
	plugins: [
		'@typescript-eslint',
		'n8n-nodes-base',
	],
	extends: [
		'eslint:recommended',
		'@typescript-eslint/recommended',
		'plugin:n8n-nodes-base/recommended',
	],
	rules: {
		'n8n-nodes-base/node-dirname-against-convention': 'error',
		'n8n-nodes-base/node-class-description-inputs-wrong-regular-node': 'error',
		'n8n-nodes-base/node-class-description-outputs-wrong': 'error',
		'n8n-nodes-base/node-class-description-name-miscased': 'error',
		'n8n-nodes-base/node-class-description-icon-not-svg': 'error',
		'n8n-nodes-base/cred-class-field-documentation-url-not-http-url': 'error',
		'n8n-nodes-base/cred-class-field-name-unsuffixed': 'error',
		'n8n-nodes-base/cred-class-name-unsuffixed': 'error',
		'n8n-nodes-base/node-class-description-missing-subtitle': 'error',
		'n8n-nodes-base/node-class-description-empty-string': 'error',
		'n8n-nodes-base/node-class-description-icon-not-color': 'error',
		'n8n-nodes-base/node-filename-against-convention': 'error',
	},
};