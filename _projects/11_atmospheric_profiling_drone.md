---
layout: page
title: Atmospheric Profiling Drone Logger
description: A CUES-sponsored personal drone payload for measuring near-ground temperature, humidity, and wind profiles.
img: assets/img/projects/atmospheric-profiling-drone/logger-thumb.jpg
importance: 1
category: fun
---

This personal project explored whether a lightweight sling payload could turn a small drone into a basic atmospheric profiling platform. With full funding support from the **Cambridge University Engineering Society (CUES)**, I built a sub-200 g logger around an ESP32-S3, environmental sensing, inertial sensing, GPS, local storage, and a 2.4 GHz telemetry link.

The payload was designed to measure temperature and humidity directly while using its rotational motion as a rough proxy for the local wind profile. The final field tests captured a clear nocturnal temperature inversion and a near-surface wind profile, with the payload data synchronized against the drone flight log to recover altitude.

- **Download the short report:** <a class="btn btn-sm btn-outline-primary" href="{{ '/assets/pdf/atmospheric-profiling-drone.pdf' | relative_url }}" download>Atmospheric Profiling Drone.pdf</a>

<div class="row justify-content-sm-center">
  <div class="col-sm-10 mt-3 mt-md-0">
    {% include figure.liquid loading="eager" path="assets/img/projects/atmospheric-profiling-drone/logger-web.jpg" title="Drone atmospheric logger payload" class="img-fluid rounded z-depth-1" %}
  </div>
</div>
<div class="caption">
  The logger payload: microSD storage, BNO08x inertial sensing, 2.4 GHz wireless module, ESP32-S3, battery, GPS, voltage boost, XHT3x temperature/humidity sensing, and RTC clock module.
</div>

### Payload and logging

The logger records accelerometer, gyroscope, fused quaternion, temperature, humidity, and GPS data to a microSD card at a nominal 10 Hz. An RTC module updates the system clock at startup so that each run has a unique timestamped log file, while the microcontroller also records microsecond-resolution relative timing for every sample.

The payload was suspended below the drone rather than rigidly mounted. That made it mechanically simple and kept the aircraft separated from the sensing package, but it also meant the logger rotated quickly in flight: typically around 1.1 to 1.3 turns/s, with peaks up to about 2.9 turns/s. This made onboard altitude estimation unreliable, because accelerometer integration drifted too rapidly and the logger GPS altitude was noisy.

### Data retrieval

To recover altitude, I wrote a Python merge script that aligns the payload log with the DJI flight record exported through AirData. The field workflow recorded the logger boot and shutdown times, then linearly mapped the payload's relative time axis onto those absolute start and end times. Drone barometric altitude was then interpolated onto each logger sample.

That alignment step was the difference between a pile of sensor readings and a usable atmospheric profile: temperature, humidity, and angular velocity could be interpreted as functions of altitude rather than only as functions of time.

### Temperature and humidity

The humidity sensor had a long response time, so relative humidity varied less cleanly than temperature and was dominated by transients. The night run still showed near-ground humidity approaching saturation, likely helped by snow or frost, and a broad decrease with altitude.

<div class="row justify-content-sm-center">
  <div class="col-sm-10 mt-3 mt-md-0">
    {% include figure.liquid path="assets/img/projects/atmospheric-profiling-drone/night-humidity-alt-time.png" title="Night humidity profile" class="img-fluid rounded z-depth-1" %}
  </div>
</div>
<div class="caption">
  Night-time humidity profile with altitude and time. The slow sensor response makes the profile qualitative rather than a precise humidity sounding.
</div>

The temperature profiles were more revealing. A cloudy daytime flight showed the expected temperature decrease with altitude, while the clear sub-zero night flight showed the opposite: temperature increased with altitude, a nocturnal temperature inversion. The measured gradients were approximately 0.03-0.05 deg C/m in magnitude.

<div class="row justify-content-sm-center">
  <div class="col-sm-6 mt-3 mt-md-0">
    {% include figure.liquid path="assets/img/projects/atmospheric-profiling-drone/night-temperature-alt.png" title="Night temperature versus altitude" class="img-fluid rounded z-depth-1" %}
  </div>
  <div class="col-sm-6 mt-3 mt-md-0">
    {% include figure.liquid path="assets/img/projects/atmospheric-profiling-drone/day-temperature-alt.png" title="Day temperature versus altitude" class="img-fluid rounded z-depth-1" %}
  </div>
