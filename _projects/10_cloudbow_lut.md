---
layout: page
title: Scattered Light's Polarisation Variation Due to Changing Droplet Sizes
description: Explore the P12 component of the phase scattering matrix as droplet size distribution is varied.
img: assets/img/project_thumbnails/cloudbow_lut_thumb.png
importance: 0
category: uni
---

This project hosts an interactive **Cloud-bow P12 LUT visualiser** (RGB), intended for rapid inspection of lookup tables used in droplet-size retrievals.

Clouds are formed of droplets of different sizes. The droplet size distribution (DSD) uses effective radius (r_eff) to describe how large the cloud droplets are and effective variance (\nu_eff) to describe how wide the size distribution is. A larger r_eff means a larger overall droplet size. A small \nu_eff means almost all droplets are the same size, a larger \nu_eff means the droplets' size are different from each other.

It turns out that the scattered sunlight's polarisation signal depends on the cloud DSD. The relationship is shown in the interactive app below. Basically, for unpolarised incoming sunlight, P_12, the polarising phase function, describes the intensity of scattered light's linear polarisation. It varies across different scattering angles \theta. The signal is strongly dependent on DSD in the back glory region (170\deg \leq \theta \leq 180 \deg), and the cloudbow region (135 \deg \leq \theta \leq 165 \deg). My fourth-year project at Cambridge focused on the signal in the cloudbow region, like Pörtge et al. (2023). Note that when scattering angle \theta=0\deg, the scattered light transmits at the same direction as the incident light.

The exact relationship between the droplet size distribution and the scattered light's polarisation signal in the scattering plane is shown by the interactive app below. Generally speaking, the larger the cloud droplets (larger r_eff), the larger the ring of maximum linear polarisation is (quantified by a smaller scattering angle \theta). The wider the droplet sizes are distributed, the thicker the maximum linear polarisation ringle appears to be (quantified by a wider peak in the scattering angle domain).

- **Open the app:** <a class="btn btn-sm btn-outline-primary" href="{{ '/cloudbow-lut/' | relative_url }}">Launch Cloud-bow LUT Explorer</a>
- **Download full LUT (HDF5):** <a class="btn btn-sm btn-outline-secondary" href="{{ '/cloudbow-lut/data/p12_rgb_lut.h5' | relative_url }}" download>p12_rgb_lut.h5</a>

<div style="margin-top:14px; border:1px solid rgba(0,0,0,0.08); border-radius:12px; overflow:hidden;">
  <iframe
    src="{{ '/cloudbow-lut/' | relative_url }}"
    style="width:100%; height:920px; border:0;"
    loading="lazy"
    title="Cloud-bow LUT Explorer"
  ></iframe>
</div>

### Notes
- The app defaults to a **small subsampled** LUT for quick loading, with a button to load the full LUT.
- The DSD plot uses the **Hansen / Pörtge gamma parameterisation**: \(n(r) \propto r^{(1-3v_{eff})/v_{eff}} \exp[-r/(r_{eff} v_{eff})]\).
