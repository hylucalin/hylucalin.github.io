---
layout: page
title: "Building a Flying Cloud Detective"
description: A school-level case study about using drones, polarised light, and code to measure tiny cloud droplets.
img: assets/img/projects/flying-cloud-detective/drone-camera-assembly.jpg
importance: 0
category: uni
---

My fourth-year project asked a simple question with a surprisingly tricky answer:

> Can a small drone measure the size of tiny droplets inside low cloud or fog?

That matters because clouds help control Earth's temperature. A bright cloud reflects sunlight back to space, while a darker cloud lets more sunlight warm the surface. One thing that changes cloud brightness is the size of the droplets inside it. If the same amount of cloud water is split into many smaller droplets, the cloud can become brighter. Climate scientists call this the **Twomey effect**.

The full research project used a drone, a Raspberry Pi computer, a fast SSD, and a special colour polarisation camera to look for a hidden rainbow-like signal in cloud. The submitted report used data from valley fog in the Yorkshire Dales on 8 March 2026. This page tells the easier version: how engineers turn a flying camera into a scientific instrument.

<div class="cloud-question" id="cloud-question">
  <div>
    <strong>Quick thought experiment</strong>
    <p>Two clouds contain the same amount of liquid water. Which one would you expect to reflect more sunlight?</p>
  </div>
  <button type="button" data-answer="large">Fewer large droplets</button>
  <button type="button" data-answer="small">Many small droplets</button>
  <p id="cloud-question-result" aria-live="polite">Choose an answer to reveal the idea.</p>
</div>

## 1. The Big Question

Cloud droplets are tiny, often only a few micrometres across. A micrometre is one millionth of a metre, so a typical cloud droplet can be much smaller than the width of a human hair.

Instead of measuring every droplet one by one, cloud scientists often describe a cloud using:

- **Droplet size distribution:** how many small, medium, and large droplets there are.
- **Effective radius:** a useful average droplet size for light scattering.
- **Effective variance:** how spread out the droplet sizes are.

Satellites can estimate cloud droplet size over large areas, but their pixels are usually far larger than a small patch of cloud. My project explored whether a drone could measure cloud droplets at much finer local detail, especially for small low clouds or fog that change quickly.

<div class="row justify-content-sm-center">
  <div class="col-sm-10 mt-3 mt-md-0">
    {% include figure.liquid loading="eager" path="assets/img/projects/flying-cloud-detective/fieldwork-site-topography.png" title="Fieldwork site topography" class="img-fluid rounded z-depth-1" %}
  </div>
</div>
<div class="caption">
  Intention: show that this was a real outdoor field experiment, not just a simulation. This map marks the March 8 fieldwork site in hilly terrain where low cloud or valley fog could form. Source: final report Figure 6, originally exported as <code>image155.png</code>.
</div>

## 2. The Drone Becomes a Science Instrument

The drone was not just taking pretty videos. It had to carry a measurement system:

- an iFlight Chimera 7 Pro V2 FPV drone to move through the air;
- a LUCID Triton TRI050S1-QC colour polarisation camera to record cloud light;
- a lens to set the field of view;
- a Raspberry Pi 4B to control recording;
- a 1 TB SSD to store the image stream;
- separate drone and payload batteries, plus a rigid protective mount.

The engineering challenge was not simply "attach a camera". The camera had to be held rigidly, the cables had to stay away from the propellers, the mass had to remain close to the drone centreline, and the data had to survive a rough landing.

The camera recorded 12-bit video at 10 frames per second. Before the cloud data could be trusted, the camera system was calibrated with a ChArUco target, and a practical vignetting correction was applied so that darker image corners would not be mistaken for cloud physics.

<div class="row justify-content-sm-center">
  <div class="col-sm-6 mt-3 mt-md-0">
    {% include figure.liquid loading="eager" path="assets/img/projects/flying-cloud-detective/drone-camera-assembly.jpg" title="Drone and camera assembly" class="img-fluid rounded z-depth-1" %}
  </div>
  <div class="col-sm-6 mt-3 mt-md-0">
    {% include figure.liquid loading="eager" path="assets/img/projects/flying-cloud-detective/payload-exploded-view.png" title="Payload exploded view" class="img-fluid rounded z-depth-1" %}
  </div>
</div>
<div class="caption">
  Intention: connect the accessible story to the actual hardware. Left: the completed drone-camera assembly on a bench. Right: the exploded CAD view showing the Triton camera, lens, Raspberry Pi 4B, UPS hat, SSD, battery, and protective cage. Sources: final report Figure 5 (<code>image153.jpg</code>) and Figure 4 (<code>image152.png</code>).
</div>

### Try The Payload Design Challenge

Imagine you are given a fixed budget and can choose only some of these parts: camera, GPS, IMU, gimbal, laser range finder, onboard computer. Which ones would you pick if the drone had to track a patch of cloud?

