# call-to-tickets

Every customer call becomes tickets, automatically.

When a call ends, Claude reads the transcript, works out which customer it was, picks out what they
asked for, and files it in your tracker for review. Then it posts a summary in Slack.

```
 call ends ──▶ Claude reads transcript ──▶ finds customer + requests ──▶ tickets in review queue ──▶ Slack summary
 (Fireflies,    (any call tool)              (only real asks: no bugs,     (Linear, Jira,              (#your-channel)
  Granola, …)                                 no small talk)                Notion, GitHub)
```

Works for any company, any call tool and any tracker. Your company's details live in one profile file.

---

## Why

As a product engineer, the most useful thing I can know before building something is **who asked for
it, in their own words**. That information exists. It's said out loud on customer calls every week,
and it gets recorded. Then it sits in a recording nobody opens again.

What reaches the backlog instead is a summary of a summary: "Acme is interested in exports". By the
time it's a ticket, three things are missing:

- **The evidence.** *"Every Friday someone re-types the paid invoices into Xero"* tells you what to
  build. "Interested in exports" doesn't. The exact words carry the workflow, the pain and the edge
  cases, and they're the first thing a paraphrase drops.
- **The count.** Five customers asking for the same thing look like five unrelated notes in five
  call recaps. Nobody adds them up, so recurring demand looks like noise, and the loudest recent
  call wins the roadmap.
- **The way back.** A ticket without a link to the call can't be checked. When the spec gets
  argued over, nobody can go back and listen to what the customer actually said.

Writing these up by hand works for a week. Then calls stack up, the person taking notes changes, and
the habit dies. The fix has to cost nothing per call, or it won't survive.

### What this does about it

- **The quote comes first.** Every ticket opens with the customer's verbatim words, then a one-line
  reading of why it matters, then the link to the call. You can always go back to the source.
- **The same ask becomes one ticket.** Recurring needs get one canonical title, so the fifth customer
  asking for an accounting sync adds their quote to the existing ticket instead of opening a new one.
  Demand you can count is demand you can prioritise.
- **It stays out of the backlog's way.** Bugs, complaints, pricing and small talk are filtered out:
  bugs have their own process, and a request backlog full of noise stops being read. It would rather
  file three real signals than fifteen guesses. A call with no real ask files nothing.
- **People stay in charge.** Tickets land in a review queue, not the roadmap. The agent does the
  listening and the paperwork; a human decides what's worth building.
- **Your tools stay yours.** Call tools and trackers change every couple of years. The loop (call,
  customer, signal, ticket) doesn't, so the tools are plug-ins and your product knowledge lives in a
  profile you own.

The result is a backlog where every request has a customer, a quote and a source, and the most
requested things rise to the top on their own.

---

## What you need

