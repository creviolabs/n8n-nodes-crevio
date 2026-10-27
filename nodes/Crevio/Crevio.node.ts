import { NodeConnectionTypes, type INodeType, type INodeTypeDescription } from 'n8n-workflow';
import { agentDescription } from './resources/agent';
import { bookingDescription } from './resources/booking';
import { checkoutDescription } from './resources/checkout';
import { customerDescription } from './resources/customer';
import { discountDescription } from './resources/discount';
import { invoiceDescription } from './resources/invoice';
import { orderDescription } from './resources/order';
import { productDescription } from './resources/product';
import { refundDescription } from './resources/refund';
import { subscriptionDescription } from './resources/subscription';
import { searchCustomers, searchProducts } from './shared/locators';

export class Crevio implements INodeType {
	description: INodeTypeDescription = {
		displayName: 'Crevio',
		name: 'crevio',
		icon: { light: 'file:../../icons/crevio.svg', dark: 'file:../../icons/crevio.dark.svg' },
		group: ['transform'],
		version: 1,
		subtitle: '={{$parameter["operation"] + ": " + $parameter["resource"]}}',
		description:
			'Run your Crevio business: customers, products, orders, checkouts, bookings and the Crevio agent',
		defaults: {
			name: 'Crevio',
		},
		usableAsTool: true,
		inputs: [NodeConnectionTypes.Main],
		outputs: [NodeConnectionTypes.Main],
		credentials: [
			{
				name: 'crevioApi',
				required: true,
			},
		],
		requestDefaults: {
			baseURL: '={{$credentials.baseUrl.replace(/\\/+$/, "")}}',
			headers: {
				Accept: 'application/json',
				'Content-Type': 'application/json',
			},
		},
		properties: [
			{
				displayName: 'Resource',
				name: 'resource',
				type: 'options',
				noDataExpression: true,
				options: [
					{ name: 'Agent', value: 'agent' },
					{ name: 'Booking', value: 'booking' },
					{ name: 'Checkout', value: 'checkout' },
					{ name: 'Customer', value: 'customer' },
					{ name: 'Discount', value: 'discount' },
					{ name: 'Invoice', value: 'invoice' },
					{ name: 'Order', value: 'order' },
					{ name: 'Product', value: 'product' },
					{ name: 'Refund', value: 'refund' },
					{ name: 'Subscription', value: 'subscription' },
				],
				default: 'customer',
			},
			...agentDescription,
			...bookingDescription,
			...checkoutDescription,
			...customerDescription,
			...discountDescription,
			...invoiceDescription,
			...orderDescription,
			...productDescription,
			...refundDescription,
			...subscriptionDescription,
		],
	};

	methods = {
		listSearch: {
			searchCustomers,
			searchProducts,
		},
	};
}
