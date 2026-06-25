---
layout: page
title: 4A2 Supersonic Wind Tunnel CFD
description: My Fortran finite-volume Euler solver, extended with higher-order time marching, residual smoothing, and tanh-refined non-uniform meshes.
img: assets/img/projects/4a2-supersonic-wind-tunnel/tunnel-started-up.png
importance: 0
category: cam-coursework
---

I built this for the 4A2 Computational Fluid Dynamics coursework: a Fortran solver for two-dimensional inviscid compressible Euler flow, then extended it until it could simulate a supersonic wind tunnel starting, running, and shutting down.

The most important result is the video below. A normal shock starts in the first nozzle, moves through the working section, passes the second nozzle, and then returns during shut-down. Getting this to run was mostly a numerical-method problem: too much artificial viscosity made the tunnel lose stagnation pressure and no-start.

<div class="row justify-content-sm-center">
  <div class="col-sm-11 mt-3 mt-md-0">
    {% include video.liquid path="assets/video/projects/4a2-supersonic-wind-tunnel/wind-tunnel-og-sim.mp4" poster="assets/img/projects/4a2-supersonic-wind-tunnel/tunnel-started-up.png" class="img-fluid rounded z-depth-1" controls=true muted=true %}
  </div>
</div>
<div class="caption">
  Supersonic wind tunnel start-up and shut-down from my unsteady Euler solver.
</div>

## The FVM Core

The handout starts from a simple finite-volume Euler solver. The version I worked with stores flow variables at nodes, but computes the change in each cell from the flux imbalance through its four faces.

In compact form, the solver does this:

$$
\Delta U =
\frac{\Delta t}{A}
\left(
F_{i-1/2} - F_{i+1/2}
+ F_{j-1/2} - F_{j+1/2}
\right)
$$

and then distributes that cell change back to the four surrounding nodes.

```fortran
! flux_stencil.f90
dcell = av%dt/area * ( &
      flux_i(1:ni-1,:)-flux_i(2:ni,:) + &
      flux_j(:,1:nj-1)-flux_j(:,2:nj))

dnode(2:ni-1,2:nj-1) = 0.25 * ( &
      dcell(1:ni-2,2:nj-1) + dcell(2:ni-1,2:nj-1) + &
      dcell(1:ni-2,1:nj-2) + dcell(2:ni-1,1:nj-2))

prop = prop + dnode
```

This is the part I want a viewer to see first: every later improvement still feeds this same finite-volume update. I changed how the time derivative was estimated, how residuals were stabilised, and how the mesh placed cells around difficult geometry.

## Higher-Order Time Marching

The handout presents Runge-Kutta as a way to improve temporal accuracy and stability. I implemented it by storing the state at the beginning of a main time step, then taking multiple substeps with fractional time steps.

```fortran
! solver.f90
g%ro_start = g%ro; g%roe_start = g%roe
g%rovx_start = g%rovx; g%rovy_start = g%rovy

do nrkut = 1, nrkuts
    av%dt = av%dt_total / (1 + nrkuts - nrkut)

    call set_secondary(av,g)
    call apply_bconds(av,g,bcs)
    call euler_iteration(av,g)
end do
```

Inside the Euler iteration, the conserved variable is restored to the start-of-step state before applying the current substep residual:

```fortran
! euler_iteration.f90
g%ro = g%ro_start
call sum_fluxes(av,mass_i,mass_j,g%area,g%ro,g%dro)
```

This made the solver tolerate much larger CFL numbers. That mattered because the unsteady wind tunnel needed many frames: a stable larger time step meant I could simulate the full start-up and shut-down sequence without the run becoming painfully slow.

<div class="row justify-content-sm-center">
  <div class="col-sm-6 mt-3 mt-md-0">
    {% include figure.liquid loading="lazy" path="assets/img/projects/4a2-supersonic-wind-tunnel/bump-cfl-d-max.png" title="Bump-case residual error against CFL" class="img-fluid rounded z-depth-1" %}
  </div>
  <div class="col-sm-6 mt-3 mt-md-0">
    {% include figure.liquid loading="lazy" path="assets/img/projects/4a2-supersonic-wind-tunnel/bump-cfl-runtime.png" title="Bump-case runtime against CFL" class="img-fluid rounded z-depth-1" %}
  </div>
</div>
<div class="caption">
  CFL diagnostics from the bump case. Higher-order time marching lets the solver use larger stable time steps.
</div>

## Residual Smoothing

The original solver used artificial-viscosity smoothing on the flow variables. That stabilises the calculation, but it also changes the solution directly. For the tunnel this is dangerous: excessive numerical diffusion becomes an artificial stagnation-pressure loss.

The handout distinguishes residual averaging from ordinary smoothing: smooth the changes, not the state. I added a separate residual smoothing factor and applied it inside the finite-volume update before the cell residuals are distributed to nodes.

```fortran
! read_settings.f90
read(5,*) av%sfac_res

! flux_stencil.f90
dcell = av%dt/area * ( &
      flux_i(1:ni-1,:)-flux_i(2:ni,:) + &
      flux_j(:,1:nj-1)-flux_j(:,2:nj))

call smooth_array(dcell,av%sfac_res)
```

This was a stability tool for the higher-order time scheme. It let me reduce the primary smoothing factor while keeping the solver usable around shocks.

