import type { INodeProperties } from 'n8n-workflow';
import { bodyField, idField, simplifyField } from '../shared/descriptions';

const resource = 'agent';
const sendOperations = ['sendMessage', 'sendFollowUp'];

const responseSchema: INodeProperties = {
	displayName: 'Response Schema',
	name: 'responseFormat',
	type: 'json',
	default:
		'{\n  "type": "object",\n  "properties": {\n    "answer": { "type": "string" }\n  },\n  "required": ["answer"]\n}',
	description:
		'A JSON Schema the reply must match, for replies the next node can read field by field',
	routing: {
		send: {
			type: 'body',
			property: 'response_format',
			value: '={{ typeof $value === "string" ? JSON.parse($value) : $value }}',
		},
	},
};

export const agentDescription: INodeProperties[] = [
	{
		displayName: 'Operation',
		name: 'operation',
		type: 'options',
		noDataExpression: true,
		displayOptions: { show: { resource: [resource] } },
		options: [
			{
				name: 'Get Run',
				value: 'getRun',
				action: 'Get agent run',
				description: 'Check on a run that was still working, and read its reply once it finishes',
				routing: { request: { method: 'GET', url: '=/task_runs/{{$parameter.runId}}' } },
			},
			{
				name: 'Send Follow-Up Message',
				value: 'sendFollowUp',
				action: 'Send follow up message to agent',
				description: 'Continue an existing chat with the Crevio agent',
				routing: { request: { method: 'POST', url: '=/chats/{{$parameter.chatId}}/messages' } },
			},
			{
				name: 'Send Message',
				value: 'sendMessage',
				action: 'Send message to agent',
				description:
					"Start a chat and hand the Crevio agent a job in plain language. The API key needs the 'Give the agent work' permission.",
				routing: { request: { method: 'POST', url: '/chats' } },
			},
		],
		default: 'sendMessage',
	},
	idField(
		'Chat ID',
		'chatId',
		resource,
		['sendFollowUp'],
		'e.g. aichat_abc123',
		"The 'chat_id' returned by 'Send Message'",
	),
	idField(
		'Run ID',
		'runId',
		resource,
		['getRun'],
		'e.g. trun_abc123',
		"The 'id' returned by 'Send Message' or 'Send Follow-Up Message'",
	),
	{
		displayName: 'Message',
		name: 'message',
		type: 'string',
		typeOptions: { rows: 4 },
		required: true,
		default: '',
		placeholder:
			'e.g. Email every customer who bought the watercolor course this week a thank-you note',
		description: 'What you want done, with all the context the agent needs',
		displayOptions: { show: { resource: [resource], operation: sendOperations } },
		routing: bodyField('message'),
	},
	{
		displayName: 'Wait for Reply (Seconds)',
		name: 'waitSeconds',
		type: 'number',
		typeOptions: { minValue: 0, maxValue: 90 },
		default: 60,
		description:
			"How long to wait for the agent to finish. If it is still working, the run comes back with status 'pending' or 'running': use 'Get Run' to read the reply later.",
		displayOptions: { show: { resource: [resource], operation: sendOperations } },
		routing: bodyField('wait_seconds'),
	},
	{
		displayName: 'Options',
		name: 'options',
		type: 'collection',
		placeholder: 'Add Option',
		default: {},
		displayOptions: { show: { resource: [resource], operation: ['sendMessage'] } },
		options: [
			{
				displayName: 'Approval Mode',
				name: 'approvalMode',
				type: 'options',
				options: [
					{ name: 'Autonomous', value: 'autonomous', description: 'The agent acts without asking' },
					{
						name: 'Supervised',
						value: 'supervised',
						description: 'The agent pauses for your approval in Crevio before each change',
					},
					{
						name: 'Read Only',
						value: 'read_only',
						description: 'The agent can look but not change anything',
					},
				],
				default: 'autonomous',
				routing: bodyField('approval_mode'),
			},
			responseSchema,
			{
				displayName: 'Speed',
				name: 'speed',
				type: 'options',
				options: [
					{ name: 'Smarter', value: 'smarter', description: 'Thinks it through' },
					{ name: 'Faster', value: 'faster', description: 'Thinks less, for simple jobs' },
				],
				default: 'smarter',
				routing: bodyField('speed'),
			},
		],
	},
	{
		displayName: 'Options',
		name: 'options',
		type: 'collection',
		placeholder: 'Add Option',
		default: {},
		displayOptions: { show: { resource: [resource], operation: ['sendFollowUp'] } },
		options: [responseSchema],
	},
	simplifyField(
		resource,
		['getRun', ...sendOperations],
		[
			'id',
			'chat_id',
			'status',
			'result',
			'json',
			'json_error',
			'error_message',
			'pending_approval_ids',
			'artifacts',
			'credits_consumed',
		],
	),
];
