---
name: debug-error
description: Systematically diagnoses and fixes errors, test failures, and unexpected behavior — reproduce, isolate the root cause, fix it, prove the fix with a regression test. Use when an error or bug report arrives and the cause isn't already obvious.
---

# Debug Error

## Process

1. **Read the error — actually read it.** Full message, stack trace, file and line. The answer is often already in the text that got skimmed.
2. **Reproduce it reliably.** Find the smallest deterministic reproduction — ideally as a failing test (the Prove-It pattern in `write-tests`). If you can't reproduce it, gather more evidence (logs, inputs, environment) — don't guess-fix.
3. **Locate the fault.**
   - Recent changes first: what changed since it last worked (diff, history)?
   - Narrow by bisection: halve the search space — disable half, log at the midpoint, or bisect the history.
   - Identify the layer: input, logic, state, dependency, or environment.
4. **Hypothesize → verify, one at a time.** State the hypothesis, design the cheapest check that could falsify it, run it. Evidence over intuition; change one variable per experiment.
5. **Fix the root cause, not the symptom.** A guard that hides bad state (e.g., a null-check over an uninitialized value) leaves the bug alive elsewhere.
6. **Prove the fix.** Run the reproduction test from step 2 — it should now pass — then the full suite. If step 2's reproduction wasn't a test, add the regression test now (per `write-tests`).
7. **Clean up.** Remove the debug prints and logs your investigation added.

## When Stuck

After a few failed hypotheses, stop and step back:

- Re-read the original error — you know more now than the first time you read it.
- Question an assumption you've been treating as fact ("this function definitely returns X" — verify it).
- Explain the problem end-to-end, plainly; the gap usually shows itself.
- Widen the search: is the fault in a layer you excluded early on?

## Anti-patterns

- **Shotgun debugging** — changing several things at once until tests pass. You learn nothing and may break more.
- **Swallowing the error** — catching an exception to make the message disappear is not a fix.
- **Weakening the test** — if the code is wrong, fix the code, not the assertion.
- **Mystery fixes** — if you can't explain *why* the fix works, the bug isn't understood; say so instead of shipping it.
