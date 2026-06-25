---
layout: page
title: "Measuring Cloud Droplets From a Drone"
description: An accessible case study about using drones, polarised light, data storage, and code to measure tiny cloud droplets.
img: assets/img/projects/drone-cloud-droplet-measurement/drone-camera-assembly.jpg
importance: 0
category: cam-4th-year-project
---

This material is primarily prepared for the Dyson Day outreach event. It is intended to be an accessible, interactive case study for people to get to know more about my project. To see others' projects this year and past projects, please visit <a href="https://www.dysoncentre.eng.cam.ac.uk/james-dyson-foundation-undergraduate-bursary-historical-projects-collection">James Dyson Foundation Bursary Historical Projects Collection</a>.

My fourth-year project asked a simple question with a surprisingly tricky answer:

> Can a small drone measure the size of tiny droplets inside low cloud or fog?

Two facts drive the project. First, clouds help control Earth's temperature because bright clouds reflect sunlight back to space. Second, a cloud's brightness depends strongly on its <span class="term" data-def="Droplet size distribution: a description of how many small, medium, and large droplets are present in a cloud.">droplet size distribution</span>, or DSD: if the same amount of liquid water is split into many smaller droplets, the cloud can become brighter. This is the <span class="term" data-def="The idea that, for the same liquid-water amount, more numerous smaller cloud droplets can increase cloud reflectivity.">Twomey effect</span> <a class="ref-link" href="#ref-twomey1977">[1]</a>.

<div class="cloud-question" id="cloud-question">
  <div>
    <strong>Quick thought experiment</strong>
    <p>Two clouds contain the same amount of liquid water. Which one would you expect to reflect more sunlight?</p>
  </div>
  <button type="button" data-answer="large">Fewer large droplets</button>
  <button type="button" data-answer="small">Many small droplets</button>
  <p id="cloud-question-result" aria-live="polite">Choose an answer to reveal the idea.</p>
</div>

This matters for <span class="term" data-def="A proposed climate intervention in which sea-salt aerosol would be added to some low marine clouds to increase droplet number and cloud reflectivity.">marine cloud brightening</span>, or MCB. Before anything like MCB could be used in the real world, researchers would need to measure how cloud DSD changes over time after an aerosol perturbation, and whether the cloud response really produces the intended brightening rather than being offset by evaporation, mixing, drizzle, or changing weather.

The submitted report used data from valley fog in the Yorkshire Dales National Park on 8 March 2026. The field site was not marine cloud, but it provided a practical low-cloud environment for testing whether a drone-borne polarisation camera could retrieve DSD at very fine spatial and temporal scales.

<div class="row justify-content-sm-center">
  <div class="col-sm-10 mt-3 mt-md-0">
    {% include figure.liquid loading="eager" path="assets/img/projects/drone-cloud-droplet-measurement/fieldwork-site-topography.png" title="Fieldwork site topography" class="img-fluid rounded z-depth-1" %}
  </div>
</div>
<div class="caption">
  Figure 1. Fieldwork site for the 8 March 2026 low-cloud and valley-fog measurements in the Yorkshire Dales, showing why local terrain made low cloud and fog a useful test case.
</div>

The case study follows the same structure as an engineering report: why the measurement matters, what optical signal makes it possible, how the retrieval pipeline works, how the flying instrument was built, what the real data looked like, and what the result means.

<div class="student-prompt">
  <strong>The measurement system</strong>
  <div class="hardware-preview">
    <img src="{{ '/assets/img/projects/drone-cloud-droplet-measurement/drone-camera-assembly.jpg' | relative_url }}" alt="Drone and camera payload assembly">
    <p>The flying instrument combined a pre-built FPV drone, a polarisation camera, a small onboard computer, an SSD, batteries, and a rigid payload mount. The method below explains why each part was needed; the full build is shown in <a href="#flying-system">Section 3</a>.</p>
  </div>
</div>

## 1. Scientific Motivation

<span class="term" data-def="Tiny liquid-water spheres suspended inside cloud or fog.">Cloud droplets</span> are often only a few micrometres across. A micrometre is one millionth of a metre, so many cloud droplets are far smaller than the width of a human hair.

Instead of trying to count every droplet, cloud scientists describe the DSD using compact parameters:

- **<span class="term" data-def="A weighted average droplet radius that is especially useful for predicting how cloud droplets scatter and absorb light.">Effective radius</span>:** a useful average droplet size for light scattering.
- **<span class="term" data-def="A dimensionless measure of how spread out the droplet sizes are. A small value means the droplets are more similar in size.">Effective variance</span>:** how broad or narrow the droplet-size distribution is.

Satellites can estimate cloud droplet size over large areas <a class="ref-link" href="#ref-platnick2017">[2]</a>, but their pixels are usually much larger than a small evolving patch of cloud. Research aircraft can do better, but they are expensive and still not ideal for repeated close-range monitoring. The project therefore tested a lower-cost route: a drone carrying a compact polarisation camera.

## 2. Methodology

### 2.1 Polarisation And The Cloudbow Signal

Light is an electromagnetic wave. A wave is a repeating disturbance that travels: a water wave moves across a pond, while the water surface rises and falls. In a light wave, the changing quantities are the electric and magnetic fields. They oscillate perpendicular to the direction in which the light travels.

For this project, the important part is the electric field. <span class="term" data-def="The orientation of the electric-field oscillation in a light wave.">Polarisation</span> describes the direction in which that electric field oscillates. Ordinary sunlight contains many polarisation directions mixed together. After sunlight scatters from water droplets, some directions can become stronger than others, giving <span class="term" data-def="How strongly the measured light prefers one linear electric-field oscillation direction over another.">linear polarisation intensity</span> <a class="ref-link" href="#ref-bohren1983">[3]</a><a class="ref-link" href="#ref-hansen1974">[4]</a>.

<div class="row align-items-center">
  <div class="col-md-6 mt-3 mt-md-0">
    <img class="img-fluid rounded z-depth-1" src="{{ '/assets/img/projects/drone-cloud-droplet-measurement/polarization-linear-polarizers.gif' | relative_url }}" alt="Animation showing light passing through linear polarisers">
  </div>
  <div class="col-md-6 mt-3 mt-md-0">
    <p>This animation shows light passing through linear polarisers. It gives a visual example of why the orientation of the electric-field oscillation matters when measuring polarised light.</p>
    <p class="caption">Figure 2. Polarised light schematic. GIF credit: Institute of Noetic Sciences, <a href="https://noetic.org/wp-content/uploads/2021/04/Polarization-example-with-linear-polarizers.gif">Polarization example with linear polarizers</a>.</p>
  </div>
</div>

