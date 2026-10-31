# Extraction rules (company-neutral)

Read one customer-call transcript and output **only genuine signals**. These rules need a company
profile alongside them: what the product does, its areas, its vocabulary, and its examples. Without
it, you cannot tell a missing capability from one that already exists.

Two failure modes, most important first:

1. **Over-extraction.** Pulling out bugs, complaints and chatter as if they were requests.
2. **Missing the hard passages.** Skipping dialect, code-switched or badly transcribed passages, or
   only spotting a signal when it is phrased cleanly.

A handful of real, correctly identified signals beats a long noisy list.

## Signal kinds

- **feature** (always on): the customer needs the product to do something it cannot do today, or does
  badly.
- **pain** (only when the profile sets `pain: on`): a recurring problem in the customer's work that the
  product does not touch yet and that they describe concretely, with no specific capability asked for.
  Example: "every Monday two people spend the morning re-typing supplier prices". It is useful for
  discovery, but it is not a buildable request, so it is filed separately (see trackers.md).

Bugs are **never** extracted by this skill. Something meant to work that is broken belongs in the
support or bug process, not the request backlog.

## Languages

A signal is a **concept, not a phrase**: *"the product should be able to do X, and today it can't (or
does it badly)."* Reason about the meaning, then apply the same test in every language. Do not rely on
keywords.

- Read every language the call uses, including code-switching mid-sentence.
- Dialects and accents usually come out of the transcriber as garbled text in the nearest standard
  language. **Read through the mess and judge by meaning. Never skip a passage as noise because it is
  hard to read.** The profile lists dialect cues and known transcription garbles.
- Write `title` and `rationale` in **English**, so the backlog has one language. Keep `evidence_quote`
  verbatim in the source language. Set `language` to its code (e.g. `en`, `de`, `de-CH`, `fr`).

## Context recognition: decide from the surrounding talk, not the sentence

A signal is rarely one quotable sentence. The words that pin it down are spread across the turns
around it, and the same sentence can be a signal, a bug or noise depending on what is being
discussed. **Reconstruct intent from the context before you classify.**

1. **What is happening in this stretch of the call?** A real-workflow walkthrough, a demo, a pricing
   negotiation, small talk? A capability wish while the customer narrates their day-to-day is a
   signal. The same words inside a pricing block are noise.
2. **Whose need is it?** Attribute it to the **customer**, even when the vendor's rep says the words.
   Reps restate asks ("so what you need is …") and confirm gaps ("that isn't built yet", "that's on the
   roadmap for next year"). Those restatements and confirmations are the strongest evidence that a real
   gap exists.
3. **What shape does the need take?** A **wall** they hit, a **manual workaround** ("we do that by hand
   / in Excel / in the old tool"), a **wish or probe** ("it would be nice if …", "can it …?"), or a
   **comparison** with a tool that already does it. Any of these plus a missing or poor capability is a
   signal.
4. **Which look-alike is it?** Something that *broke or used to work* is a **bug**. Something the rep
   just demoed is **validation**. Frustration with no capability attached is **churn**. Price, ROI,
   hosting, contract are **commercial or infra**. All of these are dropped.
5. **Is it grounded?** A real signal sits on a concrete, recurring pain in *their* work: a document
   they actually receive, a step they actually redo. An ungrounded "it would be cool if" is low
   confidence and usually dropped.

`evidence_quote` is the single line that best anchors the signal, but the decision to keep it comes
from the context. Name that grounding (the workaround, the rep's "not yet", the workflow) in the
`rationale`.

## Decision procedure (every candidate, any language)

1. **Drop noise**: meeting setup, small talk, scheduling, pricing, praise.
2. **Is the customer describing a capability the product lacks or does poorly, that they want?** No
   desired capability → not a feature. (If `pain` is on and they describe a concrete recurring problem
   instead, consider it as a pain.)
3. **Missing, or broken?** A new capability → keep. Something meant to work that is broken → bug → drop.
   Check the profile: if the product already does it, it is validation or a "how do I" question, not a
   signal.
4. **Grounded in a real need**, or idle musing? Real need → keep.
5. **Set confidence honestly.** When unsure whether it is genuine, lean towards dropping it.

## What a signal IS

The customer expresses that the product **should be able to do something it currently can't**, or
does poorly. Both forms count:

- **Explicit**: a direct ask ("could you also let us …?").
- **Implicit**: a limitation, gap or workaround that only exists because a capability is missing ("we
  can only upload one file per project" → they need multi-file upload). Implicit signals are the most
  often missed. Hunt for them, especially in hard-to-read passages.

## What is NOT a signal: exclude

- **Bug reports.** Existing behaviour that is broken, inconsistent or errors out.
- **Churn or frustration** with no implied capability ("we lost trust", "we've barely used it").
- **Praise, logistics, pricing, contracts**, and one-off **"how do I do X?"** where X already exists.
- **Infrastructure, procurement and security asks**: on-premise or self-hosted, data residency, hosting,
  GDPR/DPA, SSO, licensing. These are procurement decisions, not product capabilities, unless the
  profile explicitly lists them as product areas.
- **"Does it do X?" on a demo, where X already works.** That is validation. Keep it only when X is a
  genuine missing capability grounded in their workflow.

### Feature vs bug: the distinction that matters most

- A **limitation by design** the customer wants lifted → feature ✅
  "You can only upload one file per project" → one file by design, they want more.
- A **malfunction** of something meant to work → bug ✗
  "Uploading the file failed with an error" → upload is meant to work and didn't.

New → keep. Broken → drop.

## How to read the call

- **Call type sets the register.** Check-ins and usage calls with existing customers surface concrete
  gaps hit in real use: usually high or medium confidence. Discovery, demo and sales calls with
  prospects surface forward-looking asks: a "can you do X?" probe is a signal only when X is genuinely
  missing and grounded in their workflow. A purely commercial call → empty list.
- **Speaker labels are unreliable.** Transcribers merge and mislabel speakers. Judge by content.
- **Expect 40–60% noise**: setup, small talk, scheduling.
- **Normalise known garbles** from the profile in `title` and `rationale`. Keep the quote verbatim.
- **Notes instead of a transcript** (an AI summary): the "quote" is a paraphrase. Mark it as such
  (prefix `[summary]`) and cap confidence at medium.

## Output: one entry per signal

- **kind**: `feature`, or `pain` if enabled.
- **title**: English, imperative, names the capability ("Allow multiple files per project"). **Use the
  profile's canonical title for recurring needs**, so the same ask from different customers groups
  together. Do not paraphrase per call.
- **area**: one of the profile's product areas, following its pinning rules for ambiguous cases;
  otherwise `other`.
- **evidence_quote**: verbatim, original language, short.
- **language**: language code.
- **explicit**: `explicit` (direct ask) or `implicit` (implied by a limitation or workaround).
- **confidence**: calibrate it; do not default to medium.
  - **high**: an explicit ask, or a limitation they clearly hit in real use, and the capability is
    concrete and buildable.
  - **medium**: implied by a workaround, or a genuine gap probed on a discovery or demo call.
  - **low**: idle musing or roadmap-adjacent. At this level, prefer dropping it.
- **rationale**: one English line: the pain it removes, and the context that grounds it.

**One signal per distinct capability.** If several asks are facets of one capability (split the work,
assign it, sign it off = one collaborative workflow), return one well-scoped signal, unless each piece
is independently buildable and valuable.

Be conservative. **Prefer 3 real signals over 15 noisy ones.** A call with no genuine signals → an
empty list. **Do not invent.**
