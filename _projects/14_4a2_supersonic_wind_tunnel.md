---
layout: page
title: 4A2 Supersonic Wind Tunnel CFD
description: Fortran finite-volume Euler solver extended with Runge-Kutta stepping, residual smoothing, and tanh-refined non-uniform meshes.
img: assets/img/projects/4a2-supersonic-wind-tunnel/tunnel-started-up.png
importance: 0
category: cam-coursework
---

This coursework extended a Fortran CFD solver for 2D inviscid compressible Euler flow. The solver is finite-volume at heart: fluxes are summed through the cell faces, converted into cell residuals, then distributed back to the surrounding nodes.

The final goal was not just to make the bump case converge faster. The interesting test was a generated Mach 2.5 supersonic wind tunnel, where the shock had to start in the first nozzle, travel through the working section, pass the second nozzle, and then shut down again as the back pressure was raised.

<div class="row justify-content-sm-center">
  <div class="col-sm-11 mt-3 mt-md-0">
    {% include video.liquid path="assets/video/projects/4a2-supersonic-wind-tunnel/wind-tunnel-og-sim.mp4" poster="assets/img/projects/4a2-supersonic-wind-tunnel/tunnel-started-up.png" class="img-fluid rounded z-depth-1" controls=true muted=true %}
  </div>
</div>
<div class="caption">
  Supersonic wind tunnel start-up and shut-down. The hard part was avoiding enough artificial-viscosity loss that the second nozzle choked too early and prevented the tunnel from starting.
</div>

## What Changed

The final report grouped the solver improvements into three parts: Runge-Kutta time marching, residual smoothing, and refined non-uniform meshing. Git history lines up with that story:

- `65ed891` added the working RK implementation; `8f86e67` merged it into the residual-smoothing branch.
- `4d451ff` added residual smoothing, with `sfac_res` read from the input and applied to residuals.
- `7288d4a`, `2475a16`, and `61cdfb0` built the `tanh` mesh workflow; `bf4702e` records settings that made the original tunnel start.

## Finite-Volume Core

The finite-volume update lives in `flux_stencil.f90`. The important line is the residual calculation: flux entering from the lower-index faces minus flux leaving through the higher-index faces, scaled by the local cell area and time step.

```fortran
dcell = av%dt/area * ( &
      flux_i(1:ni-1,:)-flux_i(2:ni,:) + &
      flux_j(:,1:nj-1)-flux_j(:,2:nj))

call smooth_array(dcell,av%sfac_res)

dnode(2:ni-1,2:nj-1) = 0.25 * ( &
      dcell(1:ni-2,2:nj-1) + dcell(2:ni-1,2:nj-1) + &
      dcell(1:ni-2,1:nj-2) + dcell(2:ni-1,1:nj-2))

prop = prop + dnode
```

That structure made the later changes fairly clean: higher-order time stepping changed how each main step was marched, residual smoothing changed the `dcell` field before distribution, and mesh refinement changed the geometry and cell areas feeding the same flux machinery.

## 1. Runge-Kutta Time Marching

The basic explicit step was CFL-limited. The report records that RK increased the maximum stable CFL from 0.62 to 4.7 at `sfac=0.21`, roughly a 7.6x increase in allowable CFL. Each main step became more expensive, but the net result was still about twice as fast for comparable smoothing.

```fortran
g%ro_start = g%ro; g%roe_start = g%roe
g%rovx_start = g%rovx; g%rovy_start = g%rovy

do nrkut = 1, nrkuts
    av%dt = av%dt_total / (1 + nrkuts - nrkut)

    call set_secondary(av,g)
    call apply_bconds(av,g,bcs)
    call euler_iteration(av,g)
end do
```

Inside `euler_iteration.f90`, each conserved variable is restored to the start-of-main-step value before applying the substep residual:

```fortran
g%ro = g%ro_start
call sum_fluxes(av,mass_i,mass_j,g%area,g%ro,g%dro)
```