<div class="polarisation-demo" aria-label="Simple diagram comparing mixed and linearly polarised light">
  <div class="polarisation-demo__scene">
    <strong>Ordinary sunlight</strong>
    <small>Many electric-field oscillation directions are mixed.</small>
    <div class="polarisation-demo__bundle mixed" aria-hidden="true">
      <span></span><span></span><span></span><span></span><span></span>
    </div>
  </div>
  <div class="polarisation-demo__scene">
    <strong>More linearly polarised light</strong>
    <small>The electric field has a stronger preferred oscillation direction.</small>
    <div class="polarisation-demo__bundle linear" aria-hidden="true">
      <span></span><span></span><span></span><span></span><span></span>
    </div>
  </div>
</div>

The optical feature used here is the <span class="term" data-def="A rainbow-like angular feature produced when sunlight is scattered by many small cloud droplets. In this project it is detected mainly in linear polarisation, not as a bright ordinary-colour rainbow.">cloudbow</span>. It is related to a rainbow, but cloud droplets are much smaller and the useful signal is often clearest in polarised light. In the cloudbow region, roughly 135 degrees to 165 degrees in scattering angle, the linear polarisation signal changes shape when the DSD changes <a class="ref-link" href="#ref-poertge2023">[5]</a>.

The geometry is centred on the <span class="term" data-def="The image point directly opposite the Sun. It is approximately where the camera or drone shadow would appear on a cloud or on the ground if the surface were visible.">anti-solar point</span>, or ASP. A useful way to picture it is: if the cloud were a screen and the drone shadow could be seen on it, the shadow would lie near the ASP. Around the ASP, points with the same scattering angle form rings. The linear polarisation intensity therefore forms ring-like patterns: each ring contains pixels with approximately the same scattering angle.

The easiest way to connect the optical signal to DSD is to look at the ring of maximum linear polarisation intensity. A larger effective radius tends to shift this cloudbow feature farther from the ASP. A larger effective variance tends to broaden and smooth the feature. That is why the ring can act like a fingerprint of the droplet size distribution.

- a larger effective radius moves the bright cloudbow feature farther from the ASP;
- a larger effective variance makes the feature broader and smoother;
- a narrow droplet-size distribution gives a sharper fingerprint.

Try moving the sliders. This is a simplified teaching model, not the exact physics code from the final report. The droplet preview uses the same broad gamma-distribution idea as the LUT explorer, while the bright ring remains a separate optical sketch.

<div class="student-prompt">
  <strong>Try this</strong>
  <p>Move the effective-radius slider first. What happens to the bright ring? Then increase effective variance. Does the ring become sharper or blurrier?</p>
</div>

<div class="cloudbow-lab" id="cloudbow-lab">
  <div class="cloudbow-lab__visual" aria-label="Interactive cloudbow ring model">
    <div class="cloudbow-lab__asp">ASP</div>
    <div class="cloudbow-lab__ring" id="cloudbow-ring" aria-hidden="true"></div>
  </div>
  <div class="cloudbow-lab__controls">
    <label for="reff-control">Effective radius: <strong id="reff-label">5.0</strong> micrometres</label>
    <input id="reff-control" type="range" min="3" max="12" step="0.5" value="5">
    <label for="veff-control">Effective variance: <strong id="veff-label">0.05</strong></label>
    <input id="veff-control" type="range" min="0.03" max="0.14" step="0.01" value="0.05">
    <canvas id="dsd-bubble-canvas" class="dsd-bubble-canvas" width="420" height="220" aria-label="Animated droplet size distribution preview"></canvas>
    <p id="cloudbow-lab-note" aria-live="polite"></p>
  </div>
</div>

### 2.2 Retrieval Pipeline

The retrieval needs an angular profile: linear polarisation intensity plotted against <span class="term" data-def="The angle between the incoming sunlight direction and the direction from the cloud droplet to the camera. In this project theta is calculated from the ASP ray and the cloud-pixel ray.">scattering angle</span>. To build that profile, the software must know three things for each useful cloud pixel:

1. whether the pixel is cloud rather than sky, ground, or horizon;
2. where the ASP is, because scattering angles are measured relative to it;
3. which viewing direction that pixel corresponds to after camera calibration.

The report used the convention that the ASP provides the reference for a 180 degree scattering angle. If the camera ray to a cloud pixel is separated from the ASP ray by an angle gamma, then the scattering angle is approximately 180 degrees minus gamma.

<div class="row justify-content-sm-center">
  <div class="col-sm-10 mt-3 mt-md-0">
    {% include figure.liquid loading="eager" path="assets/img/projects/drone-cloud-droplet-measurement/main-retrieval-flowchart.jpg" title="Main retrieval flowchart" class="img-fluid rounded z-depth-1" %}
  </div>
</div>
<div class="caption">
  Figure 3. Main retrieval workflow, showing how video pre-processing, camera calibration, and lookup-table fitting connect raw flight video to droplet-size estimates.
</div>

### 2.3 Video Pre-processing

The polarisation camera records four micro-polariser angles: 0 degrees, 45 degrees, 90 degrees, and 135 degrees. The raw data were 12-bit, which preserves faint intensity differences better than normal 8-bit video.

Different combinations of the same video were used for different jobs:

- The **45-135 channel** emphasises the cross-shaped ASP feature. I used this channel with <span class="term" data-def="Normalised cross correlation: a template-matching method that slides a remembered pattern over an image and scores how well each position matches.">normalised cross correlation</span>, or NCC, to track the ASP <a class="ref-link" href="#ref-brunelli2009">[6]</a>.
- A single image channel was enough for cloud masking and horizon detection. The aim was to keep bright low-saturation cloud pixels while excluding blue sky, terrain, and the horizon.
- All four polarisation angles from the 12-bit data were used to retrieve the final linear polarisation information.

Cloud masking is important because the LUT should only be fitted to cloud pixels. If sky, hillside, horizon, or non-cloud artefacts are included, the angular profile stops representing the cloud droplet population.

<div class="student-prompt">
  <strong>Pattern challenge</strong>
  <p>How could a computer find the same cloud feature in the next frame if the drone moves and the cloud drifts?</p>
</div>

The outreach activity used a tiny 3 by 3 kernel to explain pattern matching. In the actual project, an equivalent idea appears as a larger circular pattern with a dark cross at the centre. The kernel is still just a small pattern that the computer compares against an image.

<div class="kernel-note">
  <div>
    {% include figure.liquid path="assets/img/projects/drone-cloud-droplet-measurement/filtered-asp-kernel.png" title="Filtered ASP kernel" class="img-fluid rounded z-depth-1" %}
  </div>
  <div>
    <strong>Classic kernel picture</strong>
    <p>This is the project-level cousin of the simple 3 by 3 kernel from the example. Instead of matching a tiny square pattern, the software uses an 80 by 80 filtered ASP kernel: a circular polarisation pattern with a dark cross at the centre.</p>
  </div>
</div>
<div class="caption">
  Figure 4. Example anti-solar-point tracking kernel used to explain how the video-processing pipeline recognises the central optical pattern.
</div>

