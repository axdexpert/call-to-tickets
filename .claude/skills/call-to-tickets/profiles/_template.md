# Profile: <Company>

Copy this file to `profiles/<company-slug>.md` and fill it in. Every section makes extraction more
precise; "What the product does" and "Product areas" are the minimum.

## Company

- **Name:** <Company>
- **Internal email domains:** <company.com>, <company.io>
  (attendees on these domains are us; a call with nobody else is internal and skipped)

## What the product does

<Two or three sentences: who uses it, for what job, what it replaces. The extractor uses this to tell a
missing capability from one that already exists.>

**Already exists**: features customers often ask about that are already built (asking about these is
validation, not a signal):
- <feature>

## Product areas

The `area` values. Keep it to 5–10, plus `other`.

- `<area-slug>`: <what belongs here>
- `other`

**Pinning rules** for ambiguous cases:
- <input/situation> → `<area-slug>`

## Languages

- **Spoken on calls:** <en, de, …>
- **Dialect cues and known transcription garbles** (garble → meaning):
  - <garble> → <correct term>

## Vocabulary

| Concept | <language 1> | <language 2> | English |
|---|---|---|---|
| | | | |

## Canonical titles

Recurring needs always get the same title, so asks from different customers group together.
- <variants / synonyms> → **"<Canonical title>"**

## Examples

Real lines from past calls teach the boundary best. Add every correction here.

### ✅ Signals
- **<Title>**: *"<verbatim quote>"* (<customer>, <lang>). <why it qualifies>

### ✗ Not signals
- *"<verbatim quote>"*: <bug | churn | infra | validation>. <why>

## Signal kinds

- **feature:** on
- **pain:** off   (turn on to also capture concrete recurring problems with no specific ask)
- **Treat as product areas, not infra:** <e.g. SSO, if the company sells security features>

## Tracker

- **Tool:** <Linear | Jira | GitHub | Notion | Asana | file>
- **Where:** <Linear team + project | Jira project key + issue type | repo | Notion database URL>
- **Customer attribution:** <Linear customers | Jira label `customer-<slug>` | field name>
- **Pain signals go to:** <same place with a `pain` label | other project>

## Schedule and notifications

Used by scheduled (unattended) runs.

- **Review queue:** <Linear team Triage | Jira project + status "To review" | Notion view>
- **Notify:** <Slack #channel | Slack DM to @person | email address>
- **Post when empty:** yes
- **Window:** last 24 hours

## Transcript source

- **Default:** <Fireflies | Granola | Gong | Zoom | Teams | Meet | paste>
- **Call types to skip:** <e.g. titles containing "Interview", "Standup">
