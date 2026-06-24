---
layout: post
title: "Dyson Day Outreach Activity Summary: Drone Design and Image Tracking"
date: 2026-06-19 12:00:00
description: A brief report on my James Dyson funded outreach activity about drone payload design, sensor trade-offs, and normalised cross correlation.
tags: outreach drones image-processing ncc james-dyson
categories: outreach
thumbnail: assets/img/blog/dyson-day-2026/dyson-day-challenges.png
---

This activity was developed for Dyson Day on 19 June 2026 as part of my James Dyson-funded fourth-year project on drone-borne cloud observation. The project uses a small drone carrying a camera and onboard sensors to investigate how cloud droplet size distributions might be retrieved from polarimetric images.

Now imagine the same kind of engineering problem in a simpler scene.

## Scenario: One Tree on a Flat Grassland

A drone is flying over a flat grassland. There is one clearly visible tree. The engineering task is to work out where the tree is relative to the drone.

That sounds simple, but "relative position" contains two different pieces of information:

| Question | Meaning |
| --- | --- |
| Direction | Is the tree in front, behind, left, right, or somewhere else in the camera view? |
| Distance | How far away is the tree from the drone? |

To know the tree's relative position, the drone needs at least a direction. To know the full position, it also needs distance, or enough information to infer distance from geometry.

This is the conceptual bridge to my real project. In drone-borne cloud observation, the tree becomes a cloud patch. The drone must recognise the same target in repeated images and combine that with viewing geometry, attitude, and position information. The simplified tree problem keeps the physics approachable, while preserving the real engineering challenge: useful measurements require both images and geometry.

## Drone Payload Design

You cannot carry every payload. Which data clues would you choose?

Here are six possible payload components. Each one is useful, but each one also has a limitation.

| Payload | Data clue | What it helps with | Limitation |
| --- | --- | --- | --- |
| Camera | Image of the tree | Direction in the image | Does not directly give distance |
| Gimbal | Camera pointing angle | Keeps the tree centred | Heavy/costly; needs pointing control |
| Laser range finder | Distance along beam | Measures range to the tree | Only works if aimed correctly |
| GPS module | Drone position | Tracks drone motion | Not precise enough alone for image-level tracking |
| Flight controller / IMU | Roll, pitch, yaw | Knows drone attitude | Timing/alignment errors matter |
| Onboard computer | Processed image result | Runs tracking/detection | Uses power; depends on algorithm quality |

The learning objective is not just "choose drone hardware". The real question is about data retrieval and sensor fusion: which clues are reliable enough, which measurements can be inferred, and which uncertainties would dominate the design?

During the Dyson Day activity, students worked in small groups with a limited budget. They had to decide which components they would carry and explain how their system would work. The discussion prompts were deliberately short:

| Prompt | Purpose |
| --- | --- |
| We choose ______ because it gives us ______. | Link a payload choice to a data clue. |
| We use ______ to find the tree in the image. | Identify the image-recognition step. |
| We use ______ to know where the drone is or how it is pointing. | Connect sensing to geometry. |
| We combine the data by ______. | Describe sensor fusion. |
| The biggest weakness of our design is ______. | Notice uncertainty and trade-offs. |

## Compare the Designs

There is no single perfect answer. A good engineering design chooses which clues are reliable enough for the mission.

| Route | How it works | Main weakness |
| --- | --- | --- |
| A. Take-off reference / motion tracking | If the drone starts near the tree, the take-off point can be treated as the tree's location. GPS and/or flight data estimate how the drone moved away from that point, so the tree's relative position is approximately the reverse of the drone's displacement. | Simple, but GPS drift and position error matter. |
| B. Camera geometry / image tracking | The camera detects where the tree appears in the image. The image position gives a direction in the camera view, and the drone attitude tells how the camera was pointing in the real world. If the ground is assumed flat, that direction can be projected down to the ground. | Closest to my project logic, but depends on calibration, attitude timing, and image tracking. |
| C. Two-frame triangulation | If the drone sees the tree from two different positions, each image gives a direction line towards the tree. Where those two direction lines meet is the estimated position. | Elegant and powerful, but needs enough drone motion and accurate direction estimates. |
| D. Active pointing and range finding | A gimbal keeps the camera or laser pointed at the tree. Gimbal/attitude data provide direction, and the laser range finder gives distance. | Intuitive and accurate when it works, but heavier, more expensive, and alignment-sensitive. |

