# Contact form: one-time setup

The contact form on `contact.html` posts to `/api/contact`, which forwards the submission by email via Resend. This is the same pattern as the FutureInSites inquiry form.

Until the steps below are done, the function returns "Server is not configured to send mail yet." and the form shows that error inline (with a mailto fallback to hello@spirantix.ai).

Note: `/api/contact` is a Vercel serverless function. It requires the site to be hosted on Vercel (or another platform that runs `api/*.js` functions). If the site is deployed as plain static hosting (e.g. GitHub Pages), the form cannot send email; in that case either move hosting to Vercel like futureinsites.com, or switch the form to a hosted form service.

## Current setup (June 2026)

Submissions go to **spirantix@futureinsites.com**, sent from **forms@futureinsites.com**. Because futureinsites.com is already verified in Resend, no new domain verification is needed. Only one step remains:

Vercel → Spirantix project → **Settings → Environment Variables** (Production):

| Name             | Value                              |
| ---------------- | ---------------------------------- |
| `RESEND_API_KEY` | the existing FutureInSites `re_…` key (or create a new one in Resend → API Keys) |

`CONTACT_TO` and `CONTACT_FROM` default to the futureinsites.com addresses above in the code; set them as env vars only if you want to override. Redeploy after adding the env var.

## Later: switch to spirantix.ai addresses

1. Resend → **Domains → Add Domain** → `spirantix.ai`; add the DNS records it shows (one MX, two TXT), then **Verify**.
2. Set env vars `CONTACT_TO=hello@spirantix.ai` and `CONTACT_FROM=Spirantix <forms@spirantix.ai>` and redeploy.

The `CONTACT_FROM` mailbox doesn't need to exist; Resend only needs the domain verified. Replies go to the submitter via the `reply_to` header.

## 4. Smoke test

Submit the form on the live site and confirm the email arrives, the success message shows, and clicking Reply addresses the submitter.
