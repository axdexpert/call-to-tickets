# Guided setup

Follow this when the user says "set up call-to-tickets" (or similar). Walk through one step at a
time. Ask only what you cannot find, and confirm before every outward-facing action (pushing to
git, creating the routine).

Keep a checklist in your replies so the user always sees where they are:

```
1 Company profile   2 Tracker   3 Slack channel   4 Call tool   5 Save   6 Routine   7 Instant trigger   8 Test
```

## 1. Company profile

- `example-acme.md` is a fictional sample: never use it for a real run. Show it to the user if they
  want to see what a finished profile looks like.
- Check `profiles/` for this company. If one exists, show its key fields and ask whether anything changed.
- Otherwise, build one from `profiles/_template.md`: read the company website, product docs and the
  tracker's labels; ask the user for the rest (internal email domains, product areas, a few real asks
  customers made). Show the draft and save it on confirmation.

## 2. Tracker and review queue

- Which tracker: Linear, Jira, GitHub, Notion, Asana? Check the connector works (e.g. list teams or
  projects). Not connected → tell the user to connect it at https://claude.ai/customize/connectors,
  then continue.
- Pick the **review queue**: where unattended tickets land for a human to triage.
  - Linear: a team with Triage enabled (plus an optional project).
  - Jira: a project and a "To review" status, or a label.
  - Notion: a database, plus a "To review" status value.
- Write it into the profile under "Tracker" and "Schedule and notifications".

## 3. Slack channel

- Ask which channel gets the summary after each call (e.g. `#product-signals`). Check it exists with
  the Slack connector. Messages post as the person who set up the routine, so a private channel must
  include them.
- Ask whether an empty run should still post a one-liner (default: yes).
- Write both into the profile.

## 4. Call tool

- Which tool records the calls: Fireflies, Granola, Gong, Zoom, Teams, Google Meet? Check the connector.
  Routines can only use **claude.ai connectors**, not servers configured locally in Claude Code. If the
  tool has no claude.ai connector, say so: the routine cannot read it, and the user would need a relay
  that sends the transcript text in the payload instead (see README, "No connector").
- Write it into the profile under "Transcript source".

## 5. Save

- Show the diff of the profile, then commit and push to the user's repo after they confirm. The
  routine reads the profile from the repo, so an unpushed profile is invisible to it.

## 6. Routine

Create it with the `/schedule` skill (RemoteTrigger), after showing the full configuration:

- **Name:** `call-to-tickets: <company>`
- **Repository:** the user's copy of this repo.
- **Connectors:** the call tool, the tracker and Slack.
- **Prompt:** `routine/prompt.md` with `{{PROFILE}}` and `{{WINDOW_HOURS}}` (default 24) filled in.
- **Daily sweep:** ask for the time **and timezone** (default: the user's local timezone). Convert to
  UTC for the cron, and say it back: "19:00 Europe/Lisbon = 18:00 UTC in winter, so `0 18 * * 1-5`".
  Cron runs in UTC and does not follow daylight saving: mention that the local time shifts by an hour
  at the clock change.
- **Model:** `claude-sonnet-5-5` unless the user prefers another.

End with the routine link: `https://claude.ai/code/routines/<id>`.

## 7. Instant trigger (when a call ends)

The routine needs an API trigger, and the call tool needs a relay that calls it. Both are manual
steps, so guide the user through them. Give them the README section "Instant trigger" verbatim with
the routine id filled in, and wait for them to confirm each part.

## 8. Test

- Start a sweep with "Run now" (RemoteTrigger `run`), then check `list_runs` / `get_run_log` and the
  Slack channel.
- Ask the user to end a short test call with an external attendee (or re-run the relay on an old call)
  and confirm that the summary arrives.
- When something failed, read the run log and fix the cause: a missing connector, the profile not
  pushed, or a wrong channel.
