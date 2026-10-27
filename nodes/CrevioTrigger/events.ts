import type { INodePropertyOptions } from 'n8n-workflow';

const EVENT_TYPES = [
	'booking.cancelled',
	'booking.created',
	'booking.rescheduled',
	'broadcast.canceled',
	'broadcast.failed',
	'broadcast.sent',
	'call.ended',
	'call.started',
	'checkout.created',
	'customer.confirmed',
	'customer.tag_added',
	'customer.tag_removed',
	'deployment.failed',
	'deployment.succeeded',
	'email_message.bounced',
	'email_message.complained',
	'email_message.delivered',
	'email_message.failed',
	'email_message.received',
	'email_message.sent',
	'form_submission.confirmed',
	'form_submission.created',
	'invoice.created',
	'invoice.paid',
	'invoice.past_due',
	'invoice.voided',
	'job.completed',
	'job.failed',
	'lead.created',
	'order.created',
	'order.dispute_closed',
	'order.disputed',
	'order.paid',
	'product.created',
	'product.updated',
	'refund.created',
	'refund.updated',
	'subscription.canceled',
	'subscription.created',
	'subscription.ended',
	'subscription.past_due',
	'subscription.paused',
	'subscription.renewed',
	'subscription.resumed',
	'task.created',
	'task_run.cancelled',
	'task_run.completed',
	'task_run.failed',
	'task_run.needs_input',
	'waitlist_entry.approved',
	'waitlist_entry.created',
	'waitlist_entry.denied',
	'x.mention.received',
];

function label(eventType: string): string {
	const [resource, action] = eventType.split('.');
	const words = `${resource} ${action}`.replace(/_/g, ' ');
	return words.charAt(0).toUpperCase() + words.slice(1);
}

export const eventOptions: INodePropertyOptions[] = EVENT_TYPES.map((value) => ({
	name: label(value),
	value,
	description: `Crevio's '${value}' event`,
}));
