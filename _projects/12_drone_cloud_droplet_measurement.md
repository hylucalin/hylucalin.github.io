---
layout: page
title: "Measuring Cloud Droplets From a Drone"
description: A school-level case study about using drones, polarised light, data storage, and code to measure tiny cloud droplets.
img: assets/img/projects/drone-cloud-droplet-measurement/drone-camera-assembly.jpg
importance: 0
category: uni
---

My fourth-year project asked a simple question with a surprisingly tricky answer:

> Can a small drone measure the size of tiny droplets inside low cloud or fog?

That matters because clouds help control Earth's temperature. A bright cloud reflects sunlight back to space, while a darker cloud lets more sunlight warm the surface. One thing that changes cloud brightness is the size of the droplets inside it. If the same amount of cloud water is split into many smaller droplets, the cloud can become brighter. Climate scientists call this the **Twomey effect**.

The full research project used a drone, a small onboard computer, fast storage, and a special colour polarisation camera to look for a hidden rainbow-like signal in cloud. The submitted report used data from valley fog in the Yorkshire Dales on 8 March 2026. This page tells the easier version: how engineers turn a flying camera into a scientific instrument.

The story has three layers:

1. **Why DSD matters:** droplet size affects cloud brightness and climate.
2. **How DSD can be seen indirectly:** droplets create a polarised cloudbow feature.
3. **How the solution was built:** hardware, data storage, tracking, calibration, and lookup-table fitting turn flight video into DSD estimates.

<div class="cloud-question" id="cloud-question">
  <div>
    <strong>Quick thought experiment</strong>
    <p>Two clouds contain the same amount of liquid water. Which one would you expect to reflect more sunlight?</p>
  </div>
  <button type="button" data-answer="large">Fewer large droplets</button>
  <button type="button" data-answer="small">Many small droplets</button>
  <p id="cloud-question-result" aria-live="polite">Choose an answer to reveal the idea.</p>
</div>

### Pocket Glossary

| Word | School-level meaning |
| --- | --- |
| Cloud droplet | A tiny liquid-water sphere floating inside cloud or fog. |
| DSD | Short for droplet size distribution: how many small, medium, and large droplets are in the cloud. |
| Effective radius | A useful "average droplet size" for predicting how the cloud scatters light. |
| Effective variance | A number describing how mixed the droplet sizes are. A small value means most droplets are similar; a large value means the sizes are more spread out. |
| Polarisation | The direction in which a light wave wiggles. Ordinary sunlight contains many wiggle directions mixed together. Polarised light has more of one preferred wiggle direction. |
| Linear polarisation intensity | How strongly the camera sees light with one preferred wiggle direction. In this project, the important cloud signal appears as a ring or arc of stronger linear polarisation. |
| Anti-solar point, or ASP | The point in the image directly opposite the Sun. It acts like the centre mark for measuring scattering angles. |
| Cloudbow | A faint rainbow-like pattern in polarised light from cloud droplets. It is usually much easier to see in a polarisation measurement than in an ordinary photo. |
| LUT | Short for lookup table: a library of simulated cloudbow patterns used for matching measured data. |
| USB | A common standard for connecting devices such as storage drives, cameras, keyboards, and chargers. The plug shape and the data speed are separate things. |
| MB/s | Megabytes per second, a measure of how quickly data can be read or written. A video recorder needs enough write speed, not just enough storage space. |
| BOT and UASP | Two USB storage protocols. BOT is older and simpler. UASP can queue work more efficiently, so it is often better for fast storage. |

## 1. The Big Question

Cloud droplets are tiny, often only a few micrometres across. A micrometre is one millionth of a metre, so a typical cloud droplet can be much smaller than the width of a human hair.

Instead of measuring every droplet one by one, cloud scientists often describe a cloud using:

- **Droplet size distribution:** how many small, medium, and large droplets there are.
- **Effective radius:** a useful average droplet size for light scattering.
- **Effective variance:** how spread out the droplet sizes are.

Satellites can estimate cloud droplet size over large areas, but their pixels are usually far larger than a small patch of cloud. My project explored whether a drone could measure cloud droplets at much finer local detail, especially for small low clouds or fog that change quickly.

