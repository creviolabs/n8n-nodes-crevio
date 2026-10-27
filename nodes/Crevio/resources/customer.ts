import type { INodeProperties } from 'n8n-workflow';
import {
	bodyField,
	getManyFields,
	idField,
	listRouting,
	metadataField,
	queryFilter,
	simplifyField,
} from '../shared/descriptions';
import { locator } from '../shared/locators';

const resource = 'customer';
const customerPath = '=/customers/{{$parameter.customerId}}';

const customerTypeOptions = [
	{ name: 'Lead', value: 'lead', description: 'Has shown interest but not signed up or bought' },
	{ name: 'Free', value: 'free', description: 'Signed up or claimed something free' },
	{ name: 'Paid', value: 'paid', description: 'Has bought something' },
];

function customerFields(): INodeProperties[] {
	return [
		{
			displayName: 'Email',
			name: 'email',
			type: 'string',
			placeholder: 'e.g. nathan@example.com',
			default: '',
			routing: bodyField('email'),
		},
		{
			displayName: 'Name',
			name: 'name',
			type: 'string',
			placeholder: 'e.g. Nathan Smith',
			default: '',
			routing: bodyField('name'),
		},
		{
			displayName: 'First Name',
			name: 'firstName',
			type: 'string',
			placeholder: 'e.g. Nathan',
			default: '',
			routing: bodyField('first_name'),
		},
		{
			displayName: 'Last Name',
			name: 'lastName',
			type: 'string',
			placeholder: 'e.g. Smith',
			default: '',
			routing: bodyField('last_name'),
		},
		{
			displayName: 'Type',
			name: 'customerType',
			type: 'options',
			options: customerTypeOptions,
			default: 'lead',
			routing: bodyField('customer_type'),
		},
		{
			displayName: 'Notes',
			name: 'notes',
			type: 'string',
			typeOptions: { rows: 3 },
			default: '',
			routing: bodyField('notes'),
		},
		{
			displayName: 'Tag IDs',
			name: 'tagIds',
			type: 'string',
			default: '',
			placeholder: 'e.g. tag_abc123,tag_def456',
			description: "Comma-separated tag IDs. On update, this replaces the customer's tags.",
			routing: {
				send: {
					type: 'body',
					property: 'tag_ids',
					value: '={{ $value.split(",").map(id => id.trim()).filter(Boolean) }}',
				},
			},
		},
		metadataField(),
	];
}

export const customerDescription: INodeProperties[] = [
	{
		displayName: 'Operation',
		name: 'operation',
		type: 'options',
		noDataExpression: true,
		displayOptions: { show: { resource: [resource] } },
		options: [
			{
				name: 'Add Tag',
				value: 'addTag',
				action: 'Add tag to customer',
				description: 'Add a tag to a customer, which can start automations that listen for it',
				routing: { request: { method: 'POST', url: '=/customers/{{$parameter.customerId}}/tags' } },
			},
			{
				name: 'Create',
				value: 'create',
				action: 'Create customer',
				description: 'Create a customer or lead',
				routing: { request: { method: 'POST', url: '/customers' } },
			},
			{
				name: 'Delete',
				value: 'delete',
				action: 'Delete customer',
				description: 'Delete a customer',
				routing: { request: { method: 'DELETE', url: customerPath } },
			},
			{
				name: 'Get',
				value: 'get',
				action: 'Get customer',
				description: 'Retrieve a customer',
				routing: { request: { method: 'GET', url: customerPath } },
			},
			{
				name: 'Get Many',
				value: 'getAll',
				action: 'Get many customers',
				description: 'List or search customers',
				routing: listRouting('/customers'),
			},
			{
				name: 'Remove Tag',
				value: 'removeTag',
				action: 'Remove tag from customer',
				description: 'Remove a tag from a customer',
				routing: {
					request: {
						method: 'DELETE',
						url: '=/customers/{{$parameter.customerId}}/tags/{{$parameter.tagId}}',
					},
				},
			},
			{
				name: 'Update',
				value: 'update',
				action: 'Update customer',
				description: 'Update a customer',
				routing: { request: { method: 'PATCH', url: customerPath } },
			},
		],
		default: 'getAll',
	},
	locator(
		'Customer',
		'customerId',
		resource,
		['addTag', 'delete', 'get', 'removeTag', 'update'],
		'searchCustomers',
		'e.g. cus_abc123',
	),
	{
		...idField('Tag ID', 'tagId', resource, ['addTag'], 'e.g. tag_abc123'),
		routing: { send: { type: 'body', property: 'tag.id' } },
	},
	idField('Tag ID', 'tagId', resource, ['removeTag'], 'e.g. tag_abc123'),
	{
		displayName: 'Email',
		name: 'email',
		type: 'string',
		placeholder: 'e.g. nathan@example.com',
		required: true,
		default: '',
		displayOptions: { show: { resource: [resource], operation: ['create'] } },
		routing: bodyField('email'),
	},
	{
		displayName: 'Additional Fields',
		name: 'additionalFields',
		type: 'collection',
		placeholder: 'Add Field',
		default: {},
		displayOptions: { show: { resource: [resource], operation: ['create'] } },
		options: customerFields().filter((field) => field.name !== 'email'),
	},
	{
		displayName: 'Update Fields',
		name: 'updateFields',
		type: 'collection',
		placeholder: 'Add Field',
		default: {},
		displayOptions: { show: { resource: [resource], operation: ['update'] } },
		options: customerFields(),
	},
	...getManyFields(resource, [
		queryFilter(
			'Search',
			'query',
			'query',
			'Match customers whose email or name contains this text',
			'e.g. nathan',
		),
		{
			displayName: 'Type',
			name: 'customerType',
			type: 'options',
			options: customerTypeOptions,
			default: 'lead',
			routing: { send: { type: 'query', property: 'customer_type' } },
		},
	]),
	simplifyField(
		resource,
		['get', 'getAll'],
		[
			'id',
			'email',
			'name',
			'first_name',
			'last_name',
			'customer_type',
			'orders_count',
			'total_spend',
			'tags',
			'created_at',
		],
	),
];
