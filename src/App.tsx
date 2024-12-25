import { useEffect, useRef, useState } from "react";
import ReactJoyride, { CallBackProps, STATUS, Step } from "react-joyride";
import Header from "./components/Header";
import Sidebar from "./components/Sidebar/Sidebar";
import { TSelectedStation, TStationCoordinates } from "./types";
import MapContainer from "./components/Map/MapContainer";
import AirQualityService from "./services/airQualityService";

function App() {
  const [isTourOpen, setIsTourOpen] = useState(true);
  const [selectedStationInfo, setSelectedStationInfoState] =
    useState<TSelectedStation | null>(null);
  const [activePollutant, setActivePollutant] = useState<string>("");
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [isSidebarVisible, setIsSidebarVisible] = useState(true);
  const [mapCoordinates, setMapCoordinates] =
    useState<TStationCoordinates | null>(null);

  const hasFetchedData = useRef(false);

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

  const toggleTheme = () => {
    setIsDarkMode((prevMode) => !prevMode);
  };

  const toggleSidebar = () => {
    setIsSidebarVisible((prevVisible) => !prevVisible);
  };

  const setSelectedStationInfo = (station: TSelectedStation | null) => {
    setSelectedStationInfoState(station);

    setIsSidebarVisible((prevVisible) => {
      const shouldToggleSidebar = window.innerWidth < 768 && !prevVisible;
      if (shouldToggleSidebar) {
        console.log("Opening sidebar on small screen");
        return true;
      }
      return prevVisible; // Keep the current state
    });
  };

  const handleSearch = (lat: number, lon: number) => {
    // Update map center to the searched location
    setMapCoordinates({ lat, lon });
    console.log(`Navigating map to Latitude ${lat}, Longitude ${lon}`);
    // Optionally fetch air quality data or other details for the searched location
  };

  useEffect(() => {
    const hasSeenTour = localStorage.getItem("hasSeenTour");
    if (hasSeenTour) {
      setIsTourOpen(false);
    }
  }, []);

  // Automatically hide sidebar when screen width is small
  useEffect(() => {
    const handleResize = () => {
      const isSmallScreen = window.innerWidth < 768;
      setIsSidebarVisible((prevVisible) => {
        if (isSmallScreen && prevVisible) {
          console.log("Hiding sidebar on small screen resize");
          return false; // Hide sidebar if transitioning to small screen
        } else if (!isSmallScreen && !prevVisible) {
          console.log("Showing sidebar on large screen resize");
          return true; // Show sidebar if transitioning to large screen
        }
        return prevVisible;
      });
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // Fetch air quality data
  useEffect(() => {
    const getUserCurrentLocationAQI = async () => {
      if (hasFetchedData.current) return;
      hasFetchedData.current = true;
      try {
        navigator.geolocation.getCurrentPosition(
          async (position) => {
            console.log("Position:", position.coords);
            const { latitude, longitude } = position.coords;
            const data = await AirQualityService.getAirQualityByCoords(
              latitude,
              longitude,
            );
            console.log("Air quality:", data.data);
            setSelectedStationInfo(data.data);
            setMapCoordinates({ lat: latitude, lon: longitude });
          },
          async () => {
            const fallbackData = await AirQualityService.getAirQualityByCoords(
              12.9716, // Bangalore lat
              77.5946, // Bangalore lon
            );
            console.log("Air quality of default location:", fallbackData.data);
            setSelectedStationInfo(fallbackData.data);
            setMapCoordinates({ lat: 12.9716, lon: 77.5946 });
          },
        );
      } catch (error) {
        console.error("Error fetching AQI data:", error);
      }
    };

    getUserCurrentLocationAQI();
  }, []);

  return (
    <main
      className={`flex flex-col h-screen transition-colors duration-300 ${
        isDarkMode ? "bg-black text-white" : "bg-white text-black"
      }`}
    >
      <ReactJoyride
        steps={tourSteps}
        continuous
        showSkipButton
        showProgress
        callback={handleTourCallback}
        run={isTourOpen}
      />
      <Header
        isDarkMode={isDarkMode}
        toggleTheme={toggleTheme}
        toggleSidebar={toggleSidebar}
        onSearch={handleSearch} // Pass the updated handler
      />
      <div className="flex-1 grid grid-cols-12 overflow-hidden">
        <div
          className={`transform transition-transform duration-300 overflow-hidden ${
            isSidebarVisible ? "sidebar-open" : "sidebar-closed"
          } col-span-12 fixed inset-0 z-50 bg-[#383841] text-white md:relative md:col-span-4`}
        >
          <Sidebar
            selectedStationInfo={selectedStationInfo}
            activePollutant={activePollutant}
            setActivePollutant={setActivePollutant}
            isDarkMode={isDarkMode}
            isVisible={isSidebarVisible}
            toggleSidebar={toggleSidebar}
          />
        </div>
        <div
          className={`transition-all duration-300 ${
            isSidebarVisible ? "md:col-span-8 col-span-12" : "col-span-12"
          }`}
        >
          <MapContainer
            isDarkMode={isDarkMode}
            setSelectedStationInfo={setSelectedStationInfo}
            isSidebarVisible={isSidebarVisible}
            location={mapCoordinates}
          />
        </div>
      </div>
    </main>
  );
}

export default App;