<div class="row justify-content-sm-center">
  <div class="col-sm-10 mt-3 mt-md-0">
    {% include figure.liquid loading="eager" path="assets/img/projects/drone-cloud-droplet-measurement/fieldwork-site-topography.png" title="Fieldwork site topography" class="img-fluid rounded z-depth-1" %}
  </div>
</div>
<div class="caption">
  Intention: show that this was a real outdoor field experiment, not just a simulation. This map marks the March 8 fieldwork site in hilly terrain where low cloud or valley fog could form. Source: final report Figure 6, originally exported as <code>image155.png</code>.
</div>

## 2. The Optical Feature That Reveals DSD

Light behaves like a wave. One way to picture a light wave is to imagine a tiny sideways wiggle travelling through space. In ordinary sunlight, many wiggle directions are mixed together. When sunlight scatters from a water droplet, the scattered light can become more organised: more of it wiggles in one preferred direction. That is called **polarisation**.

An ordinary camera mainly records brightness and colour. A polarisation camera records extra information about the wiggle direction of the light. That extra information is useful because cloud droplets do not scatter all directions equally. They leave a faint pattern in the polarised part of the light.

<div class="polarisation-demo" aria-label="Simple diagram comparing mixed and linearly polarised light">
  <div class="polarisation-demo__scene">
    <strong>Ordinary sunlight</strong>
    <div class="polarisation-demo__bundle mixed" aria-hidden="true">
      <span></span><span></span><span></span><span></span><span></span>
    </div>
  </div>
  <div class="polarisation-demo__scene">
    <strong>More linearly polarised light</strong>
    <div class="polarisation-demo__bundle linear" aria-hidden="true">
      <span></span><span></span><span></span><span></span><span></span>
    </div>
  </div>
</div>

The project used **linear polarisation intensity**, which you can think of as "how much of the measured light has a preferred wiggle direction". The cloudbow signal is not just a colourful arc in a normal photo; in this project, it is a bright arc or ring in that linear polarisation signal.

The Sun was behind the drone-camera direction during the useful measurements. In that geometry, the image has a special reference point called the **anti-solar point**, or ASP: the point directly opposite the Sun. Around the ASP, cloud droplets can create a ring or arc of maximum linear polarisation intensity. That ring is the cloudbow fingerprint.

The ring changes when the droplet size distribution changes:

- a larger effective radius moves the bright cloudbow feature farther from the ASP;
- a larger effective variance makes the feature broader and smoother;
- a narrow droplet-size distribution gives a sharper fingerprint.

Try moving the sliders. This is a simplified teaching model, not the exact physics code from the final report.

<div class="cloudbow-lab" id="cloudbow-lab">
  <div class="cloudbow-lab__visual" aria-label="Interactive cloudbow ring model">
    <div class="cloudbow-lab__cloud" id="droplet-demo" aria-hidden="true"></div>
    <div class="cloudbow-lab__asp">ASP</div>
    <div class="cloudbow-lab__ring" id="cloudbow-ring" aria-hidden="true"></div>
  </div>
  <div class="cloudbow-lab__controls">
    <label for="reff-control">Effective radius: <strong id="reff-label">5.0</strong> micrometres</label>
    <input id="reff-control" type="range" min="3" max="12" step="0.5" value="5">
    <label for="veff-control">Effective variance: <strong id="veff-label">0.05</strong></label>
    <input id="veff-control" type="range" min="0.03" max="0.14" step="0.01" value="0.05">
    <p id="cloudbow-lab-note" aria-live="polite"></p>
  </div>
</div>

## 3. Turning The Optical Feature Into Numbers

The project then turned the cloudbow fingerprint into DSD numbers. First, the software tracked the ASP. Then it estimated the **scattering angle** of each cloud pixel. The scattering angle is the angle between the incoming sunlight and the light that travels from the cloud droplet into the camera.

Different droplet sizes create slightly different polarisation patterns at different scattering angles. That turns the cloud into a fingerprint-matching problem.

The scientific pipeline worked like this:

