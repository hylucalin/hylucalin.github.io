---
layout: page
title: Simulated Light Polarisation Signal from Water Droplet Scattering
description: Explore the P12 component of the phase scattering matrix as (r_eff, v_eff) is varied.
img: assets/img/project_thumbnails/cloudbow_lut_thumb.png
importance: 0
category: work
---

This project hosts an interactive **Cloud-bow P12 LUT visualiser** (RGB), intended for rapid inspection of lookup tables used in droplet-size retrievals.

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
