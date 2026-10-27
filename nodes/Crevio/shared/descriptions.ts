import type {
	DeclarativeRestApiSettings,
	IDataObject,
	IExecutePaginationFunctions,
	IExecuteSingleFunctions,
	INodeExecutionData,
	INodeProperties,
	INodePropertyRouting,
} from 'n8n-workflow';

export const PAGE_SIZE = 100;

export function listRouting(url: string): INodePropertyRouting {
	return {
		request: { method: 'GET', url },
		output: { postReceive: [{ type: 'rootProperty', properties: { property: 'data' } }] },
	};
}

async function paginateAll(
	this: IExecutePaginationFunctions,
	requestData: DeclarativeRestApiSettings.ResultOptions,
): Promise<INodeExecutionData[]> {
	const query = requestData.options.qs ?? {};
	const items: INodeExecutionData[] = [];
	let startingAfter: string | undefined;

	while (true) {
		requestData.options.qs = { ...query, limit: PAGE_SIZE, starting_after: startingAfter };
		const page = await this.makeRoutingRequest(requestData);
		items.push(...page);
		if (page.length < PAGE_SIZE) return items;
		startingAfter = page[page.length - 1].json.id as string;
	}
}

export function simplifyTo(fields: string[]) {
	return async function (
		this: IExecuteSingleFunctions,
		items: INodeExecutionData[],
	): Promise<INodeExecutionData[]> {
		if (!this.getNodeParameter('simplify', true)) return items;
		return items.map((item) => {
			const json: IDataObject = {};
			for (const field of fields) {
				if (field in item.json) json[field] = item.json[field];
			}
			return { ...item, json };
		});
	};
}

export function simplifyField(
	resource: string,
	operations: string[],
	fields: string[],
): INodeProperties {
	return {
		displayName: 'Simplify',
		name: 'simplify',
		type: 'boolean',
		default: true,
		description: `Whether to return only the most used fields (${fields.join(', ')}) instead of the full object`,
		displayOptions: { show: { resource: [resource], operation: operations } },
		routing: { output: { postReceive: [simplifyTo(fields)] } },
	};
}

export function getManyFields(
	resource: string,
	filters: INodeProperties[] = [],
): INodeProperties[] {
	const show = { resource: [resource], operation: ['getAll'] };
	const fields: INodeProperties[] = [
		{
			displayName: 'Return All',
			name: 'returnAll',
			type: 'boolean',
			default: false,
			description: 'Whether to return all results or only up to a given limit',
			displayOptions: { show },
			routing: {
				send: {
					paginate: '={{ $value }}',
					type: 'query',
					property: 'limit',
					value: `${PAGE_SIZE}`,
				},
				operations: { pagination: paginateAll },
			},
		},
		{
			displayName: 'Limit',
			name: 'limit',
			type: 'number',
			default: 50,
			typeOptions: { minValue: 1, maxValue: PAGE_SIZE },
			description: 'Max number of results to return',
			displayOptions: { show: { ...show, returnAll: [false] } },
			routing: {
				send: { type: 'query', property: 'limit' },
				output: { maxResults: '={{ $value }}' },
			},
		},
	];

	if (filters.length > 0) {
		fields.push({
			displayName: 'Filters',
			name: 'filters',
			type: 'collection',
			placeholder: 'Add Filter',
			default: {},
			displayOptions: { show },
			options: filters,
		});
	}

	return fields;
}

export function queryFilter(
	displayName: string,
	name: string,
	property: string,
	description: string,
	placeholder?: string,
): INodeProperties {
	return {
		displayName,
		name,
		type: 'string',
		default: '',
		description,
		placeholder,
		routing: { send: { type: 'query', property, value: '={{ $value || undefined }}' } },
	};
}

export function metadataField(): INodeProperties {
	return {
		displayName: 'Metadata',
		name: 'metadata',
		type: 'fixedCollection',
		placeholder: 'Add Metadata',
		default: {},
		typeOptions: { multipleValues: true },
		description:
			'Your own key-value pairs, such as the record ID in another system. Crevio stores them and returns them on webhooks.',
		options: [
			{
				displayName: 'Pair',
				name: 'pairs',
				values: [
					{ displayName: 'Key', name: 'key', type: 'string', default: '' },
					{ displayName: 'Value', name: 'value', type: 'string', default: '' },
				],
			},
		],
		routing: {
			send: {
				type: 'body',
				property: 'metadata',
				value:
					'={{ Object.fromEntries(($value.pairs || []).filter(p => p.key).map(p => [p.key, p.value])) }}',
			},
		},
	};
}

export function idField(
	displayName: string,
	name: string,
	resource: string,
	operations: string[],
	placeholder: string,
	description = `The ID of the ${displayName.replace(/ ID$/, '').toLowerCase()}`,
): INodeProperties {
	return {
		displayName,
		name,
		type: 'string',
		required: true,
		default: '',
		placeholder,
		description,
		displayOptions: { show: { resource: [resource], operation: operations } },
	};
}

export function bodyField(property: string): INodePropertyRouting {
	return { send: { type: 'body', property, value: '={{ $value === "" ? undefined : $value }}' } };
}
