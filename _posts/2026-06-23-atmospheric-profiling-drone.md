---
layout: post
title: CUES-funded Atmospheric Profiling Drone
date: 2026-06-23 12:00:00
description: The basic sensing idea behind my CUES-funded atmospheric profiling drone logger.
tags: drones atmospheric-science sensors esp32 cues
categories: personal-projects
thumbnail: assets/img/projects/atmospheric-profiling-drone/logger-thumb.jpg
---

With support from the **Cambridge University Engineering Society (CUES)**, I built a small drone-slung payload for atmospheric profiling. The detailed write-up, figures, and report are on the [project page]({{ '/projects/11_atmospheric_profiling_drone/' | relative_url }}); this post is just the basic idea behind it.

The atmosphere near the ground is not uniform. Temperature can change rapidly over the first few tens of metres, humidity can vary with surface conditions, and wind often has a strong vertical gradient close to the surface. A drone is a convenient way to sample that vertical structure because it can climb through the layer directly, but the drone itself is not always the best place to put the sensors: prop wash, vibration, and mounting constraints can all get in the way.

So the design choice was to hang a small logger below the drone. The payload stayed lightweight, recorded data locally, and carried the sensors far enough from the airframe to make the measurements more meaningful.

<div class="row mt-3 justify-content-sm-center">
  <div class="col-sm-8 mt-3 mt-md-0">
    {% include figure.liquid loading="eager" path="assets/img/projects/atmospheric-profiling-drone/logger-web.jpg" class="img-fluid rounded z-depth-1" %}
  </div>
</div>
<div class="caption">
  The logger payload: ESP32-S3, microSD storage, RTC, GPS, BNO08x motion sensing, temperature/humidity sensing, battery, voltage boost, and 2.4 GHz telemetry.
</div>

The logger records temperature and humidity directly, while the inertial sensor records how the suspended payload moves. The crucial extra ingredient is altitude. The payload's own altitude estimate was not trustworthy enough, so I used the drone's barometric altitude from its flight log and synchronized it with the payload's timestamps. Once that alignment is done, a simple time series becomes a vertical atmospheric profile.

<div class="row mt-3">
  <div class="col-sm mt-3 mt-md-0">
    {% include figure.liquid path="assets/img/projects/atmospheric-profiling-drone/night-temperature-alt.png" class="img-fluid rounded z-depth-1" %}
  </div>
  <div class="col-sm mt-3 mt-md-0">
    {% include figure.liquid path="assets/img/projects/atmospheric-profiling-drone/day-temperature-alt.png" class="img-fluid rounded z-depth-1" %}
  </div>
</div>
<div class="caption">
  The same logger idea gives temperature profiles for different atmospheric conditions: for example, a night-time inversion versus a cloudy daytime profile.
</div>

The other playful idea was using rotation as a wind clue. A suspended payload twists and spins more when the surrounding flow is stronger. That is not a calibrated anemometer, but it can still act as a qualitative proxy for how wind changes with height near the ground.

The project was a nice reminder that sensing is as much about the physical setup as the electronics. The microcontroller can log everything beautifully, but the measurement only becomes useful when the sensor, motion, timing, and reference data all fit together.

Read the full project page here: [Atmospheric Profiling Drone Logger]({{ '/projects/11_atmospheric_profiling_drone/' | relative_url }}).
