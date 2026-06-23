---
layout: post
title: "Dyson Day Outreach: Drone Design and Image Tracking"
date: 2026-06-19 12:00:00
description: A brief report on my James Dyson funded outreach activity about drone payload design, sensor trade-offs, and normalised cross correlation.
tags: outreach drones image-processing ncc james-dyson
categories: outreach
thumbnail: assets/img/blog/dyson-day-2026/ncc-paper-game-contact-sheet.png
---

On 19 June 2026, I delivered an outreach presentation for Dyson Day as the recipient of James Dyson funding for my fourth-year project. The aim was to turn my project into a hands-on engineering activity: rather than only describing a drone-based cloud observation system, I invited students to think through how a drone can make useful measurements when every sensor is imperfect.

My project uses a small drone carrying a camera and onboard sensors to investigate how cloud droplet size distributions might be retrieved from polarimetric images. For the outreach session, I simplified that into a more tangible design question:

> How can a drone work out where an object is relative to itself using incomplete sensor data?

The example scene was a drone flying over a flat grassland with one clearly visible tree. The students' task was to design a payload that could estimate the relative position between the drone and the tree. This kept the discussion grounded in something visible, while still preserving the real engineering ideas behind the project: image tracking, sensor fusion, uncertainty, calibration, and trade-offs.

## Drone Payload Design

Students were given six possible payload components:

- camera;
- gimbal;
- laser range finder;
- GPS module;
- flight controller / IMU;
- onboard computer.

Each component gave a different clue. A camera could show where the tree appeared in the image, but not directly how far away it was. GPS could locate the drone, but not the tree unless the image data were also interpreted. An IMU could describe attitude and motion, but drift and calibration errors matter. A laser range finder could measure distance accurately if it was pointed at the right target. An onboard computer could run image-processing logic, but added cost, weight, and power demand.

The students worked in small groups with a limited budget, so they could not simply choose everything. That forced a useful engineering conversation: which information is essential, which measurements can be inferred, and which uncertainties would dominate the design?

Three natural data-retrieval strategies emerged:

1. **Position-first retrieval:** use GPS and IMU data to estimate where the drone is and how it is pointing, then combine that with a camera image to infer the tree direction.
2. **Image-first retrieval:** use the camera and onboard computer to detect and track the tree from frame to frame, then use drone attitude or motion to convert image movement into a relative-position estimate.
3. **Active pointing retrieval:** use a gimbal and laser range finder to point at the tree and directly measure the distance, while using GPS/IMU data to place that measurement in the drone's frame.

The important lesson was that no design was perfect. A cheap camera-only system might be light and simple but ambiguous in distance. A range-finder system might be more accurate but heavier, more expensive, and harder to align. A GPS/IMU-heavy system might be elegant on paper but sensitive to calibration and coordinate-frame errors. This is exactly the kind of trade-off that appears in real scientific drone payloads.

## From Drone Design to Pattern Matching

After the payload discussion, I focused on the camera-based solution. If a drone sees the tree in one image, how can it recognise the same tree in the next image?

This was the bridge to normalised cross correlation (NCC). I introduced NCC as a pattern-matching score: the computer remembers a small patch, slides it over a new image, and asks where the bright and dark pattern matches best. Instead of starting with full image-processing notation, I simplified the template to values of `+1` and `-1`:

- `+1` means "this part of the remembered patch is bright";
- `-1` means "this part is dark";
- the score is high when bright parts line up with bright parts and dark parts line up with dark parts.

In the paper version of the activity, students used a physical 3x3 sliding mask over a 5x5 grid. At each position, they multiplied the nine image values by the nine template values, added the products, and divided by 9. The best-matching location had the highest score.

<div class="row mt-3 justify-content-sm-center">
  <div class="col-sm-10 mt-3 mt-md-0">
    {% include figure.liquid loading="eager" path="assets/img/blog/dyson-day-2026/ncc-paper-game-contact-sheet.png" class="img-fluid rounded z-depth-1" %}
  </div>
</div>
<div class="caption">
  Printable material used for the NCC paper game: a 3x3 tracker, a 5x5 image frame, score sheets, and extensions about colour and false matches.
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

For the activity, I also explained why brightness or intensity is often a better first choice than exact colour matching. The same object can look different in colour when the light changes, when the camera exposure changes, or when clouds and shadows move across the scene. Colour can still be useful, but exact hue is fragile.

Intensity structure is usually more stable. If a patch has a dark-left, bright-right pattern, that structure can remain recognisable even if the whole image becomes brighter, dimmer, or slightly tinted. That is why NCC is often introduced through brightness patterns: it teaches the idea of matching structure rather than trusting raw colour labels.

In the real project, this connects back to cloud imaging. The drone is not just taking photographs; it is collecting measurements. To turn images into physical information, the system must understand which parts of the image are comparable, which changes are caused by geometry or lighting, and which changes contain the scientific signal.

## Outreach Outcome

The session was designed to show that engineering is not only about adding more hardware. It is about choosing the right measurements, understanding uncertainty, and combining imperfect clues carefully.

By the end of the activity, students had:

- compared different drone payload designs under cost and practicality constraints;
- discussed why sensor accuracy, weight, power, and calibration matter;
- seen three different ways to retrieve relative-position information;
- used a physical NCC game to understand image tracking;
- connected a simple tree-tracking example to a real drone-based cloud observation project.

The drone design activity provided the systems-engineering context, while the NCC activity gave students a concrete way to experience the image-recognition idea. That balance was important: the drone made the problem tangible, but the main technical concept was that a computer can track visual patterns by comparing local intensity structure across images.

<style>
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
