import type { INodeProperties } from 'n8n-workflow';
import {
	bodyField,
	getManyFields,
	idField,
	listRouting,
	queryFilter,
	simplifyField,
} from '../shared/descriptions';

const resource = 'refund';

export const refundDescription: INodeProperties[] = [
	{
		displayName: 'Operation',
		name: 'operation',
		type: 'options',
		noDataExpression: true,
		displayOptions: { show: { resource: [resource] } },
		options: [
			{
				name: 'Create',
				value: 'create',
				action: 'Create refund',
				description: 'Refund an order in full or in part',
				routing: { request: { method: 'POST', url: '/refunds' } },
			},
			{
				name: 'Get',
				value: 'get',
				action: 'Get refund',
				description: 'Retrieve a refund',
				routing: { request: { method: 'GET', url: '=/refunds/{{$parameter.refundId}}' } },
			},
			{
				name: 'Get Many',
				value: 'getAll',
				action: 'Get many refunds',
				description: 'List refunds',
				routing: listRouting('/refunds'),
			},
		],
		default: 'create',
	},
	idField('Refund ID', 'refundId', resource, ['get'], 'e.g. re_abc123'),
	{
		...idField('Order ID', 'order', resource, ['create'], 'e.g. ord_abc123', 'The order to refund'),
		routing: bodyField('order'),
	},
	{
		displayName: 'Additional Fields',
		name: 'additionalFields',
		type: 'collection',
		placeholder: 'Add Field',
		default: {},
		displayOptions: { show: { resource: [resource], operation: ['create'] } },
		options: [
			{
				displayName: 'Amount (in Cents)',
				name: 'amount',
				type: 'number',
				typeOptions: { minValue: 1 },
				default: 100,
				description:
					'Amount to refund in the smallest currency unit, e.g. 1500 for $15.00. Leave out to refund the full order.',
				routing: bodyField('amount'),
			},
			{
				displayName: 'Notes',
				name: 'notes',
				type: 'string',
				typeOptions: { rows: 2 },
				default: '',
				description: 'Internal notes, not shown to the buyer',
				routing: bodyField('notes'),
			},
			{
				displayName: 'Reason',
				name: 'reason',
				type: 'options',
				options: [
					{ name: 'Duplicate', value: 'duplicate' },
					{ name: 'Fraudulent', value: 'fraudulent' },
					{ name: 'Requested by Customer', value: 'requested_by_customer' },
				],
				default: 'requested_by_customer',
				routing: bodyField('reason'),
			},
		],
	},
	...getManyFields(resource, [
		queryFilter(
			'Order ID',
			'order',
			'order',
			'Only return refunds of this order',
			'e.g. ord_abc123',
		),
	]),
	simplifyField(
		resource,
		['get', 'getAll'],
		[
			'id',
			'amount',
			'currency',
			'status',
			'reason',
			'order',
			'provider',
			'livemode',
			'metadata',
			'created_at',
		],
	),
];
