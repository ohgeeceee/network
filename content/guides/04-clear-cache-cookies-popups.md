---
title: Clear Cache, Cookies and Pop-Ups in Any Browser
slug: clear-cache-cookies-popups
category: software
summary: A slow, cluttered browser and constant pop-ups are usually the same problem. Clear the right things in Chrome, Edge, Safari or Firefox without losing your passwords.
tags: [device:windows, device:mac, problem:slow, audience:non-technical]
difficulty_level: easy
estimated_time: 6
primary_device: any
os_versions: [Chrome, Edge, Safari, Firefox]
audience: [senior, non-technical]
targeted_region: us
service_intent: diy_ok
on_site_eligible: false
cta_type: remote_booking
service_link: /book.html

problem_type: Slow
symptoms: [pop-ups, slow browsing, pages look wrong, stuck sign-in, site will not load]
quick_fix: Open a private or incognito window and load the same site. If it works there, it is your cache or cookies. That one test tells you whether clearing will help before you clear anything.
prerequisites:
  - A few minutes
  - Your password manager, or a note of your important passwords
  - The browser you actually use
dont_need: You do not need to clear saved passwords or bookmarks. Leave those ticked off and you will stay signed in to almost everything.
verification:
  - The page that was broken loads correctly
  - Pop-ups stop appearing on sites you trust
  - The browser feels quicker on heavy pages
  - You are still signed in to your email and bank
escalation:
  - Turn on the browser's pop-up blocker (Chrome: Settings > Privacy and security > Site settings > Pop-ups and redirects).
  - Remove suspicious extensions: Settings > Extensions. Anything you do not recognise, turn off.
  - Reset the browser's settings to default as a last resort — this keeps bookmarks but clears the rest.
  - If pop-ups appear even with the browser closed, run a malware scan. That is not a browser problem.
faq: ["Will clearing cookies sign me out of everything?|Out of most sites, yes. That is why you should leave Passwords unticked and keep a password manager so signing back in is painless.", "What is the difference between cache and cookies?|Cache is saved pieces of pages that make loading faster. Cookies are small notes sites leave to remember you. Clearing cache fixes broken pages. Clearing cookies fixes sign-in and tracking oddities.", "Do I need to clear my history too?|No. History is just a list. It does not slow the browser down, and clearing it only loses you the ability to find a page you visited earlier."]
related_guides: [speed-up-slow-computer, password-recovery-password-managers-2fa, spot-avoid-phishing-text-scams-robocalls]
network_links: ["finally.help|https://finally.help|What cookies actually are, explained plainly", "Manners|https://manners.pro|A tiny extension that minds its own business"]
sources:
  - Chrome help — clear cache and cookies|https://support.google.com/chrome/answer/95582
  - Firefox help — clear cookies and cache|https://support.mozilla.org
author: ohgeeceee
published: 2026-10-04
updated: 2026-10-04
last_verified: 2026-10-04
review_interval: 240
order: 4
---

## Cache, cookies and pop-ups are three different things

People say "clear the cache" to mean "make the browser behave". But you are dealing with three separate things, and clearing the wrong one costs you every saved sign-in.

- **Cache** — saved copies of pages and images. It makes sites load faster. When it goes stale, pages look broken or out of date.
- **Cookies** — small notes a site leaves to remember you, like keeping you signed in.
- **Pop-ups** — usually caused by a site's permissions, or by an extension you installed and forgot about.

Clear the cache freely. Clear cookies deliberately. Deal with pop-ups separately.

## The steps

### Step 1 — Test with a private window first
![A browser private window with the menu highlighted](/tech-support/software/clear-cache-cookies-popups/img/step-1.png)
Open a **private** (Safari, Firefox) or **incognito** (Chrome, Edge) window — usually under the three-dot or three-line menu. Load the site that is misbehaving.

If it works perfectly here, the problem is your cache or cookies, and clearing will fix it. If it is broken here too, clearing will not help — the site itself is the problem.

### Step 2 — Open the clear-data screen
![Chrome Settings, Privacy and security, Clear browsing data](/tech-support/software/clear-cache-cookies-popups/img/step-2.png)
- **Chrome / Edge:** press **Ctrl + Shift + Delete** on Windows, or **Cmd + Shift + Delete** on Mac.
- **Firefox:** press the same shortcut.
- **Safari:** **Safari > Settings > Privacy > Manage Website Data**.

### Step 3 — Choose what to clear
![The clear-data dialog with only Cached images and files ticked](/tech-support/software/clear-cache-cookies-popups/img/step-3.png)
Set the time range to **All time**, then tick:

- Cached images and files — always safe.
- Cookies and other site data — this signs you out of sites. Tick it when sign-in is misbehaving.

Leave **Passwords** and **Autofill** unticked. That is what keeps you signed in to your email and bank.

### Step 4 — Clear it
![A progress indicator while the browser clears data](/tech-support/software/clear-cache-cookies-popups/img/step-4.png)
Press **Clear data**. It takes a few seconds. Close and reopen the browser afterwards so it starts fresh.

### Step 5 — Deal with the pop-ups
![Chrome Site settings showing the Pop-ups and redirects option](/tech-support/software/clear-cache-cookies-popups/img/step-5.png)
Go to **Settings > Privacy and security > Site settings > Pop-ups and redirects** and set it to block. Then check the **Allowed** list underneath and remove any site you do not recognise — a site you allowed once can keep popping up forever.

### Step 6 — Check your extensions
![Chrome Extensions page listing installed extensions](/tech-support/software/clear-cache-cookies-popups/img/step-6.png)
Open the extensions page and look down the list. Every one you do not actively use and recognise should be **turned off**, then removed. Extensions are the number one source of surprise pop-ups, and half of them came bundled with something else.

> [!warn] If pop-ups appear even when your browser is closed, or your search engine changed by itself, this is malware rather than a setting. Run a full scan — see [speeding up a slow computer](/tech-support/software/speed-up-slow-computer/).

## A note on staying signed in

The reason to keep a password manager is exactly this moment. When cookies get cleared, you sign back in with one click instead of hunting for a scrap of paper. If that is new to you, [the password guide](/tech-support/security/password-recovery-password-managers-2fa/) walks through it.