There is no perfect answer. A camera is light and useful, but it does not directly tell you distance. GPS helps locate the drone, but not the cloud patch inside the image. An onboard computer can run image tracking, but it adds weight and power demand. Engineering is often about choosing the least-bad set of clues and understanding what each one can and cannot tell you.

## 3. Following The Same Patch Of Cloud

A cloud changes shape, drifts with the wind, and has soft edges. To compare cloud images over time, the computer needs to recognise whether it is looking at the same patch.

The project used an image-matching idea called **normalised cross correlation**, or NCC. In simple terms:

1. Remember a small patch of an image.
2. Slide that patch over the next image.
3. Score each possible position.
4. Keep the position where the bright and dark pattern matches best.

In my real project, NCC was used to track the **anti-solar point**, an optical reference point opposite the Sun. Once the computer knew where that point was, it could work out the scattering angle for nearby cloud pixels. Three visual-line-of-sight flights were made on the fieldwork morning; the third flight provided the three usable video windows for droplet-size retrieval.

<div class="row mt-3">
  <div class="col-sm mt-3 mt-md-0">
    {% include video.liquid path="assets/video/projects/flying-cloud-detective/kernel-tracking-preview.mp4" class="img-fluid rounded z-depth-1" controls=true muted=true %}
  </div>
  <div class="col-sm mt-3 mt-md-0">
    {% include video.liquid path="assets/video/projects/flying-cloud-detective/detection-overlay-preview.mp4" class="img-fluid rounded z-depth-1" controls=true muted=true %}
  </div>
</div>
<div class="caption">
  Intention: show the algorithm working on real flight data. Left: a short preview of the kernel/NCC-style tracking output, where yellow markers follow optical features in the cloud image. Right: a short detection-overlay preview from the processed flight video. Sources: trimmed from <code>kernel_tracking_annotated.mp4</code> and <code>detection_overlay.mp4</code> in the Flight 3 cloudbow detection output folder.
</div>

For a hands-on version of the tracking idea, see my outreach activity:
<a class="btn btn-sm btn-outline-primary" href="{{ '/blog/2026/dyson-day-drone-design-ncc/' | relative_url }}">Try the NCC demo</a>

## 4. From Hidden Cloudbow To Droplet Size

When sunlight enters tiny water droplets, the light scatters. Some of that scattered light becomes **polarised**, meaning the light waves are more strongly lined up in one direction. Around certain viewing angles, clouds can produce a faint rainbow-like polarisation pattern called the **cloudbow**.

The important part is this: different droplet sizes create slightly different cloudbow patterns. That turns the cloud into a kind of fingerprint problem.

The retrieval pipeline worked like this:

1. The polarisation camera measured light from the cloud.
2. The image was converted into a polarisation signal.
3. The scattering angle of each cloud pixel was estimated.
4. The measured cloudbow pattern was compared with many simulated patterns.
5. The closest simulated pattern gave an estimate of droplet size.

<div class="row justify-content-sm-center">
  <div class="col-sm-8 mt-3 mt-md-0">
    {% include figure.liquid path="assets/img/projects/flying-cloud-detective/cloud-frame-scattering-rings.png" title="Cloud frame with scattering-angle rings" class="img-fluid rounded z-depth-1" %}
  </div>
</div>
<div class="caption">
  Intention: make the geometry visible. The yellow cross marks the tracked anti-solar point. The red rings mark scattering-angle contours, and the coloured cloud overlay shows the processed polarisation signal used for retrieval. Source: final report Figure 10, originally exported as <code>image239.png</code>.
</div>

<div class="row justify-content-sm-center">
  <div class="col-sm-9 mt-3 mt-md-0">
    {% include figure.liquid path="assets/img/projects/flying-cloud-detective/lut-fit-example.png" title="Lookup-table fit example" class="img-fluid rounded z-depth-1" %}
  </div>
</div>
<div class="caption">
  Intention: show the "fingerprint matching" step for readers who want one technical plot. The blue points are measured cloud data; the orange curve is the best matching lookup-table simulation. In this example the fitted effective radius is about 4.82 micrometres. Source: final report Figure 20, originally exported as <code>image356.png</code>.
</div>

### Go Deeper: The LUT Explorer

The lookup table is the book of possible cloud fingerprints. Each entry says, "if droplets had this average size and this spread, the polarised cloudbow would look like this."

Interested students can move the sliders in the interactive explorer and watch how the predicted cloudbow curve changes:

<div class="row justify-content-sm-center">
  <div class="col-sm-8 mt-3 mt-md-0">
    {% include figure.liquid path="assets/img/projects/flying-cloud-detective/cloudbow-lut-thumb.png" title="Cloudbow LUT explorer preview" class="img-fluid rounded z-depth-1" %}
  </div>
</div>
<div class="caption">
  Intention: preview the optional advanced interactive tool. This thumbnail belongs to the existing Cloudbow Polarisation LUT Explorer project and is used here as a signpost for students who want to explore the lookup-table idea with sliders.
</div>