<div class="row justify-content-sm-center">
  <div class="col-sm-6 mt-3 mt-md-0">
    {% include figure.liquid loading="lazy" path="assets/img/projects/4a2-supersonic-wind-tunnel/bump-sfac-d-max.png" title="Bump-case residual error against smoothing factor" class="img-fluid rounded z-depth-1" %}
  </div>
  <div class="col-sm-6 mt-3 mt-md-0">
    {% include figure.liquid loading="lazy" path="assets/img/projects/4a2-supersonic-wind-tunnel/bump-conv-smallest-sfac.png" title="Bump-case convergence near minimum stable smoothing factor" class="img-fluid rounded z-depth-1" %}
  </div>
</div>
<div class="caption">
  Smoothing diagnostics. Lower smoothing reduces artificial diffusion, but if it is pushed too far the residuals stop behaving.
</div>

## Tanh Non-Uniform Mesh

The handout suggests refined mesh density as a route to spatial accuracy or reduced cost. My version uses constant-density sections joined by smooth `tanh` patches. This let me place cells around geometry changes without introducing abrupt jumps in spacing.

```fortran
! routines.f90
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

The generated `si` and `sj` spacing vectors are then used exactly where the basic solver used uniform `linspace`:

```fortran
! generate_mesh.f90
do i = 1, av%ni_segs, 2
      call linspace(av%si_geom_start(i),av%si_geom_end(i),&
            si(av%ni_node_start(i):av%ni_node_end(i)))
end do

do i = 2, av%ni_segs, 2
      call tanh_patch( &
            si(av%ni_node_start(i))-si(av%ni_node_start(i)-1), &
            si(av%ni_node_end(i)+1)-si(av%ni_node_end(i)), &
            si(av%ni_node_start(i):av%ni_node_end(i)) &
            )
end do
```

One practical issue is that a `tanh` patch can only contain an integer number of cells. I wrote a small Python helper to adjust the segment boundaries until the continuous patch length and integer cell count agreed closely enough.

```python
# generate_tanh_mesh.py
N_float = L_old / x_avg
N_int = max(1, round(N_float))
L_new = N_int * x_avg

delta = L_new - L_old
left.x_end -= delta/2/deceleration
patch.x_start = left.x_end
patch.x_end += delta/2/deceleration
right.x_start = patch.x_end
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
  Bump-case mesh diagnostic: cells are concentrated where the wall shape changes and where the near-wall flow is sensitive.
</div>

## Mesh Diagnosis For The Tunnel

The tunnel did not start just because I made the mesh larger. It started because the cells became better placed. The key region was the first-nozzle diffuser and the second nozzle, where bad aspect ratio and coarse spacing made artificial viscosity remove too much stagnation pressure.

<div class="row justify-content-sm-center">
  <div class="col-sm-6 mt-3 mt-md-0">
    {% include figure.liquid loading="lazy" path="assets/img/projects/4a2-supersonic-wind-tunnel/tunnel-og-success-mesh-zoomed.png" title="Successful tunnel mesh near the first throat" class="img-fluid rounded z-depth-1" %}
  </div>
  <div class="col-sm-6 mt-3 mt-md-0">
    {% include figure.liquid loading="lazy" path="assets/img/projects/4a2-supersonic-wind-tunnel/tunnel-og-failed-mesh-zoomed.png" title="No-start mesh diagnostic near the first throat" class="img-fluid rounded z-depth-1" %}
  </div>
</div>
<div class="caption">
  Mesh diagnosis: the successful case uses better cell aspect ratio in the sensitive diffuser region. The no-start case loses too much stagnation pressure before the working section can start.
</div>

<div class="row justify-content-sm-center">
  <div class="col-sm-10 mt-3 mt-md-0">
    {% include figure.liquid loading="lazy" path="assets/img/projects/4a2-supersonic-wind-tunnel/tunnel-og-success-mesh.png" title="Full successful wind tunnel mesh" class="img-fluid rounded z-depth-1" %}
  </div>
</div>
<div class="caption">
  Full mesh used for the successful original wind tunnel start-up.
</div>

## Tunnel Result

With the higher-order time stepping, residual smoothing, and diagnostic mesh refinement together, I could run the original tunnel geometry through the full transient sequence.

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
  Three moments from the transient run: shock in the working section, fully started tunnel, and shut-down.
</div>

The diagnostic no-start case is useful because it shows what the method was fighting. In that case the second nozzle chokes too early, so the working section never reaches the intended started state.

<div class="row justify-content-sm-center">
  <div class="col-sm-6 mt-3 mt-md-0">
    {% include figure.liquid loading="lazy" path="assets/img/projects/4a2-supersonic-wind-tunnel/tunnel-no-start-mach.png" title="No-start Mach contour" class="img-fluid rounded z-depth-1" %}
  </div>
  <div class="col-sm-6 mt-3 mt-md-0">
    {% include figure.liquid loading="lazy" path="assets/img/projects/4a2-supersonic-wind-tunnel/tunnel-no-start-conservation.png" title="No-start conservation diagnostic" class="img-fluid rounded z-depth-1" %}
  </div>
</div>
<div class="caption">
  No-start diagnostic: the solver result exposes the artificial stagnation-pressure loss that stops the tunnel from starting.
</div>

<div class="row justify-content-sm-center">
  <div class="col-sm-10 mt-3 mt-md-0">
    {% include figure.liquid loading="lazy" path="assets/img/projects/4a2-supersonic-wind-tunnel/tunnel-og-convergence.png" title="Tunnel start-up and shut-down convergence history" class="img-fluid rounded z-depth-1" %}
  </div>
</div>
<div class="caption">
  Residual history across the unsteady start-up and shut-down run.
</div>

## Highlights To Fill In

- TODO: add one sentence on what I personally found most satisfying about getting the original tunnel to start.
- TODO: add one sentence on the tuning pain point: artificial viscosity, mesh aspect ratio, or pressure ramp rate.