<details class="cloud-case-details">
  <summary>Technical note: why does this shape appear?</summary>
  <p>The measured polarisation direction has to be rotated from the camera plane into the scattering plane. That change of reference frame introduces a sinusoidal dependence involving <code>sin(2x)</code> and <code>cos(2x)</code>. This is part of <span class="term" data-def="A four-number description of light intensity and polarisation: I, Q, U, and V.">Stokes-vector</span> polarimetry: rotating the reference frame mixes the <code>Q</code> and <code>U</code> components <a class="ref-link" href="#ref-bohren1983">[3]</a>.</p>
</details>

For a hands-on version of the tracking idea, see my outreach activity:
<a class="btn btn-sm btn-outline-primary" href="{{ '/blog/2026/dyson-day-drone-design-ncc/' | relative_url }}">Try the NCC demo</a>

### 2.4 Camera Calibration

A camera does not see the world as a perfect flat grid. The lens bends rays slightly, especially near the image edges. Calibration corrects that distortion so each cloud pixel can be linked to a viewing direction <a class="ref-link" href="#ref-zhang2000">[7]</a>.

<div class="student-prompt">
  <strong>Design challenge</strong>
  <p>What data would a drone need to know where each cloud pixel is in space?</p>
</div>

<details class="cloud-case-details">
  <summary>Go deeper: camera distortion and viewing rays</summary>
  <p>Calibration uses a known printed pattern to estimate lens distortion, then builds a ray map: for each image pixel, what direction in space did that pixel look? Move the slider below. The left view shows an exaggerated distorted camera image; the right view shows why correction matters before calculating scattering angle.</p>
  <div class="calibration-demo" id="calibration-demo">
    <canvas id="calibration-canvas" width="720" height="260" aria-label="Interactive camera distortion correction demonstration"></canvas>
    <label for="distortion-control">Distortion strength: <strong id="distortion-label">0.45</strong></label>
    <input id="distortion-control" type="range" min="0" max="0.9" step="0.05" value="0.45">
    <p id="calibration-note">Calibration turns bent image coordinates into viewing rays. The viewing-angle difference between the ASP ray and each cloud-pixel ray then gives the scattering angle.</p>
  </div>
</details>

### 2.5 Lookup Table Fitting

Once each cloud pixel has a scattering angle and a linear polarisation signal, the retrieval becomes curve fitting. I compared the measured cloudbow profile with a lookup table of simulated profiles and chose the closest match.

<details class="cloud-case-details">
  <summary>Go deeper: P12, Mie scattering, and the LUT grid</summary>
  <p>The LUT grid covered effective radius from <strong>1 micrometre to 40.77 micrometres</strong> on a logarithmic grid, and effective variance from <strong>0.01 to 0.325</strong>. For each pair of effective radius and effective variance, Mie-scattering calculations produced a theoretical polarisation curve <a class="ref-link" href="#ref-bohren1983">[3]</a><a class="ref-link" href="#ref-miepython2026">[8]</a>. The measured scattering-plane signal was compared with many simulated <code>P12(theta)</code> curves. The fitting allows scale and background terms, then looks for the effective radius and effective variance whose curve has the lowest error against the measured cloudbow profile.</p>
</details>

<a id="flying-system"></a>
## 3. Building The Flying Measurement System

After the optical idea was clear, the engineering job was to build a platform that could collect the right kind of data in real cloud or fog. The drone was not just taking pretty videos. It had to carry a measurement system:

| Part | What it did | Why it mattered |
| --- | --- | --- |
| Drone itself | A pre-built flying platform lifted the payload into useful cloud/fog viewing positions. | This was the simplest practical route: the project effort could focus on measurement, payload integration, and retrieval. |
| Polarisation camera | Measured brightness, colour, and the direction information in scattered light. | Ordinary images miss much of the faint cloudbow signal. |
| Lens | Set how much of the cloud scene fitted into each image. | A wide view helps capture the cloudbow geometry, but the image must still have enough detail. |
| Onboard computer | Controlled the camera, saved data, and provided a practical field interface. | The drone could not depend on a full laptop during flight. |
| Fast storage drive | Stored the raw image stream while the drone was recording. | If storage was too slow, frames would be incomplete or lost. |
| Batteries and power electronics | Supplied the voltages needed by the drone, computer, and camera. | Flying instruments have to manage power safely and separately from data. |
| Protective mount | Held the camera, computer, drive, and cables in a repeatable position. | The payload needed to survive vibration, cable strain, and rough landings. |

The engineering challenge was not simply "attach a camera". The camera had to be held rigidly, the cables had to stay away from the propellers, the mass had to remain close to the drone centreline, and the data had to survive vibration and rough handling.

<div class="row justify-content-sm-center">
  <div class="col-sm-6 mt-3 mt-md-0">
    {% include figure.liquid loading="eager" path="assets/img/projects/drone-cloud-droplet-measurement/drone-camera-assembly.jpg" title="Drone and camera assembly" class="img-fluid rounded z-depth-1" %}
  </div>
  <div class="col-sm-6 mt-3 mt-md-0">
    {% include figure.liquid loading="eager" path="assets/img/projects/drone-cloud-droplet-measurement/payload-exploded-view.png" title="Payload exploded view" class="img-fluid rounded z-depth-1" %}
  </div>
</div>
<div class="caption">
  Figure 5. Drone-camera assembly and exploded payload view, showing how the camera, lens, onboard computer, power system, storage, and protective cage formed one measurement system.
</div>

<p>
  <a class="btn btn-sm btn-outline-primary ar-link" rel="ar" href="{{ '/assets/models/projects/drone-cloud-droplet-measurement/chimera-payload-assembly.usdz' | relative_url }}">
    <img class="ar-link__poster" src="{{ '/assets/img/projects/drone-cloud-droplet-measurement/payload-exploded-view.png' | relative_url }}" alt="">
    <span>View the payload assembly in AR</span>
  </a>
</p>
The retrieval did not need a separate range finder. The plan was to use a calibrated camera and computer vision to recover the image geometry needed for cloudbow fitting: where the ASP sits in the frame, which pixels are cloud, and how the useful cloud features move between frames. Camera calibration was based on standard geometric calibration ideas <a class="ref-link" href="#ref-zhang2000">[7]</a>.

<details class="cloud-case-details">
  <summary>Engineering side quest: why storage speed mattered</summary>
  <p>One surprisingly important part of the project was the storage drive. The camera could produce raw 12-bit data at up to about <strong>125 MB/s</strong>, so the payload needed storage that could sustain large, fast file writes during the whole recording.</p>

  <p>A product label such as "USB 3.0" was not enough information. Three different things matter:</p>

  <ul>
    <li><strong>Connector shape:</strong> USB-A and USB-C describe the plug shape. They do not guarantee the speed.</li>
    <li><strong>Bus speed:</strong> USB 2.0, USB 3.0, and USB 3.2 describe how fast the connection can be in theory.</li>
    <li><strong>Storage protocol:</strong> BOT and UASP describe how the computer talks to the drive.</li>
  </ul>

  <p>BOT, or Bulk-Only Transport, is the older USB storage protocol. It handles commands more simply and tends to perform poorly when the computer has to keep sending a stream of large writes. UASP, or USB Attached SCSI Protocol, is newer and can queue commands more efficiently, so it usually gives better real write performance. After that protocol bottleneck is reduced, the limiting factor shifts to the storage device itself: its controller, cache or write buffer, and whether it can keep writing after any short burst buffer has filled.</p>

