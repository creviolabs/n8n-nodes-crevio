# n8n-nodes-crevio

This is an n8n community node. It lets you use [Crevio](https://crevio.co) in your n8n workflows.

Crevio runs a small business with an AI agent: products, checkout and payments, customers, bookings, invoices and marketing. This package gives n8n two nodes:

- **Crevio**: work with customers, products, orders, checkouts, subscriptions, refunds, bookings, discount codes and invoices, and hand jobs to the Crevio agent in plain language. It can also be used as a tool by n8n's AI Agent.
- **Crevio Trigger**: start a workflow when something happens in Crevio, such as a paid order, a new lead or a cancelled booking.

[n8n](https://n8n.io/) is a [fair-code licensed](https://docs.n8n.io/sustainable-use-license/) workflow automation platform.

[Installation](#installation)
[Operations](#operations)
[Credentials](#credentials)
[Compatibility](#compatibility)
[Usage](#usage)
[Example workflows](#example-workflows)
[Resources](#resources)
[Version history](#version-history)

## Installation

Follow the [installation guide](https://docs.n8n.io/integrations/community-nodes/installation/) in the n8n community nodes documentation. The package name is `n8n-nodes-crevio`.

## Operations

### Crevio

| Resource | Operations |
|---|---|
| Agent | Send Message, Send Follow-Up Message, Get Run |
| Booking | Create, Cancel, Get, Get Many, Get Available Slots |
| Checkout | Create, Get |
| Customer | Create, Update, Delete, Get, Get Many, Add Tag, Remove Tag |
| Discount | Create, Delete, Get, Get Many |
| Invoice | Create, Get, Get Many, Void |
| Order | Get, Get Many |
| Product | Create, Update, Delete, Get, Get Many |
| Refund | Create, Get, Get Many |
| Subscription | Cancel, Pause, Resume, Get, Get Many |

Get and Get Many operations return the ten most useful fields by default. Turn off **Simplify** to get the full object.

**Agent** hands a job to the Crevio agent, which works your account the way it does in a Crevio chat: "Email everyone who bought the watercolor course this week a thank-you note", "Which products sold best last month?". The reply is in `result`. Add a **Response Schema** to get the reply as JSON in `json`. If the agent is still working after **Wait for Reply**, the run comes back with status `pending` or `running`; read it later with **Get Run**. The agent spends Crevio credits, as it does in the app.

### Crevio Trigger

Starts a workflow on any of Crevio's webhook events, including:

- Commerce: `order.created`, `order.paid`, `order.disputed`, `checkout.created`, `refund.created`, `subscription.created`, `subscription.renewed`, `subscription.canceled`, `subscription.ended`, `invoice.paid`
- Leads and customers: `lead.created`, `form_submission.created`, `customer.tag_added`, `customer.tag_removed`
- Bookings: `booking.created`, `booking.cancelled`, `booking.rescheduled`
- The agent and email: `task_run.completed`, `task_run.needs_input`, `email_message.received`, `call.ended`

The full list and each event's payload are in the [Crevio webhooks guide](https://crevio.co/docs/developer/guides/webhooks). When you activate the workflow, the trigger registers a webhook in your Crevio account, and it removes it when you deactivate the workflow. Every delivery is checked against its signature; requests that are not signed by Crevio are rejected.

## Credentials

You need a Crevio API key. API keys are available on Crevio's **Business** plan.

1. In Crevio, open **Settings → Developer**.
2. Under **API Keys**, click **Create key** and give it a name, such as `n8n`.
3. Under **What it can do**, pick **Read data** and **Create, change and delete data**. For the **Agent** resource, also pick **Give the agent work**. **Full access** covers all of these.
4. Copy the key. Crevio shows it only once.
5. In n8n, create a **Crevio API** credential and paste the key into **API Token**. Leave **API URL** as it is.

n8n checks the token by calling Crevio's status endpoint when you save the credential.

## Compatibility

Built with `@n8n/node-cli` 0.54 and tested on self-hosted n8n 2.45.4.

The Crevio Trigger needs n8n to be reachable from the internet over HTTPS, because Crevio only delivers webhooks to public HTTPS addresses. If n8n runs on your own computer, expose it with a tunnel (for example ngrok or Cloudflare Tunnel) and set n8n's `WEBHOOK_URL` environment variable to the tunnel address.

## Usage

- **IDs**: Crevio IDs carry a prefix, such as `cus_` for customers, `prod_` for products, `ord_` for orders and `price_` for prices. Products can also be found by their slug.
- **Money**: amounts are integers in the smallest currency unit, so `4900` is $49.00. Currency codes are lowercase, such as `usd`.
- **Selling a product**: create the product (it starts as a draft), add a price in Crevio, then update the product's status to **Active**. A product can't be active without a price.
- **Payment links**: **Checkout → Create** returns `purchase_url`, a payment page you can send to a buyer. Prices come from a product's `price_variants`.
- **Metadata**: customers, products and checkouts accept your own key-value pairs, such as the record ID in your CRM. Metadata on a checkout is copied to the order and comes back on `order.paid`.
- **Paid orders and renewals**: `order.paid` also fires for every subscription renewal. Check `billing_reason`: `subscription_cycle` is a renewal, anything else is a new purchase.
- **Test events**: an event with `livemode: false` came from a test purchase or a test delivery. Filter on it before acting on the outside world.

## Example workflows

**Welcome new buyers in your CRM**

1. Crevio Trigger on `order.paid`.
2. IF `{{ $json.data.object.billing_reason }}` is not `subscription_cycle`.
3. Your CRM node creates or updates a contact from `{{ $json.data.object.customer.email }}`.
4. Crevio → Customer → Add Tag, with **Customer** set to `{{ $('Crevio Trigger').item.json.data.object.customer.id }}` and the tag ID of your "Onboarded" tag.

**Send a payment link from a form**

1. Any form trigger (Typeform, Tally, n8n Form) collects an email address.
2. Crevio → Checkout → Create with one line item (your price ID) and **Email** set from the form.
3. An email node sends `{{ $json.purchase_url }}` to the buyer.

**Let an AI agent run the store**

1. Chat Trigger → AI Agent.
2. Add **Crevio** as a tool of the AI Agent (operations such as Customer → Get Many, Order → Get Many and Discount → Create). The agent fills in the parameters itself.
3. Ask "Create a 20% code SPRING20 for returning customers and tell me how many orders came in this week".

**Weekly report from the Crevio agent**

1. Schedule Trigger every Monday.
2. Crevio → Agent → Send Message: "Summarise last week's sales, new customers and refunds", with a **Response Schema** of `{ "type": "object", "properties": { "summary": { "type": "string" }, "revenue_cents": { "type": "integer" } } }`.
3. A Slack node posts `{{ $json.json.summary }}`.

## Resources

- [n8n community nodes documentation](https://docs.n8n.io/integrations/#community-nodes)
- [Crevio API documentation](https://crevio.co/docs/developer)
- [Crevio webhooks guide](https://crevio.co/docs/developer/guides/webhooks)
- [Crevio API conventions](https://crevio.co/docs/developer/guides/conventions)

## Version history

### 0.1.0

First release: the Crevio node (10 resources, usable as an AI Agent tool) and the Crevio Trigger.
