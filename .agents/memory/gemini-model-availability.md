---
name: Gemini model availability
description: Gemini API keys may reject older models even when the model name is valid.
---

New Gemini API keys can return a provider-side 404 for `gemini-2.5-flash` and recommend an active replacement model instead.

**Why:** The provider classified the model as unavailable to new users, so retrying the same endpoint or changing audio payload formatting cannot fix it.

**How to apply:** Preserve the requested analysis behavior, inspect the provider error message, and use the provider-recommended active model when the requested model is unavailable for the configured key.