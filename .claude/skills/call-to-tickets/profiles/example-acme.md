# Profile: Acme (example)

A fictional company, to show what a filled-in profile looks like. Setup creates yours from
`_template.md`; you can delete this file.

## Company

- **Name:** Acme Invoicing
- **Internal email domains:** acme.io

## What the product does

Acme lets small accounting firms send invoices for their clients and chase late payments. It replaces
spreadsheets and manual reminder emails.

**Already exists:**
- Recurring invoices
- Automatic payment reminders
- CSV export of invoices

## Product areas

- `invoicing`: creating, editing and sending invoices.
- `payments`: payment links, reconciliation, reminders.
- `integrations`: accounting software, banks, CRM.
- `reporting`: dashboards and exports.
- `other`

**Pinning rules:**
- anything that syncs with another tool → `integrations`
- exports that someone opens in Excel → `reporting`

## Languages

- **Spoken on calls:** `en`, `fr`
- **Known garbles:** `zero → Xero`, `quick books → QuickBooks`

## Canonical titles

- sync with Xero / QuickBooks / Sage / "our accounting tool" → **"Sync invoices to accounting software"**
- reminders in the client's language / custom wording → **"Customise reminder emails"**

## Examples

### ✅ Signals
- **Sync invoices to accounting software**: *"every Friday someone re-types all the paid invoices into
  Xero"* (Dupont & Co, en). An implicit ask: a manual workaround for a missing integration.

### ✗ Not signals
- *"the reminder went out twice yesterday"*: bug.
- *"can it send reminders automatically?"*: validation, since it already does.

## Signal kinds

- **feature:** on
- **pain:** off

## Tracker

- **Tool:** Linear
- **Where:** team "Product"
- **Customer attribution:** Linear customers, matched by email domain

## Schedule and notifications

- **Review queue:** Linear team "Product", Triage
- **Notify:** Slack #product-signals
- **Post when empty:** yes
- **Window:** last 24 hours

## Transcript source

- **Default:** Fireflies
- **Call types to skip:** titles containing "Interview" or "Standup"
