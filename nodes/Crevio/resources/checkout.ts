import type { INodeProperties } from 'n8n-workflow';
import { bodyField, idField, metadataField, simplifyField } from '../shared/descriptions';

const resource = 'checkout';

export const checkoutDescription: INodeProperties[] = [
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
				action: 'Create checkout',
				description: "Create a checkout and get the buyer's payment link in 'purchase_url'",
				routing: { request: { method: 'POST', url: '/checkouts' } },
			},
			{
				name: 'Get',
				value: 'get',
				action: 'Get checkout',
				description: 'Retrieve a checkout and its status',
				routing: { request: { method: 'GET', url: '=/checkouts/{{$parameter.checkoutId}}' } },
			},
		],
		default: 'create',
	},
	idField('Checkout ID', 'checkoutId', resource, ['get'], 'e.g. co_abc123'),
	{
		displayName: 'Line Items',
		name: 'lineItems',
		type: 'fixedCollection',
		placeholder: 'Add Line Item',
		required: true,
		default: { items: [{ priceVariant: '', quantity: 1 }] },
		typeOptions: { multipleValues: true },
		description: "What the buyer pays for. Find price IDs in a product's 'price_variants'.",
		displayOptions: { show: { resource: [resource], operation: ['create'] } },
		options: [
			{
				displayName: 'Item',
				name: 'items',
				values: [
					{
						displayName: 'Price ID',
						name: 'priceVariant',
						type: 'string',
						placeholder: 'e.g. price_abc123',
						default: '',
					},
					{
						displayName: 'Quantity',
						name: 'quantity',
						type: 'number',
						typeOptions: { minValue: 1 },
						default: 1,
					},
				],
			},
		],
		routing: {
			send: {
				type: 'body',
				property: 'line_items',
				value:
					'={{ ($value.items || []).map(item => ({ price_variant: item.priceVariant, quantity: item.quantity })) }}',
			},
		},
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
				displayName: 'Customer ID',
				name: 'customer',
				type: 'string',
				placeholder: 'e.g. cus_abc123',
				default: '',
				description: 'Attach the checkout to an existing customer',
				routing: bodyField('customer'),
			},
			{
				displayName: 'Discount Code',
				name: 'discountCode',
				type: 'string',
				placeholder: 'e.g. SPRING20',
				default: '',
				routing: bodyField('discount_code'),
			},
			{
				displayName: 'Email',
				name: 'email',
				type: 'string',
				placeholder: 'e.g. nathan@example.com',
				default: '',
				description: "Prefill the buyer's email",
				routing: bodyField('email'),
			},
			{
				...metadataField(),
				description:
					'Your own key-value pairs. They are copied to the order this checkout creates.',
			},
		],
	},
	simplifyField(
		resource,
		['get'],
		[
			'id',
			'status',
			'purchase_url',
			'total',
			'currency',
			'mode',
			'customer',
			'checkout_items',
			'metadata',
			'created_at',
		],
	),
];