<div class="row justify-content-sm-center">
  <div class="col-sm-6 mt-3 mt-md-0">
    {% include figure.liquid loading="lazy" path="assets/img/projects/4a2-supersonic-wind-tunnel/bump-cfl-d-max.png" title="Bump-case residual error against CFL" class="img-fluid rounded z-depth-1" %}
  </div>
  <div class="col-sm-6 mt-3 mt-md-0">
    {% include figure.liquid loading="lazy" path="assets/img/projects/4a2-supersonic-wind-tunnel/bump-cfl-runtime.png" title="Bump-case runtime against CFL" class="img-fluid rounded z-depth-1" %}
  </div>
</div>
<div class="caption">
  CFL sweeps from the interim analysis: smaller CFL improves accuracy but costs runtime; RK made much larger stable CFL values usable.
</div>

## 2. Residual Smoothing

The basic solver already used smoothing as artificial viscosity on the primary variables. That stabilised shocks, but it also caused unphysical stagnation-pressure loss. The residual-smoothing improvement instead smooths the residual before nodal distribution:

```fortran
! read_settings.f90
read(5,*) av%sfac_res

! flux_stencil.f90
dcell = av%dt/area * ( &
      flux_i(1:ni-1,:)-flux_i(2:ni,:) + &
      flux_j(:,1:nj-1)-flux_j(:,2:nj))

call smooth_array(dcell,av%sfac_res)
```

In the final report, adding residual smoothing at `sfac_res=0.5` raised the maximum CFL from 4.7 to 7.2, and reduced the minimum stable primary smoothing factor from `0.0005` to `0.0002`.

<div class="row justify-content-sm-center">
  <div class="col-sm-6 mt-3 mt-md-0">
    {% include figure.liquid loading="lazy" path="assets/img/projects/4a2-supersonic-wind-tunnel/bump-sfac-d-max.png" title="Bump-case residual error against smoothing factor" class="img-fluid rounded z-depth-1" %}
  </div>
  <div class="col-sm-6 mt-3 mt-md-0">
    {% include figure.liquid loading="lazy" path="assets/img/projects/4a2-supersonic-wind-tunnel/bump-conv-smallest-sfac.png" title="Bump-case convergence near minimum stable smoothing factor" class="img-fluid rounded z-depth-1" %}
  </div>
</div>
<div class="caption">
  Smoothing-factor sweeps show the accuracy-stability trade-off: less smoothing reduces artificial diffusion, until the solver becomes unstable.
</div>

## 3. Non-Uniform Tanh Meshing

The most visible improvement was the mesh. I used constant-density sections joined by smooth `tanh` patches, so cells could be concentrated where the geometry and flow direction changed quickly without introducing abrupt jumps in cell size.

```fortran
subroutine tanh_patch(dx1,dx2,x)
  s = atanh(1/(1+epsilon))

  call linspace(-s, s, ss)
  dx = tanh(ss)
  dx = dx / 2 * (dx2 - dx1) + (dx1 + dx2)/2

  do n = 2,nn-1
        x(n) = x(1) + sum(dx(1:n-1))
  end do
end subroutine tanh_patch
```

Because the number of cells in a `tanh` patch is discrete, I added a Python helper to iteratively adjust segment boundaries and reduce truncation error before the Fortran solver read the mesh definition. The Fortran side then computed the number of patch cells and rejected sharp transitions:

```fortran
call fill_tanh_num_of_cell(av%si_geom_start,av%si_geom_end,av%ni_cells,&
      rounding_error)

if (rounding_error > 0.1) then
      write(6,*) '  Sharp Cell size change expected! Adjust mesh input!'
      do; end do;
end if
```

<div class="row justify-content-sm-center">
  <div class="col-sm-6 mt-3 mt-md-0">
    {% include figure.liquid loading="lazy" path="assets/img/projects/4a2-supersonic-wind-tunnel/refined-tanh-bump-mesh.png" title="Refined tanh mesh for the bump case" class="img-fluid rounded z-depth-1" %}
  </div>
  <div class="col-sm-6 mt-3 mt-md-0">
    {% include figure.liquid loading="lazy" path="assets/img/projects/4a2-supersonic-wind-tunnel/refined-tanh-bump-mach.png" title="Bump-case Mach contour on the refined mesh" class="img-fluid rounded z-depth-1" %}
  </div>
</div>
<div class="caption">
  The bump mesh was denser around the geometry change and near the lower wall. In the report, the combined improvements reduced convergence iterations to about 15 percent of the basic solver.
</div>

## Tunnel Start-Up