</div>
<div class="caption">
  Temperature-altitude profiles from a clear night and a cloudy day. The night profile captures a near-ground inversion; the day profile returns to the usual negative lapse-rate direction.
</div>

<div class="row justify-content-sm-center">
  <div class="col-sm-6 mt-3 mt-md-0">
    {% include figure.liquid path="assets/img/projects/atmospheric-profiling-drone/night-temperature-alt-time.png" title="Night temperature profile over time" class="img-fluid rounded z-depth-1" %}
  </div>
  <div class="col-sm-6 mt-3 mt-md-0">
    {% include figure.liquid path="assets/img/projects/atmospheric-profiling-drone/day-temperature-alt-time.png" title="Day temperature profile over time" class="img-fluid rounded z-depth-1" %}
  </div>
</div>
<div class="caption">
  Temperature plotted against altitude and time. The offset between ascent/descent traces shows the remaining transient response of the temperature sensor.
</div>

### Wind proxy

The original wind-measurement idea was to use a hot-wire anemometer, but I abandoned it after finding reliability and fragility concerns. Instead, the rotating sling payload became a crude wind probe: stronger airflow increased the rotational speed of the suspended logger.

This does not produce calibrated wind speed, and it is affected by torsional energy stored in the suspension line. It was still useful as a qualitative boundary-layer indicator. The angular velocity increased from the ground up to roughly 10 m, then became more nearly constant with further altitude.

<div class="row justify-content-sm-center">
  <div class="col-sm-6 mt-3 mt-md-0">
    {% include figure.liquid path="assets/img/projects/atmospheric-profiling-drone/night-angularvel-alt.png" title="Night angular velocity versus altitude" class="img-fluid rounded z-depth-1" %}
  </div>
  <div class="col-sm-6 mt-3 mt-md-0">
    {% include figure.liquid path="assets/img/projects/atmospheric-profiling-drone/day-angularvel-alt.png" title="Day angular velocity versus altitude" class="img-fluid rounded z-depth-1" %}
  </div>
</div>
<div class="caption">
  Payload angular velocity as a qualitative wind proxy. The night flight was stopped early when the payload and drone became unstable.
</div>

<div class="row justify-content-sm-center">
  <div class="col-sm-6 mt-3 mt-md-0">
    {% include figure.liquid path="assets/img/projects/atmospheric-profiling-drone/night-angularvel-alt-time.png" title="Night angular velocity profile over time" class="img-fluid rounded z-depth-1" %}
  </div>
  <div class="col-sm-6 mt-3 mt-md-0">
    {% include figure.liquid path="assets/img/projects/atmospheric-profiling-drone/day-angularvel-alt-time.png" title="Day angular velocity profile over time" class="img-fluid rounded z-depth-1" %}
  </div>
</div>
<div class="caption">
  Time-resolved rotation profiles. Reversal during descent is consistent with the suspension line releasing stored torsion as wind forcing weakened.
</div>

### What I learned

The project was a useful reminder that sensing is usually limited less by having "a sensor" and more by whether that sensor matches the physics of the measurement. Sensor fusion could not rescue altitude from a rapidly spinning payload, while the drone's barometer solved the problem cleanly. The temperature sensor captured the inversion, but the flight duration was too short for complete thermal settling, so the reported gradients are probably underestimates.

As a personal build, the most satisfying part was making a small, inexpensive system produce field data that lined up with real atmospheric structure: a stable nocturnal inversion and near-ground wind shear.

### References

1. National Weather Service, NOAA. "Atmospheric Controllers of Local Nighttime Temperature." Accessed 2026-01-13. <https://www.weather.gov/source/zhu/ZHU_Training_Page/winds/nighttime_influences/Nighttime_Influences.htm>
2. AirData UAV. "AirData UAV: Flight Data Analysis for Drones." Accessed 2026-01-13. <https://app.airdata.com/>
3. W. Yao and S. Zhong, "Nocturnal temperature inversions in a small, enclosed basin and their relationship to ambient atmospheric conditions," *Meteorological and Atmospheric Physics*, 103, 195-210, 2009. <https://doi.org/10.1007/s00703-008-0341-4>
4. R. B. Stull, *An Introduction to Boundary Layer Meteorology*. Springer, 1988. <https://doi.org/10.1007/978-94-009-3027-8>
