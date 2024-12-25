import { useEffect, useRef, useState } from "react";
import ReactJoyride from "react-joyride";
import Header from "./components/Header";
import Sidebar from "./components/Sidebar/Sidebar";
import { TSelectedStation, TStationCoordinates } from "./types";
import MapContainer from "./components/Map/MapContainer";
import AirQualityService from "./services/airQualityService";
import useTour from "./hooks/useTour";

function App() {
  const [selectedStationInfo, setSelectedStationInfoState] =
    useState<TSelectedStation | null>(null);
  const [activePollutant, setActivePollutant] = useState<string>("");
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [isSidebarVisible, setIsSidebarVisible] = useState(true);
  const [mapCoordinates, setMapCoordinates] =
    useState<TStationCoordinates | null>(null);

  const hasFetchedData = useRef(false);

  const { isTourOpen, tourSteps, handleTourCallback } = useTour(isDarkMode);

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
      return prevVisible;
    });
  };

  const handleSearch = (lat: number, lon: number) => {
    setMapCoordinates({ lat, lon });
    console.log(`Navigating map to Latitude ${lat}, Longitude ${lon}`);
  };

  useEffect(() => {
    const handleResize = () => {
      const isSmallScreen = window.innerWidth < 768;
      setIsSidebarVisible((prevVisible) => {
        if (isSmallScreen && prevVisible) {
          return false; // Hide sidebar if transitioning to small screen
        } else if (!isSmallScreen && !prevVisible) {
          return true; // Show sidebar if transitioning to large screen
        }
        return prevVisible;
      });
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  useEffect(() => {
    const getUserCurrentLocationAQI = async () => {
      if (hasFetchedData.current) return;
      hasFetchedData.current = true;
      try {
        navigator.geolocation.getCurrentPosition(
          async (position) => {
            const { latitude, longitude } = position.coords;
            const data = await AirQualityService.getAirQualityByCoords(
              latitude,
              longitude,
            );
            setSelectedStationInfo(data.data);
            setMapCoordinates({ lat: latitude, lon: longitude });
          },
          async () => {
            const fallbackData = await AirQualityService.getAirQualityByCoords(
              12.9716,
              77.5946,
            );
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
        onSearch={handleSearch}
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