<div class="storage-challenge" id="storage-challenge">
  <div>
    <strong>Procurement challenge</strong>
    <p>You need to record scientific images without dropped frames. Which storage would you choose?</p>
  </div>
  <table>
    <thead>
      <tr>
        <th>Candidate</th>
        <th>What the label suggested</th>
        <th>Measured result</th>
        <th>Decision</th>
      </tr>
    </thead>
    <tbody>
      <tr>
        <td>Department USB 3.0 stick</td>
        <td>USB stick, BOT, reported on a 480M bus</td>
        <td>4.4 MB/s write; 7.1 MB/s after formatting</td>
        <td>Rejected: far below the camera requirement.</td>
      </tr>
      <tr>
        <td>UASP USB 3.2 Gen 1 stick</td>
        <td>Faster bus, UASP, reported on a 5000M bus</td>
        <td>370 MB/s read, 90 MB/s write</td>
        <td>Rejected: much better, but not enough sustained write margin.</td>
      </tr>
      <tr>
        <td>External SSD</td>
        <td>Fast solid-state storage</td>
        <td>984.5 MB/s read, 381.2 MB/s write in a 64 GB test</td>
        <td>Chosen: enough margin for large continuous recordings.</td>
      </tr>
    </tbody>
  </table>
  <button type="button" data-storage="slow">Choose the USB 3.0 stick</button>
  <button type="button" data-storage="medium">Choose the UASP stick</button>
  <button type="button" data-storage="ssd">Choose the SSD</button>
  <p id="storage-challenge-result" aria-live="polite">Choose a storage option to see the engineering trade-off.</p>
</div>

  <p>The <code>480M</code> and <code>5000M</code> clues are bus speeds in megabits per second, while the measured write speeds are in megabytes per second. They are not the same unit, and real devices never reach the ideal bus speed. The lesson was simple: UASP helped, but only the SSD could sustain large fast file writes with a comfortable safety margin. That made the storage choice part of turning the drone into a real measurement system.</p>
</details>


## 4. Results

The pipeline produces intermediate data that can be inspected visually. This is important because a retrieval can only be trusted if the geometry, masks, and polarisation signal make physical sense.

The example below shows the retrieved geometry and polarisation map on one frame. The yellow cross marks the tracked ASP. The red circles are scattering-angle contours centred on the ASP. The dense coloured overlay on the cloud shows the rotated linear polarisation signal used to build the retrieval profile.

<div class="student-prompt">
  <strong>Think like an engineer</strong>
  <p>Before trusting the final droplet size, what intermediate outputs would you inspect: tracking, cloud mask, scattering-angle rings, polarisation map, or all of them?</p>
</div>

<div class="row mt-3">
  <div class="col-sm mt-3 mt-md-0">
    {% include video.liquid path="assets/video/projects/drone-cloud-droplet-measurement/kernel-tracking-preview.mp4" class="img-fluid rounded z-depth-1" controls=true muted=true %}
  </div>
  <div class="col-sm mt-3 mt-md-0">
    {% include video.liquid path="assets/video/projects/drone-cloud-droplet-measurement/detection-overlay-preview.mp4" class="img-fluid rounded z-depth-1" controls=true muted=true %}
  </div>
</div>
<div class="caption">
  Figure 6. Video pre-processing on real flight data: anti-solar-point tracking on the left and detection overlay on the right.
</div>

For the multi-frame retrieval, the goal was to follow the same small cloud region across several frames. Each frame contributes polarisation samples at slightly different viewing angles, so the cloudbow profile gradually fills in.

<div class="row justify-content-sm-center">
  <div class="col-sm-8 mt-3 mt-md-0">
    {% include figure.liquid path="assets/img/projects/drone-cloud-droplet-measurement/cloud-frame-scattering-rings.png" title="Cloud frame with scattering-angle rings" class="img-fluid rounded z-depth-1" %}
  </div>
</div>
<div class="caption">
  Figure 7. Example retrieval frame showing the tracked anti-solar point, scattering-angle contours, cloud mask, and processed polarisation signal.
</div>

<div class="row mt-3">
  <div class="col-sm mt-3 mt-md-0">
    {% include video.liquid path="assets/video/projects/drone-cloud-droplet-measurement/manual-tracking-overlay-322p2-preview.mp4" class="img-fluid rounded z-depth-1" controls=true muted=true %}
  </div>
  <div class="col-sm mt-3 mt-md-0">
    {% include video.liquid path="assets/video/projects/drone-cloud-droplet-measurement/profile-build-window-1-region-1.mp4" class="img-fluid rounded z-depth-1" controls=true muted=true %}
  </div>
</div>
<div class="caption">
  Figure 8. Multi-frame retrieval preview: the tracked cloud region on the left and the accumulating scattering-angle profile on the right.
</div>

### 4.1 Final LUT Comparison

The final product of the pipeline is a measured angular polarisation profile compared against the lookup table. The blue points are measured cloud data. The orange curve is the best-fitting theoretical curve. The settings that generated that curve give the retrieved effective radius and effective variance.

<div class="row justify-content-sm-center">
  <div class="col-sm-9 mt-3 mt-md-0">
    {% include figure.liquid path="assets/img/projects/drone-cloud-droplet-measurement/lut-fit-example.png" title="Lookup-table fit example" class="img-fluid rounded z-depth-1" %}
  </div>
</div>
<div class="caption">
  Figure 9. Final fingerprint-matching step, where measured cloud data are compared with the best matching lookup-table simulation.
</div>

### 4.2 Go Deeper: The Actual LUT Used

The <span class="term" data-def="A lookup table: a library of simulated cloudbow patterns used for matching measured data.">lookup table</span> is the book of possible cloud fingerprints. Each entry says, "if droplets had this average size and this spread, the polarised cloudbow would look like this." In the full project, these curves were generated from Mie-scattering calculations <a class="ref-link" href="#ref-bohren1983">[3]</a><a class="ref-link" href="#ref-miepython2026">[8]</a>.

You can move the sliders in the interactive explorer and watch how the predicted cloudbow curve changes:

<div class="row justify-content-sm-center">
  <div class="col-sm-8 mt-3 mt-md-0">
    {% include figure.liquid path="assets/img/projects/drone-cloud-droplet-measurement/cloudbow-lut-thumb.png" title="Cloudbow LUT explorer preview" class="img-fluid rounded z-depth-1" %}
  </div>
