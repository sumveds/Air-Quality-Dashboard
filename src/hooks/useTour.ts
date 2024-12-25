import { useEffect, useState } from "react";
import { CallBackProps, STATUS, Step } from "react-joyride";

const useTour = (
  isDarkMode: boolean,
  isSidebarLoaded: boolean,
  toggleSidebar: () => void,
  isSidebarVisible: boolean,
) => {
  const [isTourOpen, setIsTourOpen] = useState(false);
  const [tourSteps, setTourSteps] = useState<Step[]>([]);

  const tourStepsStyleOptions = isDarkMode
    ? {
        zIndex: 10000, // Ensure it appears above all other elements
        arrowColor: "#fff", // Customize arrow color
        backgroundColor: "#333", // Customize background color
        textColor: "#fff", // Customize text color
      }
    : {};

  const largeDeviceSteps: Step[] = [
    {
      target: ".place-search",
      content:
        "Use this search bar to find specific locations on the map quickly and efficiently.",
      placement: "bottom",
      styles: {
        options: tourStepsStyleOptions,
      },
    },
    {
      target: ".toggle-theme",
      content:
        "Switch between light and dark modes by clicking this icon, personalizing the look of the application to your preference.",
      placement: "bottom",
      styles: {
        options: tourStepsStyleOptions,
      },
    },
    {
      target: ".aqi-info",
      content:
        "Monitor the Air Quality Index (AQI) and pollutant levels for the currently selected station here.",
      placement: "top",
      styles: {
        options: tourStepsStyleOptions,
      },
    },
    {
      target: ".forecast-chart",
      content:
        "Explore the forecast of various pollutant levels for the selected station.\nClick on a pollutant to view its detailed forecast.",
      placement: "bottom",
      styles: {
        options: tourStepsStyleOptions,
      },
    },
    {
      target: ".map-container",
      content:
        "Navigate the map to explore clustered and unclustered climate stations.\nClick on a station to view its AQI details in the side panel.",
      placement: "bottom",
      disableBeacon: true, // Skip the beacon for this step
      styles: {
        options: tourStepsStyleOptions,
      },
    },
  ];

  const smallDeviceSteps: Step[] = [
    {
      target: ".aqi-info",
      content:
        "Monitor the Air Quality Index (AQI) and pollutant levels for the currently selected station here.",
      placement: "top",
      styles: {
        options: tourStepsStyleOptions,
      },
    },
    {
      target: ".forecast-chart",
      content:
        "Explore the forecast of various pollutant levels for the selected station.\nClick on a pollutant to view its detailed forecast.",
      placement: "bottom",
      styles: {
        options: tourStepsStyleOptions,
      },
    },
    {
      target: ".close-sidebar",
      content: "Hide the sidebar to get a view of the map.",
      placement: "bottom",
      styles: {
        options: tourStepsStyleOptions,
      },
    },
    {
      target: ".place-search",
      content:
        "Use this search bar to find specific locations on the map quickly and efficiently.",
      placement: "bottom",
      styles: {
        options: tourStepsStyleOptions,
      },
    },
    {
      target: ".toggle-theme",
      content:
        "Switch between light and dark modes by clicking this icon, personalizing the look of the application to your preference.",
      placement: "bottom",
      styles: {
        options: tourStepsStyleOptions,
      },
    },
    {
      target: ".map-container",
      content:
        "Navigate the map to explore clustered and unclustered climate stations.\nClick on a station to view its AQI details in the side panel.",
      placement: "bottom",
      disableBeacon: true, // Skip the beacon for this step
      styles: {
        options: tourStepsStyleOptions,
      },
    },
  ];

  const handleTourCallback = (data: CallBackProps) => {
    const { status, index } = data;

    if (status === STATUS.FINISHED || status === STATUS.SKIPPED) {
      setIsTourOpen(false); // Close tour when finished or skipped
      localStorage.setItem("hasSeenTour", "true");
    }

    // Logic to close the sidebar on the 3rd step for small devices
    const isSmallScreen = window.innerWidth < 768;
    if (isSmallScreen && index === 3 && isSidebarVisible) {
      toggleSidebar(); // Close the sidebar
    }
  };

  useEffect(() => {
    if (!isSidebarLoaded) {
      return; // Wait until the sidebar is fully loaded
    }

    const hasSeenTour = localStorage.getItem("hasSeenTour");
    const isSmallScreen = window.innerWidth < 768;

    if (!hasSeenTour) {
      setTourSteps(isSmallScreen ? smallDeviceSteps : largeDeviceSteps);
      setIsTourOpen(true);
    }
  }, [isSidebarLoaded]); // Depend on isSidebarLoaded to ensure tour starts after Sidebar is ready

  return { isTourOpen, tourSteps, handleTourCallback };
};

export default useTour;
