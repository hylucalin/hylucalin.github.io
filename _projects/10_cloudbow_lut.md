---
layout: page
title: Cloudbow Polarisation LUT Explorer
description: Interactive lookup-table viewer for how cloud droplet size distributions shape the P12 cloudbow signal.
img: assets/img/project_thumbnails/cloudbow_lut_thumb.png
importance: 0
category: uni
---

This interactive viewer presents the lookup table used in my fourth-year project, **Drone-borne Retrieval of Cloud Droplet Size Distributions Using Polarimetric Imagery**. The report asks whether a low-cost drone-borne polarisation camera can retrieve high-spatial-resolution cloud droplet size distributions from cloudbow-region observations of low cloud or fog.

The retrieval is based on a simple physical idea: the angular pattern of linearly polarised sunlight scattered by liquid-water droplets depends on the droplet size distribution (DSD). In the report, the measured scattering-plane Stokes component $Q_s$ is used as a proxy for the polarised phase-matrix element $P_{12}$. The app below lets you inspect theoretical $P_{12}(\theta)$ profiles generated over a grid of DSD parameters.

Cloud DSDs are represented using a monomodal gamma distribution parameterised by effective radius $r_{\mathrm{eff}}$ and effective variance $\nu_{\mathrm{eff}}$:

$$
n(r) \propto
r^{(1 - 3\nu_{\mathrm{eff}})/\nu_{\mathrm{eff}}}
\exp\left[-\frac{r}{r_{\mathrm{eff}}\nu_{\mathrm{eff}}}\right].
$$

Here, $r_{\mathrm{eff}}$ controls the characteristic droplet size, while $\nu_{\mathrm{eff}}$ controls the distribution width. Larger $r_{\mathrm{eff}}$ shifts the cloudbow features away from the anti-solar point, and larger $\nu_{\mathrm{eff}}$ broadens and smooths the peaks.

The project focuses on the cloudbow region,

$$
135^\circ \leq \theta \leq 165^\circ,
$$

where the polarisation signal is sensitive to liquid-water droplet size. The backscatter glory region,

$$
170^\circ \leq \theta \leq 180^\circ,
$$

is also sensitive to DSD, but it occupies a narrower angular range and imposes stricter viewing-geometry requirements. In the field retrieval pipeline, measured $Q_s(\theta)$ profiles are fitted to a Mie-scattering lookup table of theoretical $P_{12}(\theta)$ curves following the cloudbow retrieval approach of Pörtge et al. (2023).

- **Open the app:** <a class="btn btn-sm btn-outline-primary" href="{{ '/cloudbow-lut/' | relative_url }}">Launch Cloud-bow LUT Explorer</a>
- **Download full LUT (HDF5):** <a class="btn btn-sm btn-outline-secondary" href="{{ '/cloudbow-lut/data/p12_rgb_lut.h5' | relative_url }}" download>p12_rgb_lut.h5</a>

<div style="margin-top:14px; border:1px solid rgba(0,0,0,0.08); border-radius:12px; overflow:hidden;">
  <iframe
    src="{{ '/cloudbow-lut/' | relative_url }}"
    style="width:100%; height:680px; border:0;"
    loading="lazy"
    title="Cloud-bow LUT Explorer"
  ></iframe>
</div>

### Notes
- The app defaults to a **small subsampled** LUT for quick loading, with a button to load the full LUT.
- Interpolation is bilinear in $(r_{\mathrm{eff}}, \nu_{\mathrm{eff}})$, with an option to interpolate along $\log(r_{\mathrm{eff}})$.
- Multi-DSD mode is for comparing several selected distributions. The bubble preview is intentionally limited to single-DSD mode.
