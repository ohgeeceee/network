---
title: Set Up a Wireless Printer and Fix Printer Offline Errors
slug: fix-printer-offline-wireless-setup
category: hardware
summary: Get a wireless printer onto your network once and keep it there. Plus the offline-error fixes, in order, when it drops off again.
tags: [device:printer, network:wifi, problem:offline, audience:non-technical]
difficulty_level: medium
estimated_time: 15
primary_device: printer
os_versions: [Windows, Mac, iPhone, Android]
audience: [senior, non-technical, small-business]
targeted_region: us
service_intent: pro_recommended
on_site_eligible: true
cta_type: onsite_request
service_link: /tech-support/onsite-montana/

problem_type: Offline
symptoms: [printer offline, cannot find printer, prints to nowhere, wrong printer selected]
quick_fix: Check the printer is awake and on the same Wi-Fi as your computer, then turn the printer off and on. A printer that has gone to sleep loses its network address and reports itself offline.
prerequisites:
  - The printer and your Wi-Fi password
  - Access to the router
  - Ten quiet minutes
dont_need: You do not need to reinstall the printer from scratch unless the steps below fail. Try the simple fixes first.
verification:
  - The printer shows as ready rather than offline
  - A test page prints
  - The printer has the same network name as your computer
  - It survives a sleep and wake cycle without going offline again
escalation:
  - Give the printer a fixed address. In the router settings, reserve an IP address for the printer so it stops changing.
  - Remove the printer from your computer and add it again by its address rather than by name.
  - Connect by USB once to confirm the printer works at all, then return to Wi-Fi.
  - Update the printer firmware from the printer's own menu or the manufacturer's app.
faq: ["Why does my printer keep going offline?|Almost always because it was given a new network address when it woke up, and the computer is still looking for the old one. Reserving a fixed address in the router stops this for good.", "Should I use 2.4 GHz or 5 GHz for a printer?|2.4 GHz, nearly always. Most printers only support 2.4 GHz, and it reaches further. Check your printer's spec sheet if you are unsure.", "The printer shows up twice — which do I use?|Remove both and add one. Duplicate entries are usually one old USB install and one network install, and the computer keeps picking the wrong one."]
related_guides: [boost-wifi-signal-large-home-outbuildings, smart-tv-streaming-weak-wifi, clear-cache-cookies-popups]
network_links: ["finally.help|https://finally.help|Why devices need addresses, explained simply", "GarageRoute|https://garageroute.com|Local marketplace for the network"]
sources:
  - Microsoft support — fix printer connection problems|https://support.microsoft.com
  - Apple support — set up a printer with Mac|https://support.apple.com
author: ohgeeceee
published: 2026-10-04
updated: 2026-10-04
last_verified: 2026-10-04
review_interval: 240
order: 9
---

## Why printers go "offline"

A wireless printer is a small computer with its own network address. When it sleeps and wakes, your router may hand it a **different** address. Your computer is still looking at the old one, finds nothing there, and reports "offline".

That is the whole story behind most printer trouble. Fixing the address once is what stops it happening weekly.

## Part 1 — Get it on the network

### Step 1 — Put the printer on 2.4 GHz
![A printer's Wi-Fi setup menu showing a network list](/tech-support/hardware/fix-printer-offline-wireless-setup/img/step-1.png)
In the printer's own menu, find the wireless setup and join your **2.4 GHz** network. Most printers do not support 5 GHz at all. If your network name ends in `-5G`, that is the wrong one.

### Step 2 — Add it to your computer
![Windows Add a printer screen showing a discovered network printer](/tech-support/hardware/fix-printer-offline-wireless-setup/img/step-2.png)
- **Windows:** Settings > Bluetooth & devices > **Printers & scanners** > Add device.
- **Mac:** System Settings > **Printers & Scanners** > Add Printer.

Let it search. If the printer appears, add it. If it does not, add it by address instead — the printer's menu will show its IP address, something like `192.168.1.42`.

### Step 3 — Print a test page
![A test page emerging from a printer](/tech-support/hardware/fix-printer-offline-wireless-setup/img/step-3.png)
Print one page from the printer's own menu to prove the hardware works, then one from your computer to prove the connection works. If the printer's own page prints but the computer's does not, it is a connection problem, not a printer problem.

## Part 2 — Fix the offline error

### Step 4 — Wake it and restart it
![A printer being switched off at the power button](/tech-support/hardware/fix-printer-offline-wireless-setup/img/step-4.png)
A printer that has been asleep for hours often reports offline. Press its power button to wake it, then switch it off and on. Watch whether the status changes to ready.

### Step 5 — Confirm they are on the same network
![A computer's Wi-Fi list next to a printer's network name](/tech-support/hardware/fix-printer-offline-wireless-setup/img/step-5.png)
This is the classic mistake: the computer is on the guest network or the 5 GHz network and the printer is on the 2.4 GHz one. They cannot see each other. Put both on the same network.

### Step 6 — Remove the duplicates
![Printers and scanners list showing two entries for the same printer](/tech-support/hardware/fix-printer-offline-wireless-setup/img/step-6.png)
If the printer appears twice, remove **both** and add one. Duplicates usually mean one leftover USB install and one network install, and your computer keeps choosing the dead one.

### Step 7 — Reserve a fixed address
![Router settings showing a reserved IP address for the printer](/tech-support/hardware/fix-printer-offline-wireless-setup/img/step-7.png)
In your router settings, find **DHCP reservation** or **Address Reservation** and pin the printer to one address. This is the permanent fix. Now when it wakes up, it is always the same printer at the same address, and the offline error stops.

> [!warn] Write the printer's reserved address down and tape it inside the printer's lid. It saves you hunting for it next year.

## The small business note

If you print from several computers, do the reservation step on day one. It is the difference between a printer that works for years and one that someone has to fix every Monday morning.