The tunnel case was sensitive because numerical diffusion acted like a stagnation-pressure loss. With too much loss in the first nozzle, the second nozzle choked before the normal shock entered the working section, causing a no-start. The successful mesh focused i-direction density and cell aspect ratio in the first-nozzle diffuser, working section, and around the sharp second nozzle.

<div class="row justify-content-sm-center">
  <div class="col-sm-10 mt-3 mt-md-0">
    {% include figure.liquid loading="lazy" path="assets/img/projects/4a2-supersonic-wind-tunnel/tunnel-og-success-mesh.png" title="Successful wind tunnel mesh" class="img-fluid rounded z-depth-1" %}
  </div>
</div>
<div class="caption">
  Successful tunnel mesh. The close-to-square cells in key regions reduced artificial-viscosity losses enough for the tunnel to start.
</div>

The start-up sequence in the final report is:

- At high back pressure, the initial transients die away and the flow remains largely subsonic.
- As back pressure drops, a shock moves down the first nozzle and into the working section.
- At about `P_out/P_0 = 0.405`, a normal shock forms in the working section with pre-shock Mach number about 2.49.
- The shock passes the second nozzle, after which the tunnel reaches a continuously working state.
- Raising back pressure sends the normal shock back through the second throat and eventually shuts the tunnel down.

<div class="row justify-content-sm-center">
  <div class="col-sm-4 mt-3 mt-md-0">
    {% include figure.liquid loading="lazy" path="assets/img/projects/4a2-supersonic-wind-tunnel/tunnel-shock-working-section.png" title="Shock moving through the working section" class="img-fluid rounded z-depth-1" %}
  </div>
  <div class="col-sm-4 mt-3 mt-md-0">
    {% include figure.liquid loading="lazy" path="assets/img/projects/4a2-supersonic-wind-tunnel/tunnel-started-up.png" title="Fully started tunnel" class="img-fluid rounded z-depth-1" %}
  </div>
  <div class="col-sm-4 mt-3 mt-md-0">
    {% include figure.liquid loading="lazy" path="assets/img/projects/4a2-supersonic-wind-tunnel/tunnel-shutting-down.png" title="Tunnel shutting down" class="img-fluid rounded z-depth-1" %}
  </div>
</div>
<div class="caption">
  Start-up to shut-down: shock motion through the working section, fully started flow, and reverse shock motion during shut-down.
</div>

## Why The Mesh Mattered

The report's key physical diagnosis was that the no-start case was not just a numerical annoyance. A coarser or poorly shaped mesh introduced enough artificial stagnation-pressure loss that the second throat became the limiting choke point. In the no-start comparison, the stagnation pressure dropped by about 8 percent in the diverging part of the first nozzle, enough to make the would-be fully started state incompatible with the second-nozzle mass-flow limit.

<div class="row justify-content-sm-center">
  <div class="col-sm-6 mt-3 mt-md-0">
    {% include figure.liquid loading="lazy" path="assets/img/projects/4a2-supersonic-wind-tunnel/tunnel-no-start-mach.png" title="No-start Mach contour" class="img-fluid rounded z-depth-1" %}
  </div>
  <div class="col-sm-6 mt-3 mt-md-0">
    {% include figure.liquid loading="lazy" path="assets/img/projects/4a2-supersonic-wind-tunnel/tunnel-no-start-conservation.png" title="No-start conservation plot" class="img-fluid rounded z-depth-1" %}
  </div>
</div>
<div class="caption">
  No-start case: excessive numerical loss prevents the original tunnel from reaching the intended started state.
</div>

<div class="row justify-content-sm-center">
  <div class="col-sm-10 mt-3 mt-md-0">
    {% include figure.liquid loading="lazy" path="assets/img/projects/4a2-supersonic-wind-tunnel/tunnel-og-convergence.png" title="Tunnel start-up and shut-down convergence history" class="img-fluid rounded z-depth-1" %}
  </div>
</div>
<div class="caption">
  Convergence history across the full transient tunnel simulation. The start-up and shut-down parts are not symmetric because the shock path and back-pressure ramp differ.
</div>

## Highlights To Fill In

- TODO: add the short personal note on what felt most satisfying or painful while tuning the tunnel case.
- TODO: add exact runtime or machine details if I want this page to read more like an engineering postmortem.
