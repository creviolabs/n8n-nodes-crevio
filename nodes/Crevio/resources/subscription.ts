import type { INodeProperties } from 'n8n-workflow';
import { getManyFields, idField, listRouting, simplifyField } from '../shared/descriptions';

const resource = 'subscription';

function action(path: string) {
	return {
		request: {
			method: 'POST' as const,
			url: `=/subscriptions/{{$parameter.subscriptionId}}/${path}`,
		},
	};
}

export const subscriptionDescription: INodeProperties[] = [
	{
		displayName: 'Operation',
		name: 'operation',
		type: 'options',
		noDataExpression: true,
		displayOptions: { show: { resource: [resource] } },
		options: [
			{
				name: 'Cancel',
				value: 'cancel',
				action: 'Cancel subscription',
				description: 'Cancel a subscription at the end of its current period',
				routing: action('cancel'),
			},
			{
				name: 'Get',
				value: 'get',
				action: 'Get subscription',
				description: 'Retrieve a subscription',
				routing: {
					request: { method: 'GET', url: '=/subscriptions/{{$parameter.subscriptionId}}' },
				},
			},
			{
				name: 'Get Many',
				value: 'getAll',
				action: 'Get many subscriptions',
				description: 'List subscriptions',
				routing: listRouting('/subscriptions'),
			},
			{
				name: 'Pause',
				value: 'pause',
				action: 'Pause subscription',
				description: 'Pause payment collection on a subscription',
				routing: action('pause'),
			},
			{
				name: 'Resume',
				value: 'resume',
				action: 'Resume subscription',
				description: 'Resume a paused or canceled subscription',
				routing: action('resume'),
			},
		],
		default: 'getAll',
	},
	idField(
		'Subscription ID',
		'subscriptionId',
		resource,
		['cancel', 'get', 'pause', 'resume'],
		'e.g. sub_abc123',
	),
	...getManyFields(resource, [
		{
			displayName: 'Status',
			name: 'status',
			type: 'options',
			options: [
				{ name: 'Active', value: 'active' },
				{ name: 'Canceled', value: 'canceled' },
				{ name: 'Incomplete', value: 'incomplete' },
				{ name: 'Past Due', value: 'past_due' },
				{ name: 'Paused', value: 'paused' },
				{ name: 'Trialing', value: 'trialing' },
				{ name: 'Unpaid', value: 'unpaid' },
			],
			default: 'active',
			description: 'Only return results with this status',
			routing: { send: { type: 'query', property: 'status' } },
		},
	]),
	simplifyField(
		resource,
		['get', 'getAll'],
		[
			'id',
			'status',
			'customer',
			'order',
			'current_period_start',
			'current_period_end',
			'trial_ends_at',
			'ends_at',
			'canceled',
			'paused',
		],
	),
];
