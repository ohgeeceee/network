---
title: Password Recovery and Setting Up a Password Manager with 2FA
slug: password-recovery-password-managers-2fa
category: security
summary: Get back into a locked account, then set up a password manager and two-factor so it never happens again. Written for people who have never used one.
tags: [problem:security, network:cellular, audience:senior, audience:non-technical]
difficulty_level: medium
estimated_time: 25
primary_device: any
os_versions: [iPhone, Android, Windows, Mac]
audience: [senior, non-technical, small-business]
targeted_region: us
service_intent: pro_recommended
on_site_eligible: false
cta_type: remote_booking
service_link: /book.html

problem_type: Security
symptoms: [locked out, forgot password, reset link not working, need 2FA, account hacked]
quick_fix: Before anything else, find the account's own Forgot password link and use the email or phone number you signed up with. Do not use a reset link from an email you did not ask for.
prerequisites:
  - Access to the email address the account uses
  - Your phone, for verification codes
  - About 25 minutes, done calmly
dont_need: You do not need to write passwords on paper, and you do not need to change every password today. Start with email, then bank, then everything else.
verification:
  - You are signed in to the account you were locked out of
  - The password manager fills a login for you on a test site
  - Two-factor codes arrive and work
  - You have saved your recovery codes somewhere offline
escalation:
  - If the reset email never arrives, check the spam and junk folders, and search your inbox for the account name.
  - If the account uses a phone number you no longer have, use the account's account-recovery form rather than the normal reset.
  - If you are locked out of your email itself, call the provider's support line — email is the master key, so it is worth the phone call.
  - If you believe the account was taken over, change the email password first, then everything else, then check the account's forwarding and recovery settings for anything you did not add.
faq: ["Which password manager should I use?|A well-known one that syncs across your devices and has a free tier. Bitwarden is free and open-source. 1Password and Dashlane are paid and polished. Your browser's built-in one is better than nothing but weaker than a dedicated app.", "Is a password manager safe if they get hacked?|A good one stores your passwords encrypted with a key only you hold, so a break-in at the company does not expose them. That is the whole point of the design.", "What is two-factor, in one sentence?|A second proof that it is really you — a code from an app or a text — on top of your password, so a stolen password alone is not enough.", "Should I use text messages for 2FA?|It is far better than nothing, but an authenticator app is stronger because text messages can be intercepted. Use the app when the site offers it."]
related_guides: [spot-avoid-phishing-text-scams-robocalls, clear-cache-cookies-popups, transfer-photos-data-new-device-cloud]
network_links: ["finally.help|https://finally.help|What two-factor authentication really is", "Manners|https://manners.pro|Small tools that respect the person using them"]
sources:
  - Bitwarden — free password manager|https://bitwarden.com
  - CISA — use a password manager|https://www.cisa.gov/secure-our-world
author: ohgeeceee
published: 2026-10-04
updated: 2026-10-04
last_verified: 2026-10-04
review_interval: 180
order: 5
---

## Two jobs, in order

There are two separate jobs here and it matters which you do first.

1. **Get back in.** Recover the account you are locked out of.
2. **Make sure it never happens again.** Set up a password manager and two-factor.

Do them in that order. Recovering an account is urgent; the setup is what stops it recurring.

## Part 1 — Get back in

### Step 1 — Use the site's own Forgot password link
![A sign-in page with the Forgot password link highlighted](/tech-support/security/password-recovery-password-managers-2fa/img/step-1.png)
Go to the site directly — type the address yourself rather than clicking a link in an email. Then use its **Forgot password** link.

> [!stop] Never use a password reset link from an email you did not ask for. That is the single most common phishing trick there is. If you did not request it, delete it.

### Step 2 — Check your email, including junk
![An inbox showing a password reset email](/tech-support/security/password-recovery-password-managers-2fa/img/step-2.png)
The reset email should arrive within a minute or two. If it does not, check **spam** and **junk**, and search your inbox for the site's name. Reset links expire quickly, so use it the moment it arrives.

### Step 3 — Handle the verification code
![A phone showing a six-digit verification code](/tech-support/security/password-recovery-password-managers-2fa/img/step-3.png)
Most sites now send a code to your phone or email as a second check. Enter it on the site. This is two-factor working as intended — it is what keeps someone else out even if they know your password.

### Step 4 — Set a new password you will actually keep
![A password field showing a long passphrase](/tech-support/security/password-recovery-password-managers-2fa/img/step-4.png)
Long beats complicated. Three or four random words strung together — `copper-tractor-lantern-nine` — is both stronger and easier to remember than `P@ssw0rd1`.

## Part 2 — Never do this again

### Step 5 — Install a password manager
![A password manager app showing a list of saved logins](/tech-support/security/password-recovery-password-managers-2fa/img/step-5.png)
Install one on your phone and your computer. Bitwarden is free and open-source; 1Password and Dashlane are paid and very polished. Any of them is a huge improvement on a notebook.

The manager remembers every password so you only have to remember one — the master password. Make that one a long passphrase and never reuse it anywhere.

### Step 6 — Let it generate your passwords
![A password manager generating a long random password](/tech-support/security/password-recovery-password-managers-2fa/img/step-6.png)
From now on, when you sign up somewhere, let the manager generate a long random password. You will never type it. That is the point.

### Step 7 — Turn on two-factor, starting with email
![Security settings showing two-step verification enabled](/tech-support/security/password-recovery-password-managers-2fa/img/step-7.png)
Turn on two-factor for your **email first**, then your bank, then everything else. Email is the master key to every other account, because that is where password resets go.

Use an **authenticator app** when offered. Text messages are a decent fallback, not the best choice.

### Step 8 — Save your recovery codes offline
![Recovery codes written on a card stored in a drawer](/tech-support/security/password-recovery-password-managers-2fa/img/step-8.png)
Every account gives you one-time **recovery codes** when you turn on two-factor. Print them or write them down and put them somewhere physical — a drawer, a safe, a wallet. If you lose your phone, these are the only way back in.

> [!warn] Do not store recovery codes in the same place as your password manager. If you lose access to one, you want the other to still work.

## The order that matters

Email first, then bank, then the rest. If you only do one thing today, turn on two-factor for your email account — that single step protects everything else by making sure nobody can reset your other passwords.