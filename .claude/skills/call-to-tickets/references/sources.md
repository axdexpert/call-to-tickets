# Transcript sources

Goal: one normalised record per call, whatever the source.

```
call_id      the source's own id
title        meeting title
date         ISO date
source_url   link a human can open (goes into every ticket, and is the duplicate-check key)
attendees    [{name, email}]  (calendar invitees count when the source lists no speakers)
text         "Speaker: line" per turn, in order
kind         transcript | notes
```

## Finding the connector

Check this session's tools first, including deferred MCP tools (load them with ToolSearch, e.g.
`ToolSearch("fireflies")`, `ToolSearch("granola")`). Tool names differ between installs, so match
on the server name. When a source's MCP needs authorising, tell the user where (claude.ai connector
settings, or `/mcp`), then fall back to a pasted transcript or a file.

## Fireflies

- **Find:** `fireflies_search` (by keyword, attendee, date) or `fireflies_get_transcripts` (recent list).
- **Read:** `fireflies_get_transcript` → `sentences[]` with `speaker_name` and `text`; attendees and
  `meeting_attendees` carry the emails.
- **Link:** `https://app.fireflies.ai/view/<id>`.
- **Notes:** `fireflies_get_summary` exists, but always prefer the transcript.

## Granola

- **MCP** (official, Feb 2026): lists and searches notes and returns note content. `get_meeting_transcript`
  is **paid plans only**; the free tier sees only the last 30 days of notes, without transcripts.
- **REST API** (read-only, Feb 2026): notes come with title, `web_url`, calendar event (invitees,
  organizer, times), attendees (name and email), summary and transcript.
- **Link:** the note's `web_url`.
- **No transcript access** → use the note body plus the AI summary as `kind: notes` and cap confidence
  at medium. The user's own typed notes in Granola often hold the sharpest asks, so read them.
- Webhooks may not be generally available; for batch runs, list notes by date instead.

## Gong

- Calls API: `/v2/calls` (list by date), `/v2/calls/transcript` (speaker-id turns), `/v2/calls/extensive`
  (parties with emails, to map speaker ids to names).
- **Link:** the call's `url` field.

## Zoom

- Cloud recordings: `/users/me/recordings` → recording files of type `TRANSCRIPT` (VTT). Participants come
  from `/past_meetings/<uuid>/participants`.
- VTT → strip the timestamps and merge consecutive lines from the same speaker.

## Microsoft Teams

- Graph: `/me/onlineMeetings/<id>/transcripts` → content as VTT. Attendees from the meeting's
  `participants`. Needs the `OnlineMeetingTranscript.Read.All` permission.

## Google Meet

- Transcripts land as Google Docs in the organiser's Drive ("Meeting transcript" / "Notes by Gemini").
  Find them with the Drive connector, read with `read_file_content`. Attendees come from the matching
  Calendar event.

## Otter, tl;dv, Fathom, Avoma, Read.ai, others

- Use the connector if one exists; otherwise ask for an export (TXT, DOCX, VTT, SRT or PDF).

## Pasted text or a file

- Accept anything: a raw paste, `.txt`, `.md`, `.vtt`, `.srt`, `.docx`, `.pdf`.
- No attendee emails → ask the user who the customer is, or infer it from the title and introductions,
  and say which you did.
- No link → `source_url` = the file path, or "pasted on <date>". The duplicate check then falls back to
  title + date.