1. Measure cloud light with a polarisation camera.
2. Convert the raw image into a linear polarisation signal.
3. Find the ASP and work out the scattering angle of cloud pixels.
4. Reconstruct the measured cloudbow profile.
5. Compare that profile with many simulated profiles in a lookup table.
6. Choose the closest match to estimate effective radius and effective variance.

<div class="row justify-content-sm-center">
  <div class="col-sm-8 mt-3 mt-md-0">
    {% include figure.liquid path="assets/img/projects/drone-cloud-droplet-measurement/cloud-frame-scattering-rings.png" title="Cloud frame with scattering-angle rings" class="img-fluid rounded z-depth-1" %}
  </div>
</div>
<div class="caption">
  Intention: make the geometry visible. The yellow cross marks the tracked anti-solar point. The red rings mark scattering-angle contours, and the coloured cloud overlay shows the processed polarisation signal used for retrieval. Source: final report Figure 10, originally exported as <code>image239.png</code>.
</div>

<div class="row justify-content-sm-center">
  <div class="col-sm-9 mt-3 mt-md-0">
    {% include figure.liquid path="assets/img/projects/drone-cloud-droplet-measurement/lut-fit-example.png" title="Lookup-table fit example" class="img-fluid rounded z-depth-1" %}
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
    {% include figure.liquid path="assets/img/projects/drone-cloud-droplet-measurement/cloudbow-lut-thumb.png" title="Cloudbow LUT explorer preview" class="img-fluid rounded z-depth-1" %}
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

## 4. Building The Flying Measurement System

After the optical idea was clear, the engineering job was to build a platform that could collect the right kind of data in real cloud or fog. The drone was not just taking pretty videos. It had to carry a measurement system:

| Part | What it did | Why it mattered |
| --- | --- | --- |
| Drone airframe | Lifted the payload and moved the camera into cloud/fog viewing positions. | The instrument had to be light enough to fly and stable enough to collect useful images. |
| Polarisation camera | Measured brightness, colour, and the direction information in scattered light. | Ordinary images miss much of the faint cloudbow signal. |
| Lens | Set how much of the cloud scene fitted into each image. | A wide view helps capture the cloudbow geometry, but the image must still have enough detail. |
| Onboard computer | Controlled the camera, saved data, and provided a practical field interface. | The drone could not depend on a full laptop during flight. |
| Fast storage drive | Stored the raw image stream while the drone was recording. | If storage was too slow, frames would be incomplete or lost. |
| Batteries and power electronics | Supplied the voltages needed by the drone, computer, and camera. | Flying instruments have to manage power safely and separately from data. |
| Protective mount | Held the camera, computer, drive, and cables in a repeatable position. | The payload needed to survive vibration, cable strain, and rough landings. |

The engineering challenge was not simply "attach a camera". The camera had to be held rigidly, the cables had to stay away from the propellers, the mass had to remain close to the drone centreline, and the data had to survive a rough landing.

The camera recorded high-bit-depth image data at up to about 10 frames per second in the field. "High-bit-depth" means each pixel stores more brightness levels than a normal 8-bit picture, which is useful for faint signals but creates bigger files. Before the cloud data could be trusted, the camera system was calibrated with a printed pattern, and a practical vignetting correction was applied so that darker image corners would not be mistaken for cloud physics.

<div class="row justify-content-sm-center">
  <div class="col-sm-6 mt-3 mt-md-0">
    {% include figure.liquid loading="eager" path="assets/img/projects/drone-cloud-droplet-measurement/drone-camera-assembly.jpg" title="Drone and camera assembly" class="img-fluid rounded z-depth-1" %}
  </div>
  <div class="col-sm-6 mt-3 mt-md-0">
    {% include figure.liquid loading="eager" path="assets/img/projects/drone-cloud-droplet-measurement/payload-exploded-view.png" title="Payload exploded view" class="img-fluid rounded z-depth-1" %}
  </div>
</div>
<div class="caption">
  Intention: connect the accessible story to the actual hardware. Left: the completed drone-camera assembly on a bench. Right: the exploded CAD view showing the camera, lens, onboard computer, power board, storage drive, battery, and protective cage. Sources: final report Figure 5 (<code>image153.jpg</code>) and Figure 4 (<code>image152.png</code>).
