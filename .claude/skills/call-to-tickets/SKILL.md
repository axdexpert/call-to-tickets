---
name: call-to-tickets
description: |
  Turn customer-call recordings or notes into tickets. Reads a transcript from any source (Fireflies,
  Granola, Gong, Zoom, Teams, Google Meet, Otter, tl;dv, a pasted transcript or a file), identifies the
  customer, extracts their genuine requests and pains, and files them as tickets in any tracker (Linear,
  Jira, GitHub, Notion, Asana, or a Markdown/CSV file). Works for any company through a profile file.
  Use when the user wants to: turn a call into tickets, pull feature requests or pain points out of a
  meeting, log customer asks from Fireflies/Granola/Gong, review what customers asked for this week,
  or set up the extractor for a new company.
---

# Call to tickets

Pipeline: **profile → source → transcript → customer → signals → preview → tickets.**

Three things are pluggable, each with its own reference file. Read only the ones a run needs.

| Plug | Reference | Picks from |
|---|---|---|
| Company | `profiles/<company>.md` (copy `profiles/_template.md`) | product areas, vocabulary, canonical titles, examples, internal domains |
| Transcript source | `references/sources.md` | whichever transcript connector is available, or pasted text |
| Ticket tool | `references/trackers.md` | whichever tracker connector is available, or a local file |

The extraction rules in `references/extraction-rules.md` are company-neutral. **Always read them.**
The profile then adds the company context they depend on.

**Setting up** (a new company, a schedule, or the instant trigger) → follow `references/setup.md`.

## 1. Pick the profile

- List `profiles/` (ignore `_template.md` and `example-acme.md`). If the user named a company, or the working directory or connectors make it
  obvious, use that profile. If several profiles fit, ask.
- **No profile for this company?** Build one before extracting. Copy `_template.md`, then fill it from
  what you can read (the company website, the product's README or docs, the tracker's labels, a couple
  of past calls) and ask the user only what you could not find. Show it to the user and save it once
  they confirm. Extraction without a profile overproduces: the rules cannot tell a real gap from a
  feature the product already has.

## 2. Get the transcript

Follow `references/sources.md`. Check which connectors this session has (deferred MCP tools count:
load them with ToolSearch). Then:

- The user named a call (title, date, link, attendee) → find that one.
- The user said "this week's calls" or similar → list calls in the window, drop internal-only ones
  (every attendee on an internal domain from the profile), and confirm the list before reading them.
- Nothing connected → ask the user to paste the transcript or give a file path.

Normalise every source to the same shape before going further:

```
call_id, title, date, source_url, attendees: [{name, email}], text ("Speaker: line" per turn), kind: transcript | notes
```

`kind: notes` means only an AI summary was available (e.g. Granola without transcript access). Say so to
the user, and cap confidence at **medium**: a summary is a paraphrase, so the evidence quote is not the
customer's own words.

## 3. Identify the customer

- External attendees = emails whose domain is not in the profile's internal domains.
  Free-mail domains (gmail, outlook, gmx, bluewin, …) identify a person, not a company.
- One external company domain → that is the customer. Several → the one that does most of the talking,
  or ask. None (internal call) → stop, nothing to file.
- Cross-check the call title and how people introduce themselves. When the tracker has a customer
  directory (Linear customers, a Jira field, a Notion database), match the domain against it. No
  match → keep going, and flag the ticket as unattributed rather than dropping it.
- Note the **call type** (discovery/demo with a prospect, onboarding, check-in with an existing
  customer, support). The rules use it to set confidence.

## 4. Extract signals

Apply `references/extraction-rules.md` with the profile loaded. The output is a list of signals:

```
kind            feature | pain   (pain only if the profile enables it)
title           English, imperative, canonical title when the profile has one
area            one of the profile's product areas, or "other"
evidence_quote  verbatim, original language, short
language        language code
explicit        explicit | implicit
confidence      high | medium | low
rationale       one English line: the pain it removes, and the context that grounds it
```

An empty list is a valid result. Say so plainly; do not pad.

## 5. Preview, then file

**Never create tickets before the user approves.** Filing writes to a shared tool other people read.

1. Check for duplicates (see `references/trackers.md`): has this call already been filed (search the
   tracker for the `source_url`)? Is there an open ticket for the same capability (search by canonical
   title and key terms)? An existing match becomes "add this customer and quote to ticket X", not a new
   ticket.
2. Show a compact preview table: customer, call, then one row per signal with
   `new | add to <ticket>`, title, area, confidence, and the quote.
3. Let the user drop, edit or merge rows. Then file through the tracker in `references/trackers.md`,
   using the ticket body template there.
4. Report the links to what was created or updated, plus anything unattributed.

## Unattended mode (scheduled runs)

Use this mode when the prompt says the run is scheduled or unattended, or when nobody is there to
answer. Nobody approves the preview, so the tickets go into a **review queue** that a human triages,
and a summary goes to the profile's notification channel.

1. **Never ask questions.** When something is missing, report it in the summary and stop.
   - No profile, or several profiles fit and the prompt names none → post "call-to-tickets needs a
     profile for <company>" and stop.
   - A connector needed by the profile is unavailable → post which one, and stop.
2. **Window:** the calls in the period the prompt gives (default: the last 24 hours). Overlap between
   runs is harmless, because the call-level duplicate check skips anything already filed.
3. Skip internal calls and the profile's skipped call types. Run steps 2–4 for every remaining call,
   then merge across calls as in Batches.
4. **Drop low-confidence signals.** Without a reviewer in the loop they cost more than they add.
5. **Duplicates:**
   - A clear match for an open ticket → add a comment there (customer, quote, call link) and attach
     the customer.
   - An unclear match → file a new ticket, with `Possible duplicate of <ticket>` as the first line.
6. **File** into the profile's review queue (e.g. Linear Triage, or a Jira "To review" status), never
   straight into a planned backlog.
7. **Notify** the profile's channel with one message:
   ```
   📞 Call signals, <date>: <N> calls read, <M> tickets filed, <K> added to existing
   • <Customer>, <call title>: <Title> (<confidence>) → <link>
   • <Customer>, <call title>: added to <ticket> → <link>
   ⚠️ Unattributed: <domain> (no customer in <tracker>)
   Review in: <review queue link>
   ```
   No signals → one line ("📞 Call signals, <date>: <N> calls read, nothing to file"), so the team
   can tell the run happened. Skip the message only if the profile sets `post when empty: no`.
   A run that failed → post what failed instead of staying silent.

## Batches

For several calls, process each one through steps 2–4 first. Then merge across calls: the same
canonical title from different customers becomes one ticket listing every customer and quote. That is
where the value is, since a recurring ask from five customers ranks above a one-off. Preview the merged
set once.

## Improving the rules

- A wrong call that would recur for any company → fix `references/extraction-rules.md`.
- A wrong call that comes from this company's product or vocabulary → fix the profile: add the line as
  a ✅ or ✗ example, add a canonical title, or pin an ambiguous area.
- Profiles improve most from real misses. When the user corrects a signal, offer to add it to the
  profile's examples.