## From Drone Design to Pattern Matching

Several of these designs rely on the camera. But a camera image is just a grid of numbers. How can software recognise the same tree again in the next frame?

This is the same kind of problem used when tracking a ball in sport, following a car in a video, or keeping a drone camera locked onto a target. One simple method is normalised cross correlation, or NCC.

Cross-correlation means comparing a remembered patch with many possible patches in the new image. The signal is strong when bright parts line up with bright parts and dark parts line up with dark parts. The signal is weak when the two patches are unrelated: some parts agree by chance, some disagree by chance, and the total score tends to cancel out.

Normalised means making the comparison fair even if the whole picture becomes brighter, darker, or higher contrast. Without normalisation, the score can change simply because the camera exposure changed, even if the object is the same. With normalisation, the algorithm focuses more on the relative pattern inside the patch.

For the outreach activity, I simplified the template to values of `+1` and `-1`:

- `+1` means "this part of the remembered patch is bright";
- `-1` means "this part is dark";
- the score is high when bright parts line up with bright parts and dark parts line up with dark parts.

In the paper version of the activity, students used a physical 3x3 sliding mask over a 5x5 grid. At each position, they multiplied the nine image values by the nine template values, added the products, and divided by 9. The best-matching location had the highest score. This is a simplified intensity pattern rather than full NCC mathematics, but it captures the main idea of sliding a remembered template over a larger image and scoring similarity at each position.

<div class="row mt-3 justify-content-sm-center">
  <div class="col-sm-10 mt-3 mt-md-0">
    {% include figure.liquid loading="eager" path="assets/img/blog/dyson-day-2026/dyson-day-challenges.png" class="img-fluid rounded z-depth-1" %}
  </div>
</div>
<div class="caption">
  The activity had two linked challenges: first, choose a useful drone payload under a budget constraint; second, use a simplified NCC pattern to recognise the same tree again in a new image.
</div>

## Interactive NCC Demo

Try the same idea below. Move the 3x3 tracker across the 5x5 image using the sliders. The score is the average of the nine products between the template and the image patch. A score near `+1` means a strong match; a score near `-1` means the pattern is mostly opposite.

<div id="ncc-demo" class="ncc-demo" aria-label="Interactive normalised cross correlation demo">
  <div class="ncc-demo__panels">
    <section class="ncc-demo__panel" aria-labelledby="ncc-template-title">
      <h3 id="ncc-template-title">3x3 remembered pattern</h3>
      <div class="ncc-grid ncc-grid--template" id="ncc-template-grid"></div>
    </section>

    <section class="ncc-demo__panel" aria-labelledby="ncc-image-title">
      <h3 id="ncc-image-title">5x5 new image</h3>
      <div class="ncc-grid ncc-grid--image" id="ncc-image-grid"></div>
    </section>
  </div>

  <div class="ncc-demo__controls">
    <label for="ncc-x">Horizontal position: <strong id="ncc-x-label">1</strong></label>
    <input id="ncc-x" type="range" min="0" max="2" step="1" value="1">

    <label for="ncc-y">Vertical position: <strong id="ncc-y-label">1</strong></label>
    <input id="ncc-y" type="range" min="0" max="2" step="1" value="1">
  </div>

  <div class="ncc-demo__score">
    <span>Match score</span>
    <strong id="ncc-score">+1.00</strong>
    <small id="ncc-location">position E</small>
  </div>

  <div class="ncc-demo__working" id="ncc-working"></div>