- [ ] **Claude Code**: the terminal app, desktop app or VS Code extension, signed in to claude.ai
- [ ] **Your call tool and tracker connected on claude.ai**: open
      [claude.ai/customize/connectors](https://claude.ai/customize/connectors) and connect:
  - your call tool: Fireflies, Granola, Gong, Zoom, …
  - your tracker: Linear, Jira, Notion, …
  - Slack
- [ ] **A GitHub account**: the automation reads its settings from your copy of this repo. The
      Claude GitHub app needs access to that copy (claude.ai asks the first time a routine uses it)
- [ ] **For instant runs (optional):** somewhere to run a tiny server: Google Cloud Run, Fly.io,
      Render, Railway or any Docker host. Without it, calls are filed once a day by the daily sweep

---

## Install (2 minutes)

**1. Make your own private copy of this repo.**
On GitHub, click **Use this template → Create a new repository**, and choose **Private**.
(Your copy will hold your company profile, which quotes real customers.)

**2. Download it and open Claude Code inside it.**

```bash
git clone https://github.com/<you>/call-to-tickets.git
cd call-to-tickets
claude
```

**3. Type:**

```
/setup-call-to-tickets
```

That's it. Claude walks you through the rest and checks each step as you go.

> **Optional: use it in every project.** Link both skills into your personal skills folder:
> ```bash
> ln -s "$PWD/.claude/skills/call-to-tickets" ~/.claude/skills/call-to-tickets
> ln -s "$PWD/.claude/skills/setup-call-to-tickets" ~/.claude/skills/setup-call-to-tickets
> ```

---

## What setup asks you

Claude asks only what it can't find out itself. Have these answers ready:

| Step | Claude asks | Example answer |
|---|---|---|
| 1. Company profile | Your company website, your email domains, what customers usually ask for | `acme.com`, "they ask about exports and integrations" |
| 2. Tracker | Which tracker, and where new tickets should wait for review | Linear, team *Product*, Triage |
| 3. Slack | Which channel gets the summary | `#product-signals` |
| 4. Call tool | Where your calls are recorded | Fireflies |
| 5. Save | OK to push your profile to your repo | yes |
| 6. Schedule | What time the daily safety sweep runs, and in which timezone | 19:00, Europe/Lisbon |
| 7. Instant trigger | A token, a secret and a one-command deploy, below | Cloud Run |
| 8. Test | Run it once and check Slack | |

---

## Instant trigger: tickets a few minutes after each call

```
 call ends ──▶ call tool sends a webhook ──▶ receiver (your server) ──▶ routine runs ──▶ tickets + Slack
                                             checks the signature
                                             ─── daily sweep catches anything missed ───
```

The **receiver** is a tiny server in `receiver/` (no dependencies, one container). Your call tool
tells it when a transcript is ready; it checks the request really came from your tool, then starts the
routine. About 15 minutes, done once.

### Part A: Give the routine a trigger

1. Open your routine: `https://claude.ai/code/routines/<routine-id>`
2. Click **Edit → Add API trigger → Generate token**.
3. **Copy the token now.** It is shown only once. (If you lose it, generate a new one.)

### Part B: Make a webhook secret

```bash
openssl rand -hex 16
```

Copy the result (32 characters; Fireflies accepts 16 to 32). The receiver and your call tool both get
this value; it proves a request came from your tool.

### Part C: Deploy the receiver

Pick whichever host you already use. Each one needs the same three settings:

| Setting | Value |
|---|---|
| `ROUTINE_ID` | the id from Part A (the last part of the routine URL) |
| `ROUTINE_TOKEN` | the token from Part A |
| `FIREFLIES_WEBHOOK_SECRET` | the secret from Part B (use `GENERIC_WEBHOOK_SECRET` for other tools, see Part D) |

**Google Cloud Run**

```bash
gcloud run deploy call-to-tickets-receiver --source receiver --region europe-west1 \
  --allow-unauthenticated \
  --set-env-vars ROUTINE_ID=<id>,ROUTINE_TOKEN=<token>,FIREFLIES_WEBHOOK_SECRET=<secret>
```

`--allow-unauthenticated` is needed because your call tool calls it from outside; the receiver checks
the signature on every request itself.

**Fly.io**

```bash
cd receiver
fly launch --no-deploy
fly secrets set ROUTINE_ID=<id> ROUTINE_TOKEN=<token> FIREFLIES_WEBHOOK_SECRET=<secret>
fly deploy
```

**Render or Railway**: new web service from your repo, root directory `receiver`, add the three
settings as environment variables.

**Any server with Docker**

```bash
cp receiver/.env.example receiver/.env    # fill in the three settings
docker build -t call-to-tickets-receiver receiver
docker run -d -p 8080:8080 --env-file receiver/.env call-to-tickets-receiver
```

**Check it:** open `https://<your-receiver>/healthz`. You should see `{"ok":true}`.

### Part D: Point your call tool at the receiver

**Fireflies**: **Settings → Developer settings → Webhooks**:
- Webhook URL: `https://<your-receiver>/webhook/fireflies`
- Secret: the value from Part B

**Any other tool** (Granola, Gong, Zoom, an internal script, …): send a POST to
`https://<your-receiver>/webhook/generic` with this JSON body:

```json
{ "source": "granola", "id": "<call id>", "url": "<link to the call>", "title": "<meeting title>" }
```

and a header `x-signature` holding the HMAC-SHA256 of the body (hex), keyed with
`GENERIC_WEBHOOK_SECRET`. If the routine cannot read the tool through a connector, send the text
itself as `"transcript": "<full text>"` instead of the id.

**Tool has no webhooks?** Skip this part. The daily sweep still files its calls, once a day.

### Part E: Test it

```bash
BODY='{"meetingId":"<a real meeting id>","eventType":"Transcription completed"}'
SIG=$(printf %s "$BODY" | openssl dgst -sha256 -hmac "<secret>" | sed 's/^.* //')
curl -X POST https://<your-receiver>/webhook/fireflies -H "x-hub-signature: $SIG" -d "$BODY"
```

A `202` with a `session` link means the routine started. Open the link to watch it, then check Slack.

> **No server at all?** No-code tools (Zapier, Make, n8n) can call the routine directly: trigger on
> "transcript ready", then POST to `https://api.anthropic.com/v1/claude_code/routines/<routine-id>/fire`
> with headers `Authorization: Bearer <token>`, `anthropic-version: 2023-06-01` and the body
> `{"text": "source=<tool> id=<call id> url=<link>"}`.

---

## Everyday use

The automation runs by itself. You can also ask Claude directly, in any session:

- `turn yesterday's call with Acme into tickets`
- `what did customers ask for this week?`
- `file the asks from this transcript in Jira` (and paste the transcript)

When you ask in a session, Claude shows a preview and creates nothing until you say yes.
Automatic runs file straight into the **review queue**, where your team accepts, merges or declines.

**Making it smarter:** when Claude gets one wrong, tell it: *"that's a bug, not a request"*, or
*"this should be called 'Export to SAP'"*. It offers to add the example to your profile, so the next
run gets it right.

---

## What gets filed

**Filed:** real requests, explicit (*"could you add X?"*) or implicit (*"we do that by hand in Excel"*),
each with the customer's own words, the customer name and a link to the call.

**Not filed:** bugs, complaints, small talk, pricing, internal calls, and anything already filed.
The same request from five customers becomes **one** ticket that lists all five.

---

## Change settings later

Everything lives in `.claude/skills/call-to-tickets/profiles/<company>.md`. Edit it yourself, or ask
Claude (*"post to #sales-signals instead"*), then push. The next run picks it up.

| To change | Where |
|---|---|
| Slack channel, review queue | profile → *Schedule and notifications* |
| Product areas, ticket titles, examples | profile |
| Sweep time, connectors | [claude.ai/code/routines](https://claude.ai/code/routines) → your routine → Edit |
| Turn it off | same page → toggle the routine off, and remove the webhook in your call tool |

---

## Troubleshooting

| Symptom | Fix |
|---|---|
| Nothing in Slack after a call | Check the receiver's logs: did the webhook arrive? Then open the routine's runs on claude.ai and read the log. |
| Run fails before it starts: "repository access" | Give the Claude GitHub app access to your copy: GitHub → Settings → Applications → Claude → Repository access. |
| Slack says "needs a profile" | The profile isn't pushed to GitHub yet. Push it. |
| Slack says a connector is missing | Connect it at claude.ai/customize/connectors, then add it to the routine (Edit → Connectors). |
| Tickets have no customer | The customer's email domain isn't in your tracker's customer list. Add it there. |
| Receiver answers 401 | The secret in your call tool and in the receiver differ. Set the same value in both. |
| Receiver answers 502 | It could not start the routine. Its log says why: usually a wrong or regenerated `ROUTINE_TOKEN`, or the 30-runs-per-hour limit. The daily sweep files those calls anyway. |
| `/healthz` doesn't load | The receiver isn't running, or the host blocks public traffic (Cloud Run: deploy with `--allow-unauthenticated`). |
| Too many weak tickets | Tell Claude which ones were wrong; it adds them to the profile as "not a signal" examples. |

---

## How it's built

```
.claude/skills/
  call-to-tickets/
    SKILL.md                  call → customer → signals → tickets, attended or unattended
    references/
      extraction-rules.md     what counts as a signal (the same for every company)
      sources.md              how to read each call tool
      trackers.md             how to file in each tracker
    profiles/
      _template.md            blank profile for a new company
      example-acme.md         a filled-in example (fictional)
      <company>.md            your company, created by setup
  setup-call-to-tickets/
    SKILL.md                  the guided setup, run with /setup-call-to-tickets
routine/prompt.md             what the cloud routine runs, after each call and in the daily sweep
receiver/                     the webhook receiver for instant runs (Node, no dependencies, Dockerfile)
```