</div>
<div class="caption">
  Figure 10. Preview of the optional Cloudbow Polarisation LUT Explorer, where the lookup-table idea can be explored with sliders.
</div>

<p>
  <a class="btn btn-sm btn-outline-primary" href="{{ '/cloudbow-lut/' | relative_url }}">Explore the interactive LUT</a>
  <a class="btn btn-sm btn-outline-secondary" href="{{ '/projects/10_cloudbow_lut/' | relative_url }}">Read the technical project page</a>
</p>

### 4.3 Discussion And Conclusion

The multi-frame retrieval estimated an effective radius close to **5 micrometres** and an effective variance around **0.05**. Its estimated spatial resolution was about **3 m by 3 m**, with a time resolution of about **15 seconds**.

The significance is the resolution. In the submitted report, this was estimated to be one to two orders of magnitude finer than existing space-borne and airborne cloud DSD retrieval methods. That kind of local measurement could help future MCB fieldwork track how small cloud patches evolve over time, and it could also help with fog studies, satellite validation, and high-resolution model evaluation.

The project does not prove that drone retrieval is already a finished operational method. But it does show that a low-cost drone-borne polarisation camera can collect cloudbow-region measurements and retrieve physically plausible metre-scale cloud droplet size information.

<details class="cloud-case-details">
  <summary>Go deeper: what could make this measurement wrong?</summary>
  <p>Real clouds are messy. Future work should improve radiometric calibration, focus control, automated cloud-patch tracking, and cloud-motion correction. The diagnostic Stokes component after rotation should also be checked carefully, because it can reveal errors in polarisation calibration or reference-frame rotation.</p>
</details>

## Glossary

Hover over highlighted terms in the case study for a quick reminder. This list gathers the main terms in one place.

<div class="glossary-grid">
  <div><strong>Cloud droplet</strong><p>A tiny liquid-water sphere floating inside cloud or fog.</p></div>
  <div><strong>DSD</strong><p>Droplet size distribution: how many small, medium, and large droplets are in the cloud.</p></div>
  <div><strong>Effective radius</strong><p>A weighted average droplet radius that is useful for predicting cloud optical behaviour.</p></div>
  <div><strong>Effective variance</strong><p>How mixed the droplet sizes are. A small value means most droplets are similar.</p></div>
  <div><strong>Polarisation</strong><p>The orientation of the electric-field oscillation in a light wave.</p></div>
  <div><strong>Linear polarisation intensity</strong><p>How strongly the measured light prefers one linear electric-field direction.</p></div>
  <div><strong>Cloudbow</strong><p>A rainbow-like angular feature from cloud droplets, especially useful here in polarised light.</p></div>
  <div><strong>Anti-solar point, or ASP</strong><p>The point opposite the Sun; roughly where the drone shadow would appear on a visible cloud or ground surface.</p></div>
  <div><strong>Scattering angle</strong><p>The angle between incoming sunlight and the direction from droplet to camera.</p></div>
  <div><strong>Stokes vector</strong><p>A four-number description of light intensity and polarisation.</p></div>
  <div><strong>LUT</strong><p>Lookup table: a library of simulated cloudbow patterns used for matching measured data.</p></div>
  <div><strong>MCB</strong><p>Marine cloud brightening: a proposed way to increase reflectivity of some low marine clouds using sea-salt aerosol.</p></div>
  <div><strong>USB</strong><p>A standard for connecting devices. Plug shape and data speed are separate things.</p></div>
  <div><strong>MB/s</strong><p>Megabytes per second. A video recorder needs enough write speed, not just enough storage space.</p></div>
  <div><strong>BOT and UASP</strong><p>Two USB storage protocols. UASP can queue work more efficiently than older BOT.</p></div>
</div>

## References

