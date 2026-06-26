// get the ninja-keys element
const ninja = document.querySelector('ninja-keys');

// add the home and posts menu items
ninja.data = [{
    id: "nav-about",
    title: "about",
    section: "Navigation",
    handler: () => {
      window.location.href = "/";
    },
  },{id: "nav-blog",
          title: "blog",
          description: "",
          section: "Navigation",
          handler: () => {
            window.location.href = "/blog/";
          },
        },{id: "nav-projects",
          title: "Projects",
          description: "A growing collection of my projects.",
          section: "Navigation",
          handler: () => {
            window.location.href = "/projects/";
          },
        },{id: "nav-cv",
          title: "cv",
          description: "A public-facing snapshot of my engineering work across drones, climate sensing, fluid dynamics, hardware, and code.",
          section: "Navigation",
          handler: () => {
            window.location.href = "/cv/";
          },
        },{id: "dropdown-photos",
              title: "photos",
              description: "",
              section: "Dropdown",
              handler: () => {
                window.location.href = "/photos/";
              },
            },{id: "dropdown-external-links",
              title: "external links",
              description: "",
              section: "Dropdown",
              handler: () => {
                window.location.href = "/external_links/";
              },
            },{id: "post-climate-and-nature-research-showcase-poster",
        
          title: "Climate and Nature Research Showcase Poster",
        
        description: "A brief note on my poster for the 26 June 2026 Climate and Nature Research Showcase.",
        section: "Posts",
        handler: () => {
          
            window.location.href = "/blog/2026/climate-nature-research-showcase-poster/";
          
        },
      },{id: "post-dyson-day-outreach-introduction-to-my-4th-year-project",
        
          title: "Dyson Day Outreach: Introduction to My 4th Year Project",
        
        description: "A very brief introduction to my fourth-year project for Dyson Day outreach.",
        section: "Posts",
        handler: () => {
          
            window.location.href = "/blog/2026/dyson-day-introduction-to-iib-project/";
          
        },
      },{id: "post-dyson-day-outreach-activity-summary-drone-design-and-image-tracking",
        
          title: "Dyson Day Outreach Activity Summary: Drone Design and Image Tracking",
        
        description: "A brief report on my James Dyson funded outreach activity about drone payload design, sensor trade-offs, and normalised cross correlation.",
        section: "Posts",
        handler: () => {
          
            window.location.href = "/blog/2026/dyson-day-drone-design-ncc/";
          
        },
      },{id: "post-cues-funded-atmospheric-profiling-drone",
        
          title: "CUES-funded Atmospheric Profiling Drone",
        
        description: "The basic sensing idea behind my CUES-funded atmospheric profiling drone logger.",
        section: "Posts",
        handler: () => {
          
            window.location.href = "/blog/2026/atmospheric-profiling-drone/";
          
        },
      },{id: "books-the-godfather",
          title: 'The Godfather',
          description: "",
          section: "Books",handler: () => {
              window.location.href = "/books/the_godfather/";
            },},{id: "news-a-simple-inline-announcement",
          title: 'A simple inline announcement.',
          description: "",
          section: "News",},{id: "news-a-long-announcement-with-details",
          title: 'A long announcement with details',
          description: "",
          section: "News",handler: () => {
              window.location.href = "/news/announcement_2/";
            },},{id: "news-a-simple-inline-announcement-with-markdown-emoji-sparkles-smile",
          title: 'A simple inline announcement with Markdown emoji! :sparkles: :smile:',
          description: "",
          section: "News",},{id: "projects-cloudbow-polarisation-lut-explorer",
          title: 'Cloudbow Polarisation LUT Explorer',
          description: "Interactive lookup-table viewer for how cloud droplet size distributions shape the P12 cloudbow signal.",
          section: "Projects",handler: () => {
              window.location.href = "/projects/10_cloudbow_lut/";
            },},{id: "projects-atmospheric-profiling-drone-logger",
          title: 'Atmospheric Profiling Drone Logger',
          description: "A CUES-sponsored personal drone payload for measuring near-ground temperature, humidity, and wind profiles.",
          section: "Projects",handler: () => {
              window.location.href = "/projects/11_atmospheric_profiling_drone/";
            },},{id: "projects-outreach-activity-measuring-cloud-droplets-from-a-drone",
          title: 'Outreach Activity: Measuring Cloud Droplets From a Drone',
          description: "An accessible case study about using drones to record polarised light, and to measure tiny cloud droplets with these information.",
          section: "Projects",handler: () => {
              window.location.href = "/projects/12_drone_cloud_droplet_measurement/";
            },},{id: "projects-climate-and-nature-research-showcase-poster",
          title: 'Climate and Nature Research Showcase Poster',
          description: "Poster for my 26 June 2026 Climate and Nature Research Showcase presentation on drone-borne polarimetric cloud droplet retrieval.",
          section: "Projects",handler: () => {
              window.location.href = "/projects/13_climate_nature_research_showcase_poster/";
            },},{id: "projects-4a2-supersonic-wind-tunnel-cfd",
          title: '4A2 Supersonic Wind Tunnel CFD',
          description: "My Fortran finite-volume Euler solver, extended with higher-order time marching, residual smoothing, and tanh-refined non-uniform meshes.",
          section: "Projects",handler: () => {
              window.location.href = "/projects/14_4a2_supersonic_wind_tunnel/";
            },},{id: "projects-jax-accelerated-heat-transfer-solver",
          title: 'JAX-Accelerated Heat Transfer Solver',
          description: "Explicit finite-difference heat-conduction solvers, from unstable polar grids to Cartesian masks and JAX-accelerated stencil updates.",
          section: "Projects",handler: () => {
              window.location.href = "/projects/15_heat_transfer_jax/";
            },},{id: "projects-project-1",
          title: 'project 1',
          description: "with background image",
          section: "Projects",handler: () => {
              window.location.href = "/projects/1_project/";
            },},{id: "projects-project-2",
          title: 'project 2',
          description: "a project with a background image and giscus comments",
          section: "Projects",handler: () => {
              window.location.href = "/projects/2_project/";
            },},{id: "projects-project-3-with-very-long-name",
          title: 'project 3 with very long name',
          description: "a project that redirects to another website",
          section: "Projects",handler: () => {
              window.location.href = "/projects/3_project/";
            },},{id: "projects-project-4",
          title: 'project 4',
          description: "another without an image",
          section: "Projects",handler: () => {
              window.location.href = "/projects/4_project/";
            },},{id: "projects-project-5",
          title: 'project 5',
          description: "a project with a background image",
          section: "Projects",handler: () => {
              window.location.href = "/projects/5_project/";
            },},{id: "projects-project-6",
          title: 'project 6',
          description: "a project with no image",
          section: "Projects",handler: () => {
              window.location.href = "/projects/6_project/";
            },},{id: "projects-project-7",
          title: 'project 7',
          description: "with background image",
          section: "Projects",handler: () => {
              window.location.href = "/projects/7_project/";
            },},{id: "projects-project-8",
          title: 'project 8',
          description: "an other project with a background image and giscus comments",
          section: "Projects",handler: () => {
              window.location.href = "/projects/8_project/";
            },},{id: "projects-project-9",
          title: 'project 9',
          description: "another project with an image 🎉",
          section: "Projects",handler: () => {
              window.location.href = "/projects/9_project/";
            },},{
        id: 'social-email',
        title: 'email',
        section: 'Socials',
        handler: () => {
          window.open("mailto:%68%6C%36%36%37@%63%61%6D.%61%63.%75%6B", "_blank");
        },
      },{
        id: 'social-linkedin',
        title: 'LinkedIn',
        section: 'Socials',
        handler: () => {
          window.open("https://www.linkedin.com/in/hongyan-lin-6a14032b1", "_blank");
        },
      },{
      id: 'light-theme',
      title: 'Change theme to light',
      description: 'Change the theme of the site to Light',
      section: 'Theme',
      handler: () => {
        setThemeSetting("light");
      },
    },
    {
      id: 'dark-theme',
      title: 'Change theme to dark',
      description: 'Change the theme of the site to Dark',
      section: 'Theme',
      handler: () => {
        setThemeSetting("dark");
      },
    },
    {
      id: 'system-theme',
      title: 'Use system default theme',
      description: 'Change the theme of the site to System Default',
      section: 'Theme',
      handler: () => {
        setThemeSetting("system");
      },
    },];
