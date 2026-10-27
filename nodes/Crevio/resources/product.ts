import type { INodeProperties } from 'n8n-workflow';
import {
	bodyField,
	getManyFields,
	listRouting,
	metadataField,
	queryFilter,
	simplifyField,
} from '../shared/descriptions';
import { locator } from '../shared/locators';

const resource = 'product';
const productPath = '=/products/{{$parameter.productId}}';

const statusOptions = [
	{ name: 'Draft', value: 'draft', description: 'Hidden from buyers' },
	{ name: 'Active', value: 'active', description: 'For sale. Needs at least one price.' },
	{ name: 'Archived', value: 'archived', description: 'No longer for sale' },
];

function productFields(): INodeProperties[] {
	return [
		{
			displayName: 'Name',
			name: 'name',
			type: 'string',
			placeholder: 'e.g. Intro to Watercolor',
			default: '',
			routing: bodyField('name'),
		},
		{
			displayName: 'Status',
			name: 'status',
			type: 'options',
			options: statusOptions,
			default: 'draft',
			routing: bodyField('status'),
		},
		{
			displayName: 'Description',
			name: 'description',
			type: 'string',
			typeOptions: { rows: 3 },
			default: '',
			description: 'Short description shown on the product card',
			routing: bodyField('description'),
		},
		{
			displayName: 'Page Content (HTML)',
			name: 'bodyHtml',
			type: 'string',
			typeOptions: { rows: 5 },
			default: '',
			description: 'Long description shown on the product page',
			routing: bodyField('body_html'),
		},
		{
			displayName: 'Slug',
			name: 'slug',
			type: 'string',
			placeholder: 'e.g. intro-to-watercolor',
			default: '',
			description: "The product's address on your site",
			routing: bodyField('slug'),
		},
		{
			displayName: 'Button Text',
			name: 'buttonCta',
			type: 'string',
			placeholder: 'e.g. Enroll now',
			default: '',
			routing: bodyField('button_cta'),
		},
		{
			displayName: 'Available From',
			name: 'availableFrom',
			type: 'dateTime',
			default: '',
			routing: bodyField('available_from'),
		},
		{
			displayName: 'Available Until',
			name: 'availableUntil',
			type: 'dateTime',
			default: '',
			routing: bodyField('available_until'),
		},
		metadataField(),
	];
}

export const productDescription: INodeProperties[] = [
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
				action: 'Create product',
				description: 'Create a product as a draft',
				routing: { request: { method: 'POST', url: '/products' } },
			},
			{
				name: 'Delete',
				value: 'delete',
				action: 'Delete product',
				description: 'Delete a product',
				routing: { request: { method: 'DELETE', url: productPath } },
			},
			{
				name: 'Get',
				value: 'get',
				action: 'Get product',
				description: 'Retrieve a product with its prices',
				routing: { request: { method: 'GET', url: productPath } },
			},
			{
				name: 'Get Many',
				value: 'getAll',
				action: 'Get many products',
				description: 'List or search products',
				routing: listRouting('/products'),
			},
			{
				name: 'Update',
				value: 'update',
				action: 'Update product',
				description: 'Update or publish a product',
				routing: { request: { method: 'PATCH', url: productPath } },
			},
		],
		default: 'getAll',
	},
	locator(
		'Product',
		'productId',
		resource,
		['delete', 'get', 'update'],
		'searchProducts',
		'e.g. prod_abc123 or intro-to-watercolor',
	),
	{
		displayName: 'Name',
		name: 'name',
		type: 'string',
		placeholder: 'e.g. Intro to Watercolor',
		required: true,
		default: '',
		displayOptions: { show: { resource: [resource], operation: ['create'] } },
		routing: bodyField('name'),
	},
	{
		displayName: 'Additional Fields',
		name: 'additionalFields',
		type: 'collection',
		placeholder: 'Add Field',
		default: {},
		displayOptions: { show: { resource: [resource], operation: ['create'] } },
		options: productFields().filter((field) => field.name !== 'name' && field.name !== 'status'),
	},
	{
		displayName: 'Update Fields',
		name: 'updateFields',
		type: 'collection',
		placeholder: 'Add Field',
		default: {},
		displayOptions: { show: { resource: [resource], operation: ['update'] } },
		options: productFields(),
	},
	...getManyFields(resource, [
		queryFilter(
			'Search',
			'query',
			'query',
			'Match products whose name contains this text',
			'e.g. watercolor',
		),
		{
			displayName: 'Status',
			name: 'status',
			type: 'options',
			options: [
				{ name: 'Active', value: 'active' },
				{ name: 'Archived', value: 'archived' },
				{ name: 'Draft', value: 'draft' },
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
			'name',
			'slug',
			'status',
			'description',
			'url',
			'price_variants',
			'published_at',
			'created_at',
			'updated_at',
		],
	),
];
