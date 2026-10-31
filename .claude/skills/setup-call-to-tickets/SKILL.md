---
name: setup-call-to-tickets
description: Set up call-to-tickets for a company. Builds its profile, connects the call tool, tracker and Slack, schedules the daily sweep, and wires the instant trigger that files tickets minutes after each call.
disable-model-invocation: true
---

Someone wants their customer calls turned into tickets without thinking about it again. By the end of
this, a call ends and a few minutes later its signals sit in the team's **review queue**, with a
summary in Slack. Your job is to get them there in one sitting, asking only what you can't find out
yourself.

The setup has a **destination** and eight **stops**. Show this line at every stop, with the current
one in bold, so the user always knows where they are and how far is left:

```
1 Profile · 2 Tracker · 3 Slack · 4 Call tool · 5 Save · 6 Routine · 7 Instant trigger · 8 Test
```

## Find, then ask

Every question you ask is one the user has to stop and think about. Before asking, look: the company
website, the product's docs, the tracker's teams and labels, the Slack channel list, a couple of past
calls. Ask only for what none of those can tell you, and when you do ask, offer your best guess as the
default.

## Confirm before it leaves the machine

Drafting a profile is free. Pushing it, creating a routine, or deploying a server is not: other
people and other systems see the result. Show what's about to happen, and act on a yes.

**Secrets never pass through the chat.** The routine token and the webhook secret go straight from
where they're made into where they're used. If the user pastes one, tell them to rotate it.

## The stops

### 1. Profile

The **profile** (`profiles/<company>.md`) is what makes extraction precise. If one exists for this
company, show its key fields and ask what changed. Otherwise draft one from `profiles/_template.md`:

- **Find:** what the product does and already does, its product areas (from the tracker's labels),
  the company's email domains.
- **Ask:** two or three real asks customers have made, and how they phrase them. These become the
  first ✅ examples and **canonical titles**, the part that matters most.

`example-acme.md` is fictional. Show it if the user wants to see a finished profile; never build on it.

### 2. Tracker

Which tracker, and does its connector answer (list teams or projects)? Not connected → send the user
to https://claude.ai/customize/connectors, then carry on.

Then pick the **review queue**: where unattended tickets wait for a human. Linear: a team with Triage
on. Jira: a project plus a "To review" status. Notion: a database plus a status value. Never a planned
backlog: nobody approves an unattended run, so the queue is the approval.

### 3. Slack

Which channel gets the summary? Check it exists. Messages post as the person who set up the routine,
so a private channel must include them. Ask whether a run that finds nothing should still post a
one-liner (default yes: silence should never be mistaken for broken).

### 4. Call tool

Which tool records the calls, and does it have a **claude.ai connector**? Routines can only use
claude.ai connectors, not servers configured locally. No connector → the routine can't read the
tool, so the instant trigger must send the transcript text itself (README, "Instant trigger", Part D).

### 5. Save

Show the profile's diff; commit and push on a yes. The routine reads the profile from the repo, so an
unpushed profile doesn't exist as far as it's concerned.

### 6. Routine

Create it through the `/schedule` skill, after showing the full configuration:

- **Name:** `call-to-tickets: <company>`
- **Repository:** the user's copy of this repo. The Claude GitHub app needs access to it.
- **Connectors:** the call tool, the tracker, Slack.
- **Prompt:** `routine/prompt.md`, with `{{PROFILE}}` and `{{WINDOW_HOURS}}` (default 24) filled in.
- **Sweep time:** ask for the time **and the timezone**, defaulting to theirs. Cron runs in UTC and
  ignores daylight saving, so say the conversion back and warn that the local time shifts by an hour
  at the clock change: "19:00 Europe/Lisbon = 19:00 UTC in winter, so `0 19 * * 1-5`."

End the stop with the routine's link: `https://claude.ai/code/routines/<id>`.

### 7. Instant trigger

Optional. Without it, the **sweep** still files every call once a day. With it, tickets arrive
minutes after the call ends. Walk through the README's "Instant trigger" parts one at a time, with the
routine id filled in:

- **A. Token.** The user makes it on the routine page (web only) and keeps it for C.
- **B. Secret.** `openssl rand -hex 16`: 32 characters, the most Fireflies accepts.
- **C. Deploy the receiver.** Ask which host they already use. If its CLI is installed and logged in,
  offer to run the deploy, leaving `ROUTINE_TOKEN` for them to set. Confirm with `/healthz`.
- **D. Point the call tool at it.** Give the exact URL and where to paste it. No webhooks in this
  tool → skip; the sweep has it covered.
- **E. Test.** The signed `curl` from the README, against a real recent call. `202` means it fired.

### 8. Test

Run the routine once ("Run now"), then read its run log and check Slack. When something failed, the
log says why: usually a missing connector, an unpushed profile, or a wrong channel. Fix the cause,
not the symptom, and run it again.

Setup is done when a real call has produced a Slack summary. Tell the user so, and tell them how to
make it sharper: correct a wrong signal in any session, and it lands in the profile.
