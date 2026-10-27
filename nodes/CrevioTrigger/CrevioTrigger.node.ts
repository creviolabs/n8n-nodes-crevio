import {
	NodeApiError,
	NodeConnectionTypes,
	type IDataObject,
	type IHookFunctions,
	type IHttpRequestMethods,
	type IN8nHttpFullResponse,
	type INodeType,
	type INodeTypeDescription,
	type IWebhookFunctions,
	type IWebhookResponseData,
	type JsonObject,
} from 'n8n-workflow';
import { eventOptions } from './events';
import { isValidSignature } from './signature';

interface WebhookEndpoint {
	id: string;
	url: string;
	status: string;
	enabled_events: string[];
	secret?: string;
}

const NOT_FOUND = 404;

async function crevioRequest(
	this: IHookFunctions,
	method: IHttpRequestMethods,
	path: string,
	{ body, allowNotFound = false }: { body?: IDataObject; allowNotFound?: boolean } = {},
): Promise<IN8nHttpFullResponse> {
	const credentials = await this.getCredentials<{ baseUrl: string }>('crevioApi');
	const response = (await this.helpers.httpRequestWithAuthentication.call(this, 'crevioApi', {
		method,
		url: `${credentials.baseUrl.replace(/\/+$/, '')}${path}`,
		body,
		json: true,
		ignoreHttpStatusErrors: true,
		returnFullResponse: true,
	})) as IN8nHttpFullResponse;

	const notFoundAllowed = allowNotFound && response.statusCode === NOT_FOUND;
	if (response.statusCode >= 400 && !notFoundAllowed) {
		throw new NodeApiError(this.getNode(), response.body as JsonObject, {
			httpCode: String(response.statusCode),
		});
	}
	return response;
}

export class CrevioTrigger implements INodeType {
	description: INodeTypeDescription = {
		displayName: 'Crevio Trigger',
		name: 'crevioTrigger',
		icon: { light: 'file:../../icons/crevio.svg', dark: 'file:../../icons/crevio.dark.svg' },
		group: ['trigger'],
		version: 1,
		subtitle: '={{$parameter["events"].join(", ")}}',
		description: 'Starts the workflow when something happens in your Crevio business',
		defaults: {
			name: 'Crevio Trigger',
		},
		inputs: [],
		outputs: [NodeConnectionTypes.Main],
		credentials: [
			{
				name: 'crevioApi',
				required: true,
			},
		],
		webhooks: [
			{
				name: 'default',
				httpMethod: 'POST',
				responseMode: 'onReceived',
				path: 'webhook',
			},
		],
		properties: [
			{
				displayName: 'Events',
				name: 'events',
				type: 'multiOptions',
				required: true,
				default: [],
				options: eventOptions,
				description: 'The events that start the workflow',
			},
			{
				displayName:
					"Crevio only delivers to public HTTPS addresses. If n8n runs on your own computer, expose it with a tunnel and set n8n's WEBHOOK_URL to the tunnel address.",
				name: 'publicUrlNotice',
				type: 'notice',
				default: '',
			},
		],
	};

	webhookMethods = {
		default: {
			async checkExists(this: IHookFunctions): Promise<boolean> {
				const webhookData = this.getWorkflowStaticData('node');
				if (webhookData.webhookId === undefined) return false;

				const response = await crevioRequest.call(
					this,
					'GET',
					`/webhook_endpoints/${webhookData.webhookId}`,
					{ allowNotFound: true },
				);
				if (response.statusCode === NOT_FOUND) {
					delete webhookData.webhookId;
					delete webhookData.secret;
					return false;
				}

				const endpoint = response.body as WebhookEndpoint;
				const events = (this.getNodeParameter('events') as string[]).slice().sort();
				return (
					endpoint.url === this.getNodeWebhookUrl('default') &&
					endpoint.status === 'active' &&
					endpoint.enabled_events.slice().sort().join(',') === events.join(',')
				);
			},

			async create(this: IHookFunctions): Promise<boolean> {
				const webhookData = this.getWorkflowStaticData('node');
				if (webhookData.webhookId !== undefined) {
					await crevioRequest.call(this, 'DELETE', `/webhook_endpoints/${webhookData.webhookId}`, {
						allowNotFound: true,
					});
				}

				const response = await crevioRequest.call(this, 'POST', '/webhook_endpoints', {
					body: {
						url: this.getNodeWebhookUrl('default'),
						status: 'active',
						enabled_events: this.getNodeParameter('events') as string[],
					},
				});
				const endpoint = response.body as WebhookEndpoint;

				webhookData.webhookId = endpoint.id;
				webhookData.secret = endpoint.secret;
				return true;
			},

			async delete(this: IHookFunctions): Promise<boolean> {
				const webhookData = this.getWorkflowStaticData('node');
				if (webhookData.webhookId === undefined) return true;

				await crevioRequest.call(this, 'DELETE', `/webhook_endpoints/${webhookData.webhookId}`, {
					allowNotFound: true,
				});

				delete webhookData.webhookId;
				delete webhookData.secret;
				return true;
			},
		},
	};

	async webhook(this: IWebhookFunctions): Promise<IWebhookResponseData> {
		const request = this.getRequestObject();
		const secret = this.getWorkflowStaticData('node').secret as string | undefined;
		const rawBody = request.rawBody?.toString() ?? '';

		if (!secret || !isValidSignature(secret, this.getHeaderData() as IDataObject, rawBody)) {
			const response = this.getResponseObject();
			response.status(401).send('Invalid Crevio webhook signature').end();
			return { noWebhookResponse: true };
		}

		return { workflowData: [this.helpers.returnJsonArray(request.body as IDataObject)] };
	}
}