1. <span id="ref-twomey1977"></span>S. Twomey, "The Influence of Pollution on the Shortwave Albedo of Clouds," *Journal of the Atmospheric Sciences*, 34(7), 1149-1152, 1977. <https://doi.org/10.1175/1520-0469(1977)034%3C1149:TIOPOT%3E2.0.CO;2>
2. <span id="ref-platnick2017"></span>S. Platnick et al., "The MODIS Cloud Optical and Microphysical Products: Collection 6 Updates and Examples From Terra and Aqua," *IEEE Transactions on Geoscience and Remote Sensing*, 55(1), 502-525, 2017. <https://doi.org/10.1109/TGRS.2016.2610522>
3. <span id="ref-bohren1983"></span>C. F. Bohren and D. R. Huffman, *Absorption and Scattering of Light by Small Particles*. Wiley, 1983.
4. <span id="ref-hansen1974"></span>J. E. Hansen and L. D. Travis, "Light Scattering in Planetary Atmospheres," *Space Science Reviews*, 16, 527-610, 1974. <https://doi.org/10.1007/BF00168069>
5. <span id="ref-poertge2023"></span>V. Pörtge et al., "High-Spatial-Resolution Retrieval of Cloud Droplet Size Distribution from Polarized Observations of the Cloudbow," *Atmospheric Measurement Techniques*, 16, 645-667, 2023. <https://doi.org/10.5194/amt-16-645-2023>
6. <span id="ref-brunelli2009"></span>R. Brunelli, *Template Matching Techniques in Computer Vision: Theory and Practice*. Wiley, 2009.
7. <span id="ref-zhang2000"></span>Z. Zhang, "A Flexible New Technique for Camera Calibration," *IEEE Transactions on Pattern Analysis and Machine Intelligence*, 22(11), 1330-1334, 2000. <https://doi.org/10.1109/34.888718>
8. <span id="ref-miepython2026"></span>S. Prahl, *miepython: Pure Python Calculation of Mie Scattering*, Zenodo, 2026. <https://doi.org/10.5281/zenodo.18893972>

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

  .student-prompt {
    border: 1px solid rgba(80, 130, 180, 0.45);
    border-left: 4px solid var(--global-theme-color);
    border-radius: 8px;
    padding: 0.85rem 1rem;
    margin: 1rem 0 1.35rem;
    background: rgba(80, 130, 180, 0.08);
  }

  .student-prompt strong {
    display: block;
    margin-bottom: 0.25rem;
  }

  .student-prompt p {
    margin: 0;
  }

  .hardware-preview {
    display: grid;
    grid-template-columns: minmax(120px, 180px) 1fr;
    gap: 0.85rem;
    align-items: center;
  }

  .hardware-preview img {
    width: 100%;
    border-radius: 8px;
  }

  .ref-link {
    white-space: nowrap;
  }

  [id^="ref-"] {
    scroll-margin-top: 5rem;
  }

  .glossary-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(210px, 1fr));
    gap: 0.75rem;
    margin: 1rem 0 1.6rem;
  }

  .glossary-grid > div {
    border: 1px solid var(--global-divider-color);
    border-radius: 8px;
    padding: 0.85rem;
    background: var(--global-card-bg-color);
  }

  .glossary-grid p {
    margin: 0.35rem 0 0;
  }

  .term {
    position: relative;
    border-bottom: 1px dotted var(--global-theme-color);
    cursor: help;
  }

  .term::after {
    position: absolute;
    left: 50%;
    bottom: calc(100% + 0.45rem);
    z-index: 20;
    width: min(260px, 70vw);
    padding: 0.55rem 0.65rem;
    border: 1px solid var(--global-divider-color);
    border-radius: 8px;
    background: var(--global-card-bg-color);
    box-shadow: 0 8px 24px rgba(0, 0, 0, 0.18);
    color: var(--global-text-color);
    content: attr(data-def);
    font-size: 0.85rem;
    line-height: 1.35;
    opacity: 0;
    pointer-events: none;
    transform: translate(-50%, 0.25rem);
    transition: opacity 120ms ease, transform 120ms ease;
  }

  .term[data-tip-align="left"]::after {
    left: 0;
    transform: translate(0, 0.25rem);
  }

  .term[data-tip-align="right"]::after {
    right: 0;
    left: auto;
    transform: translate(0, 0.25rem);
  }

  .term:hover::after,
  .term:focus::after {
    opacity: 1;
    transform: translate(-50%, 0);
  }

  .term[data-tip-align="left"]:hover::after,
  .term[data-tip-align="left"]:focus::after,
  .term[data-tip-align="right"]:hover::after,
  .term[data-tip-align="right"]:focus::after {
    transform: translate(0, 0);
  }

  .post table,
  article table,
  .storage-challenge table {
    border-collapse: separate;
    border-spacing: 0;
    overflow: hidden;
    border: 1px solid var(--global-divider-color);
    border-radius: 8px;
  }

  .post table th,
  .post table td,
  article table th,
  article table td,
  .storage-challenge th,
  .storage-challenge td {
    border-bottom: 1px solid var(--global-divider-color);
    border-right: 1px solid var(--global-divider-color);
    padding: 0.7rem;
    vertical-align: top;
  }

  .post table th:last-child,
  .post table td:last-child,
  article table th:last-child,
  article table td:last-child,
  .storage-challenge th:last-child,
  .storage-challenge td:last-child {
    border-right: 0;
  }

  .post table tr:last-child td,
  article table tr:last-child td,
  .storage-challenge tr:last-child td {
    border-bottom: 0;
  }

  .post table th,
  article table th,
  .storage-challenge th {
    background: rgba(127, 127, 127, 0.08);
    font-weight: 700;
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
    font-size: 0.94rem;
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

  .ar-link {
    display: inline-flex;
    align-items: center;
    gap: 0.45rem;
  }

  .ar-link.is-disabled {
    cursor: not-allowed;
    opacity: 0.68;
  }

  .ar-link__poster {
    width: 1px;
    height: 1px;
    opacity: 0;
    pointer-events: none;
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

  .polarisation-demo__scene small {
    grid-column: 1;
    color: var(--global-text-color-light);
    line-height: 1.35;
  }

  .polarisation-demo__bundle {
    grid-column: 2;
    grid-row: 1 / span 2;
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

  .dsd-bubble-canvas {
    display: block;
    width: 100%;
    max-width: 420px;
    height: auto;
    margin: 0.7rem 0 0.35rem;
    border: 1px solid var(--global-divider-color);
    border-radius: 8px;
    background:
      radial-gradient(circle at 25% 20%, rgba(255, 255, 255, 0.24), transparent 28%),
      rgba(44, 123, 150, 0.08);
  }

  #cloudbow-lab-note {
    margin: 0.5rem 0 0;
  }

  .kernel-note {
    display: grid;
    grid-template-columns: minmax(180px, 280px) 1fr;
    gap: 1rem;
    align-items: center;
    border: 1px solid var(--global-divider-color);
    border-radius: 8px;
    padding: 1rem;
    margin: 1rem 0 1.2rem;
    background: var(--global-card-bg-color);
  }

  .calibration-demo {
    border: 1px solid var(--global-divider-color);
    border-radius: 8px;
    padding: 1rem;
    margin: 1rem 0 1.5rem;
    background: var(--global-card-bg-color);
  }

  .calibration-demo canvas {
    display: block;
    width: 100%;
    height: auto;
    margin-bottom: 0.75rem;
    border: 1px solid var(--global-divider-color);
    border-radius: 8px;
    background: rgba(127, 127, 127, 0.06);
  }

  .calibration-demo label {
    display: block;
    font-weight: 600;
  }

  .calibration-demo input[type="range"] {
    width: 100%;
    margin: 0.35rem 0 0.55rem;
  }

  @media (max-width: 576px) {
    .polarisation-demo__scene,
    .cloudbow-lab,
    .kernel-note {
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

    .hardware-preview {
      grid-template-columns: 1fr;
    }

    .polarisation-demo__scene small,
    .polarisation-demo__bundle {
      grid-column: 1;
      grid-row: auto;
    }
  }
</style>

<script>
  (() => {
    const terms = document.querySelectorAll(".term[data-def]");
    if (!terms.length) return;

    const updateTermAlignment = (term) => {
      const rect = term.getBoundingClientRect();
      const tooltipWidth = Math.min(260, window.innerWidth * 0.7);
      const centredLeft = rect.left + rect.width / 2 - tooltipWidth / 2;
      const centredRight = centredLeft + tooltipWidth;

      term.removeAttribute("data-tip-align");
      if (centredLeft < 12) {
        term.setAttribute("data-tip-align", "left");
      } else if (centredRight > window.innerWidth - 12) {
        term.setAttribute("data-tip-align", "right");
      }
    };

    terms.forEach((term) => {
      term.setAttribute("tabindex", "0");
      term.addEventListener("mouseenter", () => updateTermAlignment(term));
      term.addEventListener("focus", () => updateTermAlignment(term));
    });
  })();

  (() => {
    const arLink = document.querySelector(".ar-link");
    if (!arLink) return;

    const platform = navigator.platform || "";
    const userAgent = navigator.userAgent || "";
    const hasTouchMac = platform === "MacIntel" && navigator.maxTouchPoints > 1;
    const isAppleAR = /iPhone|iPad|iPod/.test(userAgent) || hasTouchMac;

    if (!isAppleAR) {
      arLink.classList.add("is-disabled");
      arLink.removeAttribute("rel");
      arLink.setAttribute("aria-disabled", "true");
      arLink.querySelector("span").textContent = "AR preview available on iPhone or iPad";
      arLink.addEventListener("click", (event) => {
        event.preventDefault();
      });
    }
  })();

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
      slow: "This would fail. The BOT USB stick looked acceptable from the product label, but its measured write speed was far below the camera requirement.",
      medium: "This is much better: UASP and the faster bus helped a lot. But 90 MB/s write speed still left too little margin for sustained raw recording.",
      ssd: "Best choice. The SSD had both the protocol/device performance and enough sustained write margin for large fast files."
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
    const canvas = document.getElementById("calibration-canvas");
    const control = document.getElementById("distortion-control");
    const label = document.getElementById("distortion-label");
    if (!canvas || !control || !label) return;

    const ctx = canvas.getContext("2d");
    const drawGrid = (originX, originY, width, height, distortion, corrected) => {
      const cols = 9;
      const rows = 7;
      const cx = originX + width / 2;
      const cy = originY + height / 2;
      const project = (x, y) => {
        const nx = (x - cx) / (width / 2);
        const ny = (y - cy) / (height / 2);
        const r2 = nx * nx + ny * ny;
        const factor = corrected ? 1 : 1 + distortion * r2;
        return {
          x: cx + nx * factor * width / 2,
          y: cy + ny * factor * height / 2
        };
      };

      ctx.save();
      ctx.strokeStyle = corrected ? "rgba(48, 135, 80, 0.88)" : "rgba(185, 75, 90, 0.86)";
      ctx.lineWidth = 2;

      for (let col = 0; col <= cols; col += 1) {
        ctx.beginPath();
        for (let step = 0; step <= 80; step += 1) {
          const x = originX + width * col / cols;
          const y = originY + height * step / 80;
          const point = project(x, y);
          if (step === 0) ctx.moveTo(point.x, point.y);
          else ctx.lineTo(point.x, point.y);
        }
        ctx.stroke();
      }

      for (let row = 0; row <= rows; row += 1) {
        ctx.beginPath();
        for (let step = 0; step <= 80; step += 1) {
          const x = originX + width * step / 80;
          const y = originY + height * row / rows;
          const point = project(x, y);
          if (step === 0) ctx.moveTo(point.x, point.y);
          else ctx.lineTo(point.x, point.y);
        }
        ctx.stroke();
      }

      ctx.fillStyle = window.getComputedStyle(document.body).color || "#263238";
      ctx.font = "16px system-ui, -apple-system, Segoe UI, Roboto";
      ctx.fillText(corrected ? "after calibration: rays recovered" : "raw image: lens distortion", originX, originY - 14);
      ctx.restore();
    };

    const drawCalibration = () => {
      const distortion = Number.parseFloat(control.value);
      label.textContent = distortion.toFixed(2);
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.fillStyle = "rgba(127, 127, 127, 0.08)";
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      drawGrid(46, 58, 260, 150, distortion, false);
      drawGrid(414, 58, 260, 150, distortion, true);

      ctx.save();
      ctx.strokeStyle = "rgba(60, 120, 180, 0.8)";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(333, 132);
      ctx.lineTo(387, 132);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(387, 132);
      ctx.lineTo(376, 125);
      ctx.moveTo(387, 132);
      ctx.lineTo(376, 139);
      ctx.stroke();
      ctx.fillStyle = window.getComputedStyle(document.body).color || "#263238";
      ctx.font = "13px system-ui, -apple-system, Segoe UI, Roboto";
      ctx.fillText("calibration model", 314, 116);
      ctx.restore();
    };

    control.addEventListener("input", drawCalibration);
    drawCalibration();
  })();

  (() => {
    const lab = document.getElementById("cloudbow-lab");
    if (!lab) return;

    const reffControl = document.getElementById("reff-control");
    const veffControl = document.getElementById("veff-control");
    const reffLabel = document.getElementById("reff-label");
    const veffLabel = document.getElementById("veff-label");
    const ring = document.getElementById("cloudbow-ring");
    const bubbleCanvas = document.getElementById("dsd-bubble-canvas");
    const bubbleContext = bubbleCanvas ? bubbleCanvas.getContext("2d") : null;
    const note = document.getElementById("cloudbow-lab-note");
    const clamp = (value, min, max) => Math.min(max, Math.max(min, value));
    const pseudoRandom = (index) => {
      const value = Math.sin(index * 12.9898 + 78.233) * 43758.5453;
      return value - Math.floor(value);
    };
    let bubbleParticles = [];
    let bubbleLastTime = 0;
    let bubbleSignature = "";

    const hansenDSD = (reff, veff, count = 360) => {
      const k = 1 / veff - 2;
      const theta = reff * veff;
      const std = reff * Math.sqrt(veff);
      const maxRadius = Math.max(reff + 10 * std, 4 * reff);
      const radii = [];
      const density = [];

      for (let index = 0; index < count; index += 1) {
        const radius = maxRadius * index / (count - 1);
        radii.push(radius);
        density.push(radius > 0 ? Math.pow(radius, k - 1) * Math.exp(-radius / theta) : 0);
      }

      return { radii, density };
    };

    const sampleRadiusFromDSD = (dsd, q) => {
      let total = 0;
      for (let index = 1; index < dsd.radii.length; index += 1) {
        total += 0.5 * (dsd.density[index - 1] + dsd.density[index]) * (dsd.radii[index] - dsd.radii[index - 1]);
      }
      if (total <= 0) return dsd.radii[Math.floor(dsd.radii.length / 2)];

      const target = q * total;
      let accum = 0;
      for (let index = 1; index < dsd.radii.length; index += 1) {
        const area = 0.5 * (dsd.density[index - 1] + dsd.density[index]) * (dsd.radii[index] - dsd.radii[index - 1]);
        if (accum + area >= target) {
          const t = (target - accum) / (area + 1e-30);
          return dsd.radii[index - 1] + clamp(t, 0, 1) * (dsd.radii[index] - dsd.radii[index - 1]);
        }
        accum += area;
      }
      return dsd.radii[dsd.radii.length - 1];
    };

    const radiusToBubblePx = (radius, width, height) => {
      const minRadius = 0.5;
      const maxRadius = 18;
      const minBubble = Math.max(2.5, Math.min(width, height) * 0.014);
      const maxBubble = Math.max(13, Math.min(width, height) * 0.075);
      const t = clamp((radius - minRadius) / (maxRadius - minRadius), 0, 1);
      return minBubble + Math.sqrt(t) * (maxBubble - minBubble);
    };

    const rebuildBubbles = (reff, veff) => {
      if (!bubbleCanvas) return;
      const width = bubbleCanvas.width;
      const height = bubbleCanvas.height;
      const dsd = hansenDSD(reff, veff, 500);
      const count = 72;
      const marginTop = 36;
      const previous = bubbleParticles;
      bubbleParticles = [];

      for (let index = 0; index < count; index += 1) {
        const q = (index + 0.5) / count;
        const radius = sampleRadiusFromDSD(dsd, q);
        const baseR = radiusToBubblePx(radius, width, height);
        const old = previous[index];
        bubbleParticles.push({
          q,
          radius,
          baseR,
          r: old ? clamp(old.r, baseR * 0.45, baseR * 1.8) : baseR,
          x: old ? clamp(old.x, baseR + 16, width - baseR - 16) : clamp(22 + pseudoRandom(index) * (width - 44), baseR + 16, width - baseR - 16),
          y: old ? clamp(old.y, baseR + marginTop, height - baseR - 14) : clamp(marginTop + pseudoRandom(index + 1000) * (height - marginTop - 16), baseR + marginTop, height - baseR - 14),
          vx: old ? old.vx : (pseudoRandom(index + 2000) - 0.5) * 0.4,
          vy: old ? old.vy : (pseudoRandom(index + 3000) - 0.5) * 0.4,
          phase: pseudoRandom(index + 4000) * Math.PI * 2,
          alpha: 0.34 + 0.32 * pseudoRandom(index + 5000)
        });
      }
    };

    const updateBubbleTargets = (reff, veff) => {
      if (!bubbleCanvas) return;
      if (!bubbleParticles.length) {
        rebuildBubbles(reff, veff);
        return;
      }
      const dsd = hansenDSD(reff, veff, 500);
      for (const particle of bubbleParticles) {
        particle.radius = sampleRadiusFromDSD(dsd, particle.q);
        particle.baseR = radiusToBubblePx(particle.radius, bubbleCanvas.width, bubbleCanvas.height);
      }
    };

    const stepBubbles = (dt, timeSeconds) => {
      if (!bubbleCanvas) return;
      const width = bubbleCanvas.width;
      const height = bubbleCanvas.height;
      const marginTop = 36;
      const damping = Math.pow(0.18, dt);
      const repulsion = 54;
      const spring = 1.35;

      bubbleParticles.forEach((particle, index) => {
        const pulse = 1 + 0.1 * Math.sin(timeSeconds * (0.68 + 0.5 * pseudoRandom(index + 6000)) + particle.phase);
        particle.r += (particle.baseR * pulse - particle.r) * Math.min(1, dt * 4.5);
        particle.vx += Math.sin(timeSeconds * (0.22 + pseudoRandom(index + 7000) * 0.22) + particle.phase) * dt * 1.4;
        particle.vy += Math.cos(timeSeconds * (0.2 + pseudoRandom(index + 8000) * 0.22) + particle.phase * 0.7) * dt * 1.2;
      });

      for (let i = 0; i < bubbleParticles.length; i += 1) {
        const a = bubbleParticles[i];
        for (let j = i + 1; j < bubbleParticles.length; j += 1) {
          const b = bubbleParticles[j];
          let dx = b.x - a.x;
          let dy = b.y - a.y;
          let dist = Math.hypot(dx, dy);
          const minDist = a.r + b.r + 2;
          if (dist < 1e-6) {
            const angle = pseudoRandom(i * 101 + j) * Math.PI * 2;
            dx = Math.cos(angle);
            dy = Math.sin(angle);
            dist = 1;
          }
          if (dist < minDist) {
            const nx = dx / dist;
            const ny = dy / dist;
            const overlap = minDist - dist;
            const force = overlap * repulsion * dt;
            a.vx -= nx * force;
            a.vy -= ny * force;
            b.vx += nx * force;
            b.vy += ny * force;
            const correction = overlap * 0.18;
            a.x -= nx * correction;
            a.y -= ny * correction;
            b.x += nx * correction;
            b.y += ny * correction;
          }
        }
      }

      bubbleParticles.forEach((particle, index) => {
        const targetX = 22 + pseudoRandom(index) * (width - 44);
        const targetY = marginTop + pseudoRandom(index + 1000) * (height - marginTop - 16);
        particle.vx += (targetX - particle.x) * spring * dt;
        particle.vy += (targetY - particle.y) * spring * dt;
        particle.vx *= damping;
        particle.vy *= damping;
        particle.x += particle.vx * dt;
        particle.y += particle.vy * dt;

        const left = 14 + particle.r;
        const right = width - 14 - particle.r;
        const top = marginTop + particle.r;
        const bottom = height - 14 - particle.r;
        if (particle.x < left) { particle.x = left; particle.vx = Math.abs(particle.vx) * 0.35; }
        if (particle.x > right) { particle.x = right; particle.vx = -Math.abs(particle.vx) * 0.35; }
        if (particle.y < top) { particle.y = top; particle.vy = Math.abs(particle.vy) * 0.35; }
        if (particle.y > bottom) { particle.y = bottom; particle.vy = -Math.abs(particle.vy) * 0.35; }
      });
    };

    const drawBubbles = (timeMs) => {
      if (!bubbleCanvas || !bubbleContext) return;
      const reff = Number.parseFloat(reffControl.value);
      const veff = Number.parseFloat(veffControl.value);
      const signature = `${reff.toFixed(2)}|${veff.toFixed(3)}`;
      if (signature !== bubbleSignature) {
        bubbleSignature = signature;
        updateBubbleTargets(reff, veff);
      }
      if (!bubbleLastTime) bubbleLastTime = timeMs;
      const dt = clamp((timeMs - bubbleLastTime) / 1000, 0.016, 0.08);
      bubbleLastTime = timeMs;
      stepBubbles(dt, timeMs / 1000);

      const ctx = bubbleContext;
      const width = bubbleCanvas.width;
      const height = bubbleCanvas.height;
      const textColor = window.getComputedStyle(document.body).color || "#27343b";
      ctx.clearRect(0, 0, width, height);
      ctx.fillStyle = textColor;
      ctx.font = "13px system-ui, -apple-system, Segoe UI, Roboto";
      ctx.fillText(`DSD preview: r_eff=${reff.toFixed(1)} um, v_eff=${veff.toFixed(2)}`, 14, 23);

      for (const particle of bubbleParticles) {
        const gradient = ctx.createRadialGradient(particle.x - particle.r * 0.35, particle.y - particle.r * 0.35, particle.r * 0.15, particle.x, particle.y, particle.r);
        gradient.addColorStop(0, `rgba(255, 255, 255, ${0.25 + particle.alpha * 0.26})`);
        gradient.addColorStop(0.42, `rgba(38, 152, 186, ${particle.alpha})`);
        gradient.addColorStop(1, "rgba(38, 152, 186, 0.1)");
        ctx.beginPath();
        ctx.fillStyle = gradient;
        ctx.strokeStyle = `rgba(16, 92, 125, ${0.55 + particle.alpha * 0.35})`;
        ctx.lineWidth = 1.2;
        ctx.arc(particle.x, particle.y, particle.r, 0, 2 * Math.PI);
        ctx.fill();
        ctx.stroke();
      }

      window.requestAnimationFrame(drawBubbles);
    };

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

      note.textContent = "Larger effective radius pushes the bright ring farther from the ASP. Higher effective variance makes the ring fuzzier because many droplet sizes overlap.";
    };

    reffControl.addEventListener("input", updateCloudbowLab);
    veffControl.addEventListener("input", updateCloudbowLab);
    updateCloudbowLab();
    rebuildBubbles(Number.parseFloat(reffControl.value), Number.parseFloat(veffControl.value));
    window.requestAnimationFrame(drawBubbles);
  })();
</script>
