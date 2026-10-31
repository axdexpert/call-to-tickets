# Ticket tools

The profile names the default tracker and where tickets go (team, project, board, database). If it
does not, ask once, and offer to save the answer in the profile.

**Always preview and get approval before writing.** See SKILL.md step 5.

## Ticket body template (every tracker)

```
> <evidence_quote>

<rationale>

**Customer:** <company> (<domain>)
**Call:** [<title>, <date>](<source_url>)
**Area:** <area> · **Kind:** <feature|pain> · **Asked:** <explicit|implicit> · **Confidence:** <level>
```

The customer's own words go first: a reviewer should see what was said before our paraphrase.

**Adding to an existing ticket** (the same capability from another customer or another call): add a
comment in the same format instead of a new ticket, and attach the customer when the tracker supports it.

**Label `pain` signals differently** (a `pain` label, or a separate project or board when the profile
names one), so they do not mix with buildable requests.

## Duplicate checks (before writing)

1. **Call already filed:** search the tracker for the `source_url`. Every ticket body contains it, so a
   hit means this call ran before. Skip it, or file only the signals that are new.
2. **Same capability already open:** search by canonical title and two or three key terms. A clear match
   → "add to <ticket>". An unclear one → show it in the preview and let the user decide.

## Linear

- **Write:** `save_issue` (team, project, title, description, labels). Map `area` to a team label of the
  same name when one exists.
- **Customer:** `list_customers`, matched by domain. When found, `save_customer_need` on the issue with
  the quote as the body, the call link as the attachment, and priority `1` (important) only for high
  confidence. No match → file the issue anyway and say it is unattributed.
- **Search:** `list_issues` with a query, or a project listing, for both duplicate checks.

## Jira

- **Write:** create an issue (project key, issue type from the profile, default `Story`). Summary =
  title, description = template (Jira wiki or ADF, depending on the connector).
- **Customer:** Jira has no native customer object. Use the profile's choice: a custom field, a
  `customer-<slug>` label, or a component. Default: label.
- **Area:** label or component.
- **Search:** JQL `text ~ "<source_url>"` for call duplicates; `summary ~ "<terms>" AND statusCategory != Done`
  for capability duplicates.
- **Adding:** a comment, plus the customer label on the existing issue.

## GitHub Issues

- `gh issue create --title … --body … --label …` (or the GitHub MCP). Customer and area as labels.
- Search with `gh issue list --search "<source_url> in:body"`.

## Notion

- A database with properties: Title, Area (select), Customer (select or relation), Confidence (select),
  Kind (select), Call (URL), Status. Create pages with `notion-create-pages` under the database named
  in the profile. Quote and rationale go in the page body.
- Search: `notion-query-data-sources` filtered on the Call URL.

## Asana, monday.com, Trello, HubSpot, Intercom, others

- Use the connector when one is authorised. Same mapping: title → name, template → description,
  customer and area → tags or fields.

## No tracker connected: a local file

Write `call-signals-<YYYY-MM-DD>.md` (or `.csv` if asked) in the current directory. It holds one table
row per signal (title, area, customer, confidence, kind, quote, rationale, call link) and the full
ticket bodies below it, ready to paste or import. Jira, Linear and Notion all import CSV with these
columns.
