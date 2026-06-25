---
layout: page
title: JAX-Accelerated Heat Transfer Solver
description: Explicit finite-difference heat-conduction solvers, from unstable polar grids to Cartesian masks and JAX-accelerated stencil updates.
img: assets/img/projects/heat-transfer-jax/semicircle-conduction.png
importance: 1
category: fun
github: https://github.com/hylucalin/heat_and_mass_transfer
---

This project was my personal extension to the Cambridge 3A6 Heat and Mass Transfer examples. I wanted to see whether I could build a simple heat-conduction solver for circular and semicircular domains, understand its numerical weaknesses, and then accelerate it enough to explore finer grids.

The project became a useful numerical-method exercise: I first tried polar coordinates because the geometry looked circular, found the update difficult to keep stable, moved to Cartesian grids with masks, and finally rewrote the core stencil in JAX.

<a class="btn btn-sm btn-outline-primary" href="https://github.com/hylucalin/heat_and_mass_transfer">View code on GitHub</a>

## What I Developed

The important development path was:

- a polar-coordinate finite-difference solver for a circular cross-section;
- a theta-direction smoothing experiment to diagnose and reduce angular striping;
- a Cartesian-grid solver using the standard five-point Laplacian;
- masked semicircle domains for conduction and conduction-plus-convection cases;
- JAX-accelerated stencil updates for faster iteration on finer grids;
- a time-step stability check showing the explicit 2D heat equation breaking down near $\alpha \Delta t / \Delta x^2 = 1/4$ on a square grid.

The GitHub repository is included for the source code, but the story here is the engineering process: what failed, what became more stable, and what the acceleration made possible.

## 1. Polar Coordinates Looked Natural, But Were Fragile

For a circular cross-section, polar coordinates were the tempting first choice. The heat-equation stencil included the expected $1/r$ and $1/r^2$ terms:

```python
dT_dr = (T[r_index, theta_index] - T[r_index-1, theta_index]) / cell_size_r
dT_dr_next = (T[r_index+1, theta_index] - T[r_index, theta_index]) / cell_size_r
d2T_dr2 = (dT_dr_next - dT_dr) / cell_size_r

dT_dtheta = (T[r_index, (theta_index+1)%Num_of_theta_cell] - T[r_index, theta_index]) / cell_size_theta
dT_dtheta_next = (T[r_index, (theta_index+2)%Num_of_theta_cell] - T[r_index, (theta_index+1)%Num_of_theta_cell]) / cell_size_theta
d2T_dtheta2 = (dT_dtheta_next - dT_dtheta) / cell_size_theta

T_Lagrangian = (1/r) * dT_dr + d2T_dr2 + (1/r**2) * d2T_dtheta2
dT_dt = alpha * T_Lagrangian + g_dot / pho_cp
```

This was a good lesson: matching the coordinate system to the geometry does not automatically make the discretisation stable. Near the origin, the angular term is amplified and the physical cell size changes strongly with radius. The result was a striped temperature field. I tried smoothing in the theta direction with a weighted convolution, which made the plots look more reasonable, but it was also a sign that the scheme was being held together by artificial diffusion.

<div class="row justify-content-sm-center">
  <div class="col-sm-4 mt-3 mt-md-0">
    {% include figure.liquid loading="lazy" path="assets/img/projects/heat-transfer-jax/polar-instability.png" title="Polar-coordinate instability" class="img-fluid rounded z-depth-1" %}
  </div>
  <div class="col-sm-4 mt-3 mt-md-0">
    {% include figure.liquid loading="lazy" path="assets/img/projects/heat-transfer-jax/polar-stabilised-colorplot.png" title="Smoothed polar result" class="img-fluid rounded z-depth-1" %}
  </div>
  <div class="col-sm-4 mt-3 mt-md-0">
    {% include figure.liquid loading="lazy" path="assets/img/projects/heat-transfer-jax/polar-theta-averaged-section.png" title="Theta-averaged radial profile" class="img-fluid rounded z-depth-1" %}
  </div>
</div>
<div class="caption">
  The polar-grid experiment was valuable because it failed visibly. Smoothing removed the worst angular stripes, but it also pushed me toward a more robust formulation.
</div>

## 2. Cartesian Grids Made The Solver Easier To Trust

The next version used a Cartesian grid and the standard five-point Laplacian. The circular or semicircular domain is handled by a mask, so the numerical update stays simple even when the geometry is curved.

```python
dT_dx = (T[x_index, y_index] - T[x_index-1, y_index]) / cell_size_x
dT_dx_next = (T[x_index+1, y_index] - T[x_index, y_index]) / cell_size_x
d2T_dx2 = (dT_dx_next - dT_dx) / cell_size_x

dT_dy = (T[x_index, y_index] - T[x_index, y_index-1]) / cell_size_y
dT_dy_next = (T[x_index, y_index+1] - T[x_index, y_index]) / cell_size_y
d2T_dy2 = (dT_dy_next - dT_dy) / cell_size_y

dT_dt = alpha * (d2T_dx2 + d2T_dy2) + g_dot / pho_cp
```

For EP1 Q2e, I modelled a semicircle heated along the diameter and held near ambient on the arc. For Q2f, I added a convective boundary term on the curved edge:

```python
dT_dt = (
    qx/cell_size_x
    + qy/cell_size_y
    - h*arc_length*(T[x_index, y_index] - T0)/(cell_size_x*cell_size_y)
) / pho_cp
```

<div class="row justify-content-sm-center">
  <div class="col-sm-6 mt-3 mt-md-0">
    {% include figure.liquid loading="lazy" path="assets/img/projects/heat-transfer-jax/semicircle-conduction.png" title="Semicircle conduction case" class="img-fluid rounded z-depth-1" %}
  </div>
  <div class="col-sm-6 mt-3 mt-md-0">
    {% include figure.liquid loading="lazy" path="assets/img/projects/heat-transfer-jax/semicircle-convection-high-h.png" title="Semicircle conduction and convection case" class="img-fluid rounded z-depth-1" %}
  </div>
</div>
<div class="caption">
  Cartesian masks made the semicircle cases much easier to reason about: the stencil stayed regular, while the mask controlled where the body existed.
</div>

## 3. JAX Turned The Loop Into A Stencil

The original Python loops were useful for debugging because every derivative was visible, but they were slow. The JAX version moved the update into compiled array operations:

```python
@jit
def jax_laplacian(T, ds=cell_size_x):
  return (
      -4*T
      + jnp.roll(T, 1, axis=0) + jnp.roll(T, -1, axis=0)
      + jnp.roll(T, 1, axis=1) + jnp.roll(T, -1, axis=1)
  ) / (ds*ds)

@jit
def step(T, mask, dt=time_step):
  dT = dt * (alpha * jax_laplacian(T) + g_dot/pho_cp)
  T = jnp.where(mask, T + dT, T)
  T = T.at[0, :].set(T[1, :])
  return T
```

That change forced a cleaner separation between physics, boundary conditions, and plotting. It also made the stability limit much more obvious: once the update was cheap, I could sweep the time step and see the explicit scheme break down near the expected $1/4$ diffusion number.

The main technical lesson was that performance work came after numerical trust. JAX made the code faster, but the important engineering choice was moving from a fragile polar formulation to a Cartesian stencil whose stability and boundary behaviour I could inspect.
