import type { INodeProperties } from 'n8n-workflow';
import { getManyFields, idField, queryFilter, simplifyField } from '../shared/descriptions';

const resource = 'order';
const expand = { expand: 'customer,line_items' };

export const orderDescription: INodeProperties[] = [
	{
		displayName: 'Operation',
		name: 'operation',
		type: 'options',
		noDataExpression: true,
		displayOptions: { show: { resource: [resource] } },
		options: [
			{
				name: 'Get',
				value: 'get',
				action: 'Get order',
				description: 'Retrieve an order with its customer and line items',
				routing: {
					request: { method: 'GET', url: '=/orders/{{$parameter.orderId}}', qs: expand },
				},
			},
			{
				name: 'Get Many',
				value: 'getAll',
				action: 'Get many orders',
				description: 'List orders, newest first',
				routing: {
					request: { method: 'GET', url: '/orders', qs: expand },
					output: { postReceive: [{ type: 'rootProperty', properties: { property: 'data' } }] },
				},
			},
		],
		default: 'getAll',
	},
	idField('Order ID', 'orderId', resource, ['get'], 'e.g. ord_abc123'),
	...getManyFields(resource, [
		queryFilter(
			'Customer ID',
			'customer',
			'customer',
			'Only return orders from this customer',
			'e.g. cus_abc123',
		),
		{
			displayName: 'Status',
			name: 'status',
			type: 'options',
			options: [
				{ name: 'Disputed', value: 'disputed' },
				{ name: 'Failed', value: 'failed' },
				{ name: 'Partially Refunded', value: 'partially_refunded' },
				{ name: 'Pending', value: 'pending' },
				{ name: 'Refunded', value: 'refunded' },
				{ name: 'Succeeded', value: 'succeeded' },
			],
			default: 'succeeded',
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
			'amount',
			'currency',
			'amount_refunded',
			'customer',
			'line_items',
			'billing_reason',
			'subscription',
			'created_at',
		],
	),
];
