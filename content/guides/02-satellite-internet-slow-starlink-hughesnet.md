---
title: Satellite Internet Slow or Dropping Out (Starlink & HughesNet)
slug: satellite-internet-slow-starlink-hughesnet
category: connectivity
summary: Why satellite internet slows down, drops out, and stalls in bad weather — and the settings and placement fixes that actually help.
tags: [network:satellite, isp:starlink, isp:hughesnet, problem:slow, audience:rural]
difficulty_level: medium
estimated_time: 15
primary_device: router
os_versions: [Starlink app, HughesNet]
audience: [rural, non-technical]
targeted_region: rural-us
service_intent: pro_required
on_site_eligible: true
cta_type: onsite_request
service_link: /tech-support/onsite-montana/

problem_type: Slow
symptoms: [buffering, video calls drop, slow evenings, no internet in storms, high latency]
quick_fix: Check the dish for snow, dust, or a new obstruction (a growing tree) and clear it. Then run the app's own speed test. Most satellite slowdowns are obstruction or weather, not a setting.
prerequisites:
  - The Starlink or HughesNet app on your phone
  - The Wi-Fi password for your router
  - A clear line of sight check — can you see the dish from the ground
dont_need: You do not need to reboot the dish to factory settings, or buy a new router. Most fixes are placement and weather.
verification:
  - A speed test inside the app shows your normal range for the plan
  - The obstruction view in the app shows a clear, dark sky area
  - Video calls hold for five minutes without freezing
  - No red or yellow alerts on the app's home screen
escalation:
  - Power-cycle the dish: unplug it at the wall for a full 60 seconds, then plug it back in and let it re-acquire (up to 15 minutes).
  - Move the router away from the dish's power supply and away from microwaves and cordless phone bases.
  - Run an ethernet cable from the router straight to one device to prove whether the slowdown is Wi-Fi or the satellite link itself.
  - Contact support with your speed test history and the exact times the slowdown happens — evenings and storms are normal and worth documenting.
faq: ["Why is satellite internet slow in the evening?|Everyone in your area is online at once, and the satellite capacity is shared. This is congestion, not a fault. It is worst between about 7pm and 11pm.", "Does weather really break satellite internet?|Yes. Heavy rain, wet snow, and thick cloud attenuate the signal. Light rain usually does not. This is called rain fade and it is physics, not a broken dish.", "How much does latency matter?|A lot for video calls and gaming. Satellite round-trips run much higher than cable, so a stable 50 Mbps on satellite can feel worse than 15 Mbps on cable for live calls."]
related_guides: [boost-wifi-signal-large-home-outbuildings, fix-no-service-sos-mode-rural-montana, smart-tv-streaming-weak-wifi]
network_links: ["finally.help|https://finally.help|What latency actually means, in plain words", "SupportMT|https://supportmt.com|Rural Montana resilience and family support"]
sources:
  - Starlink support — obstruction and speed|https://support.starlink.com
  - HughesNet support centre|https://support.hughesnet.com
author: ohgeeceee
published: 2026-10-04
updated: 2026-10-04
last_verified: 2026-10-04
review_interval: 120
order: 2
---

## Two different problems, one symptom

"Satellite internet is slow" covers two very different faults, and they need different fixes.

The first is **obstruction** — something between your dish and the sky. The second is **congestion and weather** — the shared satellite link itself. The app tells you which one you have, so start there rather than guessing.

## The steps

### Step 1 — Read the app's obstruction view
![Starlink app obstruction view showing a mostly dark sky circle](/tech-support/connectivity/satellite-internet-slow-starlink-hughesnet/img/step-1.png)
Open the Starlink app and tap **Obstructions**. You are looking for a mostly dark circle. Any large red or orange blob is something in the way — a tree, a chimney, a pole.

HughesNet users: look for the signal strength and obstruction indicators in the HughesNet app or the modem's status page.

### Step 2 — Clear what you can
![Snow being brushed off a satellite dish](/tech-support/connectivity/satellite-internet-slow-starlink-hughesnet/img/step-2.png)
Wet snow, ice, and dust are the most common culprits and the easiest to fix. Brush snow off the face of the dish — do not scrape at it with anything metal. Check that a tree has not grown into the line of sight since you installed it; that is a very common summer-to-winter change.

> [!warn] Never climb onto a roof to clear a dish in icy conditions. If you cannot reach it safely, wait it out or hire it out.

### Step 3 — Run the app's own speed test
![Speed test result screen in the satellite app](/tech-support/connectivity/satellite-internet-slow-starlink-hughesnet/img/step-3.png)
Use the speed test **inside the app**, not a website. It tests the satellite link itself, which is what you want to isolate. Then run a speed test on a device over Wi-Fi. If the app test is fast and the Wi-Fi test is slow, your problem is the Wi-Fi, not the satellite — go to [boosting Wi-Fi across a large property](/tech-support/connectivity/boost-wifi-signal-large-home-outbuildings/).

### Step 4 — Note the time of day
![A notebook with evening hours circled](/tech-support/connectivity/satellite-internet-slow-starlink-hughesnet/img/step-4.png)
Write down when it slows. If it is consistently 7pm to 11pm, that is congestion and there is no setting that fixes it — it is shared capacity. Knowing this saves you an hour of pointless fiddling.

### Step 5 — Move the router off the dish's power supply
![Router placed on a shelf away from other electronics](/tech-support/connectivity/satellite-internet-slow-starlink-hughesnet/img/step-5.png)
If your router sits right on top of the dish's power brick, or next to a microwave or cordless phone base, move it. Those devices throw out interference on the same frequencies Wi-Fi uses.

### Step 6 — Power-cycle the dish properly
![Power brick being unplugged from a wall socket](/tech-support/connectivity/satellite-internet-slow-starlink-hughesnet/img/step-6.png)
Unplug the dish at the wall — not just the router — and leave it a full 60 seconds. Plug it back in and give it up to 15 minutes to re-acquire satellites. This clears the "it has been running for eight months" gremlins.

### Step 7 — Test with a cable
![Ethernet cable running from the router to a laptop](/tech-support/connectivity/satellite-internet-slow-starlink-hughesnet/img/step-7.png)
Run an ethernet cable from the router directly to one laptop and test there. If it is still slow on a cable, the problem is the satellite link and no router change will help. If the cable is fast and Wi-Fi is slow, you have a Wi-Fi problem.

## What genuinely cannot be fixed

- **Rain fade.** Heavy rain and wet snow block the signal. It clears when the weather does.
- **Evening congestion.** Shared capacity in a busy cell. It eases after about 11pm.
- **High latency.** Satellite round-trips are long. Fine for streaming, harder for live video calls and gaming.

Being clear about those three stops you chasing a fix that does not exist — and tells you when a different technology (fixed wireless, fibre if it ever arrives, or a second connection for calls) is the real answer.