</div>

### Try The Payload Design Challenge

Imagine you are given a fixed budget and can choose only some of these parts: camera, GPS, IMU, gimbal, laser range finder, onboard computer. Which ones would you pick if the drone had to track a patch of cloud?

There is no perfect answer. A camera is light and useful, but it does not directly tell you distance. GPS helps locate the drone, but not the cloud patch inside the image. An onboard computer can run image tracking, but it adds weight and power demand. Engineering is often about choosing the least-bad set of clues and understanding what each one can and cannot tell you.

## 5. Technical Steps From Flight Video To DSD

### Step 1: Store The Data Fast Enough

One surprisingly important part of the project was not the drone or the cloud physics. It was the storage drive.

The camera produced a stream of raw image data. That meant the storage device had to keep writing continuously while the drone was flying. A product label such as "USB 3.0" was not enough information, because there are three different questions hiding inside that label:

- **Connector shape:** USB-A and USB-C describe the plug shape. They do not guarantee the speed.
- **Bus speed:** USB 2.0, USB 3.0, and USB 3.2 describe how fast the connection can be in theory.
- **Storage protocol:** BOT and UASP describe how the computer talks to the drive. In my tests, UASP was much better for fast recording.

From the project log, the recording needed roughly **60 MB/s** in an early laptop test, and the final payload could sometimes burst up to about **318 MB/s** while saving frames. That meant the safe choice needed much more than 60 MB/s on a short benchmark.

<div class="storage-challenge" id="storage-challenge">
  <div>
    <strong>Procurement challenge</strong>
    <p>You need to record scientific images without dropped frames. Which storage would you choose?</p>
  </div>
  <table>
    <thead>
      <tr>
        <th>Candidate</th>
        <th>Protocol clue</th>
        <th>Measured result from the project log</th>
      </tr>
    </thead>
    <tbody>
      <tr>
        <td>Department USB 3.0 stick</td>
        <td>BOT, reported on a 480M bus</td>
        <td>68 MB/s read, 4.4 MB/s write; 7.1 MB/s after formatting</td>
      </tr>
      <tr>
        <td>UASP USB 3.2 Gen 1 stick</td>
        <td>UASP, reported on a 5000M bus</td>
        <td>370 MB/s read, 90 MB/s write</td>
      </tr>
      <tr>
        <td>External SSD</td>
        <td>Fast solid-state storage</td>
        <td>984.5 MB/s read, 381.2 MB/s write in a 64 GB test</td>
      </tr>
    </tbody>
  </table>
  <button type="button" data-storage="slow">Choose the USB 3.0 stick</button>
  <button type="button" data-storage="medium">Choose the UASP stick</button>
  <button type="button" data-storage="ssd">Choose the SSD</button>
  <p id="storage-challenge-result" aria-live="polite">Choose a storage option to see the engineering trade-off.</p>
</div>

The `480M` and `5000M` clues are bus speeds reported by the computer in megabits per second. The measured storage speeds are in megabytes per second, written as MB/s. One byte is eight bits, and real devices never reach the full theoretical bus speed, so practical testing matters.

The final choice was the SSD. The UASP stick was much better than the slow USB stick, but the SSD gave more safety margin for long recordings. A later payload test found that 12-bit recording at 10 frames per second worked for a 1200 second run, while 13 frames per second caused many incomplete images.

### Step 2: Follow The Same Patch Of Cloud

A cloud changes shape, drifts with the wind, and has soft edges. To compare cloud images over time, the computer needs to recognise whether it is looking at the same patch.

The project used an image-matching idea called **normalised cross correlation**, or NCC. In simple terms:

1. Remember a small patch of an image.
2. Slide that patch over the next image.
3. Score each possible position.
4. Keep the position where the bright and dark pattern matches best.

In my real project, NCC was used to track the ASP and useful optical features. Once the computer knew where that point was, it could work out the scattering angle for nearby cloud pixels. Three visual-line-of-sight flights were made on the fieldwork morning; the third flight provided the three usable video windows for droplet-size retrieval.