<p>
  <a class="btn btn-sm btn-outline-primary" href="{{ '/cloudbow-lut/' | relative_url }}">Explore the interactive LUT</a>
  <a class="btn btn-sm btn-outline-secondary" href="{{ '/projects/10_cloudbow_lut/' | relative_url }}">Read the technical project page</a>
</p>

<details class="cloud-case-details">
  <summary>What does the LUT actually compare?</summary>
  <p>The project used simulated Mie-scattering curves for many possible droplet size distributions. The measured polarisation signal from the cloud was compared against those curves. A lower fitting error meant the measured curve and the simulated curve looked more alike.</p>
</details>

## 5. What The Project Found

The headline result was that different retrieval methods agreed on a droplet effective radius close to **5 micrometres**, with effective variance around **0.05**. The multi-frame method reached an estimated spatial resolution of about **3 m by 3 m** and a time resolution of about **15 seconds**. The simpler single-frame method assumed the cloud was more uniform across the image, giving a coarser estimated resolution of about **200 m by 160 m**.

That does not mean the problem is solved. Real clouds are messy. Drone motion, camera calibration, viewing geometry, cloud movement, and sunlight all affect the signal. But the project showed that a low-cost drone-borne polarisation camera can collect useful cloudbow-region measurements and retrieve physically plausible droplet sizes.

For school students, the most important lesson is not a single number. It is the way the engineering pieces fit together:

- physics explains why droplets leave a light-scattering fingerprint;
- hardware collects the raw data;
- image tracking keeps the geometry consistent;
- code compares measurements with simulations;
- field testing reveals which assumptions survive contact with real weather.

## Asset Use Checklist

These are the assets used on this page and why I chose them:

| Page asset | Original source | Intended use |
| --- | --- | --- |
| <code>drone-camera-assembly.jpg</code> | Final report Figure 5, <code>image153.jpg</code> | Main project thumbnail and hardware photo; lets students see the real drone payload. |
| <code>payload-exploded-view.png</code> | Final report Figure 4, <code>image152.png</code> | Explains the instrument stack: camera, lens, Raspberry Pi, SSD, battery, and protective cage. |
| <code>fieldwork-site-topography.png</code> | Final report Figure 6, <code>image155.png</code> | Shows the real outdoor location and why terrain/low cloud mattered. |
| <code>cloud-frame-scattering-rings.png</code> | Final report Figure 10, <code>image239.png</code> | Shows the anti-solar point, scattering-angle rings, and processed cloud image in one visual. |
| <code>lut-fit-example.png</code> | Final report Figure 20, <code>image356.png</code> | Gives a single "measured curve versus model curve" example for the cloud fingerprint idea. |
| <code>cloudbow-lut-thumb.png</code> | Existing site asset <code>assets/img/project_thumbnails/cloudbow_lut_thumb.png</code> | Previews the optional interactive LUT explorer linked from the school resource. |
| <code>kernel-tracking-preview.mp4</code> | Trimmed from <code>kernel_tracking_annotated.mp4</code> | Shows tracking on real flight imagery without embedding the full 36 MB analysis video. |
| <code>detection-overlay-preview.mp4</code> | Trimmed from <code>detection_overlay.mp4</code> | Shows the processed detection overlay without embedding the full 32 MB analysis video. |

<style>
  .cloud-question {
    border: 1px solid var(--global-divider-color);
    border-radius: 8px;
    padding: 1rem;
    margin: 1.25rem 0 1.5rem;
    background: var(--global-card-bg-color);
  }

  .cloud-question p {
    margin-bottom: 0.75rem;
  }

  .cloud-question button {
    border: 1px solid var(--global-theme-color);
    border-radius: 6px;
    background: transparent;
    color: var(--global-theme-color);
    padding: 0.45rem 0.7rem;
    margin: 0 0.4rem 0.55rem 0;
    cursor: pointer;
  }

  .cloud-question button.is-selected {
    background: var(--global-theme-color);
    color: var(--global-bg-color);
  }

  .cloud-case-details {
    border-left: 3px solid var(--global-theme-color);
    padding-left: 0.9rem;
    margin: 1rem 0 1.5rem;
  }

  .cloud-case-details summary {
    cursor: pointer;
    font-weight: 600;
  }

  @media (max-width: 576px) {
    .cloud-question button {
      width: 100%;
      margin-right: 0;
    }
  }
</style>

<script>
  (() => {
    const box = document.getElementById("cloud-question");
    if (!box) return;

    const result = document.getElementById("cloud-question-result");
    const buttons = box.querySelectorAll("button[data-answer]");

    buttons.forEach((button) => {
      button.addEventListener("click", () => {
        buttons.forEach((other) => other.classList.remove("is-selected"));
        button.classList.add("is-selected");

        if (button.dataset.answer === "small") {
          result.textContent = "Yes. Many smaller droplets usually create a brighter cloud because they provide more total surface area for scattering sunlight.";
        } else {
          result.textContent = "This cloud can still be bright, but if the same water is split into many smaller droplets, it usually reflects more sunlight.";
        }
      });
    });
  })();
</script>
