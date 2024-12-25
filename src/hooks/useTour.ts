import { useEffect, useState } from "react";
import { CallBackProps, STATUS, Step } from "react-joyride";

const useTour = (isDarkMode: boolean) => {
  const [isTourOpen, setIsTourOpen] = useState(false);

  const tourStepsStyleOptions = isDarkMode
    ? {
        zIndex: 10000, // Ensure it appears above all other elements
        arrowColor: "#fff", // Customize arrow color
        backgroundColor: "#333", // Customize background color
        textColor: "#fff", // Customize text color
      }
    : {};

  const [tourSteps] = useState<Step[]>([
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
        "Explore the forecast of various pollutant levels for the selected station.\n" +
        "Click on a pollutant to view its detailed forecast.",
      placement: "top",
      styles: {
        options: tourStepsStyleOptions,
      },
    },
    {
      target: ".map-container",
      content:
        "Navigate the map to explore clustered and unclustered climate stations.\n" +
        "Click on a station to view its AQI details in the side panel.",
      placement: "bottom",
      disableBeacon: true, // Skip the beacon for this step
      styles: {
        options: tourStepsStyleOptions,
      },
    },
  ]);

  const handleTourCallback = (data: CallBackProps) => {
    const { status } = data;
    if (status === STATUS.FINISHED || status === STATUS.SKIPPED) {
      setIsTourOpen(false); // Close tour when finished or skipped
      localStorage.setItem("hasSeenTour", "true");
    }
  };

  useEffect(() => {
    const hasSeenTour = localStorage.getItem("hasSeenTour");
    const isSmallScreen = window.innerWidth < 768;
    if (!hasSeenTour && !isSmallScreen) {
      setIsTourOpen(true);
    }
  }, []);

  return { isTourOpen, tourSteps, handleTourCallback };
};

export default useTour;