</div>

In this example, the best match is at the centre of the 5x5 image. That is where the local bright/dark structure is the same as the remembered 3x3 pattern.

## Why Intensity First?

Intensity is a simple brightness value. Colour can help, but colour is often less stable because sunlight, shadow, camera settings, and white balance can change it. For a first tracking method, brightness structure is often easier to reason about.

If a patch has a dark-left, bright-right pattern, that structure can remain recognisable even if the whole image becomes brighter, dimmer, or slightly tinted. That is why the paper game uses `+1` and `-1`: it teaches the idea of matching structure rather than trusting raw colour labels.

## What Can Go Wrong?

NCC is useful, but it is not magic. It works best when the object looks similar between frames. It can struggle if the target rotates, changes size, becomes blurred, is partly hidden, or if another object has a similar pattern.

This limitation is typical of basic template matching. It is fast and intuitive, but it is not robust to large changes in rotation, scale, or viewpoint.

That is why the payload design discussion matters. Image tracking is stronger when it is combined with other clues such as attitude, range, known drone motion, or repeated observations from different positions.

The drone design activity provides the systems-engineering context, while the NCC activity gives a concrete way to experience image recognition. By working through the case study, students compare payload designs, discuss sensor accuracy and calibration, test several ways to retrieve relative-position information, and connect a simple tree-tracking example to a real drone-based cloud observation project.

The drone makes the problem tangible, but the main technical concept is that a computer can track visual patterns by comparing local intensity structure across images.

<style>
  #markdown-content table {
    border-collapse: collapse;
    width: 100%;
    margin: 1rem 0 1.25rem;
  }

  #markdown-content th,
  #markdown-content td {
    border: 1px solid var(--global-divider-color);
    padding: 0.65rem 0.75rem;
    vertical-align: top;
  }

  #markdown-content th {
    background: rgba(31, 143, 120, 0.10);
    font-weight: 700;
  }

  .ncc-demo {
    border: 1px solid var(--global-divider-color);
    border-radius: 8px;
    padding: 1rem;
    margin: 1.5rem 0;
    background: var(--global-card-bg-color);
  }

  .ncc-demo__panels {
    display: grid;
    grid-template-columns: minmax(0, 1fr) minmax(0, 1.4fr);
    gap: 1rem;
    align-items: start;
  }

  .ncc-demo__panel h3 {
    font-size: 1rem;
    margin: 0 0 0.75rem;
  }

  .ncc-grid {
    display: grid;
    gap: 4px;
    width: min(100%, 320px);
    aspect-ratio: 1;
  }

  .ncc-grid--template {
    grid-template-columns: repeat(3, 1fr);
    max-width: 210px;
  }

  .ncc-grid--image {
    grid-template-columns: repeat(5, 1fr);
  }

  .ncc-cell {
    display: grid;
    place-items: center;
    min-width: 0;
    aspect-ratio: 1;
    border: 1px solid rgba(0, 0, 0, 0.16);
    border-radius: 6px;
    font-family: var(--global-mono-font-family, "SFMono-Regular", Consolas, "Liberation Mono", monospace);
    font-weight: 700;
    color: #111;
    transition:
      transform 120ms ease,
      outline-color 120ms ease,
      box-shadow 120ms ease;
  }

  .ncc-cell[data-value="-1"] {
    background: #555b63;
    color: #fff;
  }

  .ncc-cell[data-value="1"] {
    background: #f3f0d3;
  }

  .ncc-cell.is-active {
    outline: 3px solid #1f8f78;
    outline-offset: -3px;
    box-shadow: 0 0 0 2px rgba(31, 143, 120, 0.18);
    transform: translateY(-1px);
  }

  .ncc-cell.is-best {
    box-shadow: inset 0 0 0 3px #c84a3a;
  }

  .ncc-demo__controls {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 0.75rem 1rem;
    margin: 1rem 0;
  }

  .ncc-demo__controls label {
    margin: 0;
  }

  .ncc-demo__controls input {
    width: 100%;
  }

  .ncc-demo__score {
    display: flex;
    flex-wrap: wrap;
    gap: 0.5rem 0.75rem;
    align-items: baseline;
    padding: 0.75rem;
    border-radius: 8px;
    background: rgba(31, 143, 120, 0.10);
  }

  .ncc-demo__score strong {
    font-size: 1.5rem;
  }

  .ncc-demo__working {
    margin-top: 0.75rem;
    font-family: var(--global-mono-font-family, "SFMono-Regular", Consolas, "Liberation Mono", monospace);
    font-size: 0.9rem;
    overflow-wrap: anywhere;
  }

  @media (max-width: 720px) {
    .ncc-demo__panels,
    .ncc-demo__controls {
      grid-template-columns: 1fr;
    }
  }
