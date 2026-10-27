import type {
	IDataObject,
	ILoadOptionsFunctions,
	INodeListSearchResult,
	INodeProperties,
} from 'n8n-workflow';

interface ListResponse {
	data: IDataObject[];
	has_more: boolean;
}

async function search(
	this: ILoadOptionsFunctions,
	path: string,
	filter: string | undefined,
	paginationToken: string | undefined,
	label: (item: IDataObject) => string,
): Promise<INodeListSearchResult> {
	const credentials = await this.getCredentials<{ baseUrl: string }>('crevioApi');
	const response = (await this.helpers.httpRequestWithAuthentication.call(this, 'crevioApi', {
		method: 'GET',
		url: `${credentials.baseUrl.replace(/\/+$/, '')}${path}`,
		qs: { limit: 100, query: filter || undefined, starting_after: paginationToken },
		json: true,
	})) as ListResponse;

	const results = response.data.map((item) => ({ name: label(item), value: item.id as string }));
	const last = response.data[response.data.length - 1];
	return { results, paginationToken: response.has_more && last ? (last.id as string) : undefined };
}

export async function searchCustomers(
	this: ILoadOptionsFunctions,
	filter?: string,
	paginationToken?: string,
): Promise<INodeListSearchResult> {
	return await search.call(this, '/customers', filter, paginationToken, (customer) =>
		customer.name ? `${customer.name} (${customer.email})` : (customer.email as string),
	);
}

export async function searchProducts(
	this: ILoadOptionsFunctions,
	filter?: string,
	paginationToken?: string,
): Promise<INodeListSearchResult> {
	return await search.call(this, '/products', filter, paginationToken, (product) =>
		product.status === 'active' ? (product.name as string) : `${product.name} (${product.status})`,
	);
}

export function locator(
	displayName: string,
	name: string,
	resource: string,
	operations: string[],
	searchListMethod: string,
	idPlaceholder: string,
): INodeProperties {
	return {
		displayName,
		name,
		type: 'resourceLocator',
		required: true,
		default: { mode: 'list', value: '' },
		displayOptions: { show: { resource: [resource], operation: operations } },
		modes: [
			{
				displayName: 'From List',
				name: 'list',
				type: 'list',
				typeOptions: { searchListMethod, searchable: true },
			},
			{
				displayName: 'By ID',
				name: 'id',
				type: 'string',
				placeholder: idPlaceholder,
			},
		],
	};
}