<div class="row mt-3">
  <div class="col-sm mt-3 mt-md-0">
    {% include video.liquid path="assets/video/projects/drone-cloud-droplet-measurement/kernel-tracking-preview.mp4" class="img-fluid rounded z-depth-1" controls=true muted=true %}
  </div>
  <div class="col-sm mt-3 mt-md-0">
    {% include video.liquid path="assets/video/projects/drone-cloud-droplet-measurement/detection-overlay-preview.mp4" class="img-fluid rounded z-depth-1" controls=true muted=true %}
  </div>
</div>
<div class="caption">
  Intention: show the algorithm working on real flight data. Left: a short preview of the kernel/NCC-style tracking output, where yellow markers follow optical features in the cloud image. Right: a short detection-overlay preview beginning at 327.2 seconds in the full processed flight video, chosen to match the kernel-detection example. Sources: trimmed from <code>kernel_tracking_annotated.mp4</code> and <code>detection_overlay.mp4</code> in the Flight 3 cloudbow detection output folder.
</div>

For a hands-on version of the tracking idea, see my outreach activity:
<a class="btn btn-sm btn-outline-primary" href="{{ '/blog/2026/dyson-day-drone-design-ncc/' | relative_url }}">Try the NCC demo</a>

### Step 3: Compare With The Lookup Table

The last technical step was to keep only trustworthy cloud pixels, reconstruct the polarisation profile, and compare it with the lookup table. That is where the optical feature became final DSD parameters rather than just a bright ring in an image.