</style>

<script>
  (() => {
    const template = [
      [-1, -1, 1],
      [-1, 1, 1],
      [-1, -1, 1],
    ];

    const image = [
      [1, 1, -1, 1, -1],
      [-1, -1, -1, 1, -1],
      [1, -1, 1, 1, 1],
      [-1, -1, -1, 1, -1],
      [1, 1, -1, -1, 1],
    ];

    const labels = [
      ["A", "B", "C"],
      ["D", "E", "F"],
      ["G", "H", "I"],
    ];

    const templateGrid = document.getElementById("ncc-template-grid");
    const imageGrid = document.getElementById("ncc-image-grid");
    const xInput = document.getElementById("ncc-x");
    const yInput = document.getElementById("ncc-y");
    const xLabel = document.getElementById("ncc-x-label");
    const yLabel = document.getElementById("ncc-y-label");
    const scoreEl = document.getElementById("ncc-score");
    const locationEl = document.getElementById("ncc-location");
    const workingEl = document.getElementById("ncc-working");

    if (!templateGrid || !imageGrid) return;

    const makeCell = (value, extraText = "") => {
      const cell = document.createElement("div");
      cell.className = "ncc-cell";
      cell.dataset.value = String(value);
      cell.textContent = extraText || (value > 0 ? "+1" : "-1");
      return cell;
    };

    template.flat().forEach((value) => templateGrid.appendChild(makeCell(value)));
    image.flat().forEach((value) => imageGrid.appendChild(makeCell(value)));

    const imageCells = Array.from(imageGrid.children);

    const update = () => {
      const x = Number(xInput.value);
      const y = Number(yInput.value);
      let total = 0;
      const products = [];

      imageCells.forEach((cell) => {
        cell.classList.remove("is-active", "is-best");
      });

      for (let row = 0; row < 3; row += 1) {
        for (let col = 0; col < 3; col += 1) {
          const imageValue = image[y + row][x + col];
          const templateValue = template[row][col];
          const product = imageValue * templateValue;
          total += product;
          products.push(product > 0 ? "+1" : "-1");

          const index = (y + row) * 5 + (x + col);
          imageCells[index].classList.add("is-active");
        }
      }

      for (let row = 1; row <= 3; row += 1) {
        for (let col = 1; col <= 3; col += 1) {
          imageCells[row * 5 + col].classList.add("is-best");
        }
      }

      const score = total / 9;
      xLabel.textContent = String(x + 1);
      yLabel.textContent = String(y + 1);
      scoreEl.textContent = `${score >= 0 ? "+" : ""}${score.toFixed(2)}`;
      locationEl.textContent = `position ${labels[y][x]}`;
      workingEl.textContent = `Products: ${products.join(" ")}; total = ${total}; score = ${total}/9`;
    };

    xInput.addEventListener("input", update);
    yInput.addEventListener("input", update);
    update();
  })();
</script>
