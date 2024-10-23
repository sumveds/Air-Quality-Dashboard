## Simple Air Quality Dashboard

This goal of this repo is to guide the workshop participants through setting up a simple air quality dashboard using React, TypeScript, Tailwind CSS, MapLibre, and Recharts. Participants will display real-time air quality data and visualize pollutants such as PM2.5, PM10, Ozone, and NO2.

### Features

- Real-time air quality information from API
- Forecast charts for air quality trends
- Visualizes pollutants: PM2.5, PM10, Ozone, and NO2
- Map clustering for data visualization


### Prerequisites

Before starting the workshop, ensure the following tools are installed:

- Node.js (LTS version recommended) Download [here](https://nodejs.org/en)
- Vite (for fast development) and pnpm (for efficient package management)
- Install [Vite](https://vite.dev/)
- Install [pnpm](https://pnpm.io/)
- VSCode (for code autocompletion and Tailwind CSS support)
- GitHub account (to manage your repository)
- [Vercel](https://vercel.com/) account (for deploying the dashboard)

### Installation
Follow the steps below to set up and run the project locally:

- Step 1: Clone the repo or download as a zip file.

If you're experience with git, you can clone the repo using the code below. Otherwise, download as a zipped file and open in VSCode.

```bash
git clone https://github.com/jeafreezy/aq-dashboard.git
```

- Step 2: Install Project Dependencies

After creating the project, install the required dependencies:

```bash
pnpm install
```

- Step 3: Start the Development Server

To run the project locally and start development:

```bash
pnpm dev
```

This will launch a local development server. Open the displayed URL in your browser to view the dashboard.

### Data Source

The Air Quality data is coming from World Air Quality Index.
Get your API token from: [https://aqicn.org/api/](https://aqicn.org/api/).

### Deployment

To deploy your air quality dashboard:

- Push your code to GitHub.
- Link your repository to Vercel for easy continuous deployment for free.
- Vercel will automatically build and deploy your project whenever you push updates to the GitHub repository.