## 6. What The Project Found

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
| <code>payload-exploded-view.png</code> | Final report Figure 4, <code>image152.png</code> | Explains the instrument stack: camera, lens, onboard computer, storage drive, battery, and protective cage. |
| <code>fieldwork-site-topography.png</code> | Final report Figure 6, <code>image155.png</code> | Shows the real outdoor location and why terrain/low cloud mattered. |
| <code>cloud-frame-scattering-rings.png</code> | Final report Figure 10, <code>image239.png</code> | Shows the anti-solar point, scattering-angle rings, and processed cloud image in one visual. |
| <code>lut-fit-example.png</code> | Final report Figure 20, <code>image356.png</code> | Gives a single "measured curve versus model curve" example for the cloud fingerprint idea. |
| <code>cloudbow-lut-thumb.png</code> | Existing site asset <code>assets/img/project_thumbnails/cloudbow_lut_thumb.png</code> | Previews the optional interactive LUT explorer linked from the school resource. |
| <code>kernel-tracking-preview.mp4</code> | Trimmed from <code>kernel_tracking_annotated.mp4</code> | Shows tracking on real flight imagery without embedding the full 36 MB analysis video. |
| <code>detection-overlay-preview.mp4</code> | Trimmed from <code>detection_overlay.mp4</code>, starting at 327.2 seconds | Shows the processed detection overlay without embedding the full 32 MB analysis video; the time window is intended to match the kernel-detection choice. |

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

  .storage-challenge {
    border: 1px solid var(--global-divider-color);
    border-radius: 8px;
    padding: 1rem;
    margin: 1.25rem 0 1.5rem;
    background: var(--global-card-bg-color);
  }

  .storage-challenge table {
    width: 100%;
    margin: 0.75rem 0 1rem;
    border-collapse: collapse;
    font-size: 0.94rem;
  }

  .storage-challenge th,
  .storage-challenge td {
    border: 1px solid var(--global-divider-color);
    padding: 0.55rem;
    vertical-align: top;
  }

  .storage-challenge th {
    font-weight: 700;
  }

  .storage-challenge button {
    border: 1px solid var(--global-theme-color);
    border-radius: 6px;
    background: transparent;
    color: var(--global-theme-color);
    padding: 0.45rem 0.7rem;
    margin: 0 0.4rem 0.55rem 0;
    cursor: pointer;
  }

  .storage-challenge button.is-selected {
    background: var(--global-theme-color);
    color: var(--global-bg-color);
  }

  .polarisation-demo {
    display: grid;
    gap: 0.75rem;
    margin: 1rem 0 1.5rem;
  }

  .polarisation-demo__scene {
    display: grid;
    grid-template-columns: minmax(120px, 170px) 1fr;
    gap: 1rem;
    align-items: center;
    border: 1px solid var(--global-divider-color);
    border-radius: 8px;
    padding: 0.85rem;
    background: var(--global-card-bg-color);
  }

  .polarisation-demo__bundle {
    position: relative;
    height: 88px;
    overflow: hidden;
    border-radius: 8px;
    background:
      linear-gradient(90deg, rgba(255, 255, 255, 0.04), rgba(255, 255, 255, 0.22)),
      rgba(130, 175, 215, 0.12);
  }

  .polarisation-demo__bundle span {
    position: absolute;
    left: 50%;
    top: 50%;
    width: 86px;
    height: 3px;
    margin-left: -43px;
    background: var(--global-theme-color);
    border-radius: 999px;
    transform-origin: center;
    opacity: 0.75;
  }

  .polarisation-demo__bundle.mixed span:nth-child(1) {
    transform: rotate(0deg);
  }

  .polarisation-demo__bundle.mixed span:nth-child(2) {
    transform: rotate(36deg);
  }

  .polarisation-demo__bundle.mixed span:nth-child(3) {
    transform: rotate(72deg);
  }

  .polarisation-demo__bundle.mixed span:nth-child(4) {
    transform: rotate(108deg);
  }

  .polarisation-demo__bundle.mixed span:nth-child(5) {
    transform: rotate(144deg);
  }

  .polarisation-demo__bundle.linear span:nth-child(1) {
    transform: translateY(-20px);
  }

  .polarisation-demo__bundle.linear span:nth-child(2) {
    transform: translateY(-10px);
  }

  .polarisation-demo__bundle.linear span:nth-child(3) {
    transform: translateY(0);
  }

  .polarisation-demo__bundle.linear span:nth-child(4) {
    transform: translateY(10px);
  }

  .polarisation-demo__bundle.linear span:nth-child(5) {
    transform: translateY(20px);
  }

  .cloudbow-lab {
    display: grid;
    grid-template-columns: minmax(240px, 1fr) minmax(220px, 0.72fr);
    gap: 1rem;
    align-items: center;
    border: 1px solid var(--global-divider-color);
    border-radius: 8px;
    padding: 1rem;
    margin: 1rem 0 1.5rem;
    background: var(--global-card-bg-color);
  }

  .cloudbow-lab__visual {
    position: relative;
    width: min(100%, 500px);
    aspect-ratio: 1;
    min-height: 280px;
    margin: 0 auto;
    overflow: hidden;
    border-radius: 8px;
    background:
      radial-gradient(circle at center, rgba(255, 255, 255, 0.2) 0 2px, transparent 3px),
      radial-gradient(circle at center, rgba(255, 223, 128, 0.18), transparent 18%),
      linear-gradient(145deg, rgba(83, 135, 180, 0.2), rgba(136, 168, 185, 0.08));
  }

  .cloudbow-lab__cloud {
    position: absolute;
    inset: 0;
  }

  .cloudbow-lab__cloud .droplet {
    position: absolute;
    border-radius: 50%;
    background: rgba(224, 240, 255, 0.72);
    box-shadow: 0 0 10px rgba(160, 205, 235, 0.35);
  }

  .cloudbow-lab__asp {
    position: absolute;
    left: 50%;
    top: 50%;
    z-index: 2;
    width: 54px;
    height: 54px;
    display: grid;
    place-items: center;
    transform: translate(-50%, -50%);
    border-radius: 50%;
    border: 1px solid rgba(255, 210, 80, 0.95);
    background: rgba(25, 35, 45, 0.78);
    color: #fff;
    font-size: 0.78rem;
    font-weight: 700;
  }

  .cloudbow-lab__ring {
    position: absolute;
    left: 50%;
    top: 50%;
    z-index: 1;
    width: 150px;
    height: 150px;
    transform: translate(-50%, -50%);
    border: 10px solid rgba(255, 188, 82, 0.78);
    border-radius: 50%;
    box-shadow:
      0 0 18px rgba(255, 225, 135, 0.85),
      inset 0 0 14px rgba(255, 245, 190, 0.45);
    transition: width 180ms ease, height 180ms ease, border-width 180ms ease, filter 180ms ease, opacity 180ms ease;
  }

  .cloudbow-lab__controls label {
    display: block;
    margin-top: 0.6rem;
    font-weight: 600;
  }

  .cloudbow-lab__controls input[type="range"] {
    width: 100%;
    margin: 0.3rem 0 0.55rem;
  }

  #cloudbow-lab-note {
    margin: 0.5rem 0 0;
  }

  @media (max-width: 576px) {
    .polarisation-demo__scene,
    .cloudbow-lab {
      grid-template-columns: 1fr;
    }

    .cloud-question button {
      width: 100%;
      margin-right: 0;
    }

    .storage-challenge {
      overflow-x: auto;
    }

    .storage-challenge button {
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

  (() => {
    const box = document.getElementById("storage-challenge");
    if (!box) return;

    const result = document.getElementById("storage-challenge-result");
    const buttons = box.querySelectorAll("button[data-storage]");

    const messages = {
      slow: "This would fail. The label says USB 3.0, but the measured write speed was far below the recording requirement.",
      medium: "This is much better because UASP and the faster bus help, but 90 MB/s write speed leaves little margin for long scientific recordings.",
      ssd: "Best choice. The SSD had enough measured write speed and enough margin for bursts during real camera recording."
    };

    buttons.forEach((button) => {
      button.addEventListener("click", () => {
        buttons.forEach((other) => other.classList.remove("is-selected"));
        button.classList.add("is-selected");
        result.textContent = messages[button.dataset.storage];
      });
    });
  })();

  (() => {
    const lab = document.getElementById("cloudbow-lab");
    if (!lab) return;

    const reffControl = document.getElementById("reff-control");
    const veffControl = document.getElementById("veff-control");
    const reffLabel = document.getElementById("reff-label");
    const veffLabel = document.getElementById("veff-label");
    const ring = document.getElementById("cloudbow-ring");
    const dropletDemo = document.getElementById("droplet-demo");
    const note = document.getElementById("cloudbow-lab-note");
    const clamp = (value, min, max) => Math.min(max, Math.max(min, value));

    const updateCloudbowLab = () => {
      const reff = Number.parseFloat(reffControl.value);
      const veff = Number.parseFloat(veffControl.value);
      const diameter = 120 + (reff - 3) * 19;
      const borderWidth = 7 + veff * 68;
      const blur = veff * 72;
      const opacity = clamp(0.92 - (veff - 0.03) * 3.2, 0.52, 0.92);

      reffLabel.textContent = reff.toFixed(1);
      veffLabel.textContent = veff.toFixed(2);
      ring.style.width = `${diameter}px`;
      ring.style.height = `${diameter}px`;
      ring.style.borderWidth = `${borderWidth}px`;
      ring.style.filter = `blur(${blur}px)`;
      ring.style.opacity = opacity.toFixed(2);

      const dropletCount = Math.round(clamp(42 - (reff - 3) * 2.4, 16, 42));
      const baseSize = 5 + reff * 1.5;
      dropletDemo.innerHTML = "";

      for (let index = 0; index < dropletCount; index += 1) {
        const droplet = document.createElement("span");
        const spreadFactor = 1 + (((index * 17) % 9) - 4) * veff * 0.9;
        const size = clamp(baseSize * spreadFactor, 5, 26);
        droplet.className = "droplet";
        droplet.style.left = `${5 + ((index * 37) % 88)}%`;
        droplet.style.top = `${6 + ((index * 53) % 84)}%`;
        droplet.style.width = `${size}px`;
        droplet.style.height = `${size}px`;
        droplet.style.opacity = `${clamp(0.45 + ((index * 11) % 30) / 100, 0.45, 0.75)}`;
        dropletDemo.appendChild(droplet);
      }

      note.textContent = "Larger effective radius pushes the bright ring farther from the ASP. Higher effective variance makes the ring fuzzier because many droplet sizes overlap.";
    };

    reffControl.addEventListener("input", updateCloudbowLab);
    veffControl.addEventListener("input", updateCloudbowLab);
    updateCloudbowLab();
  })();
</script>
