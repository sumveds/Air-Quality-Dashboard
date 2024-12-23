import { useEffect, useState } from "react";
import Header from "./components/Header";
import Sidebar from "./components/Sidebar/Sidebar";
import { TSelectedStation } from "./types";
import MapContainer from "./components/Map/MapContainer";
import AirQualityService from "./services/airQualityService";

function App() {
  const [selectedStationInfo, setSelectedStationInfo] =
    useState<TSelectedStation | null>(null);
  const [activePollutant, setActivePollutant] = useState<string>("");
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [isSidebarVisible, setIsSidebarVisible] = useState(true);

  const toggleTheme = () => {
    setIsDarkMode((prevMode) => !prevMode);
  };

  const toggleSidebar = () => {
    setIsSidebarVisible((prevVisible) => !prevVisible);
  };

  // Automatically hide sidebar when screen width is small
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 768) {
        setIsSidebarVisible(false); // Hide sidebar on small screens
      } else {
        setIsSidebarVisible(true); // Show sidebar on larger screens
      }
    };

    // Set initial state based on current window size
    handleResize();

    // Add resize event listener
    window.addEventListener("resize", handleResize);

    // Cleanup the event listener on component unmount
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // Fetch air quality data
  useEffect(() => {
    const getUserCurrentLocationAQI = async () => {
      try {
        navigator.geolocation.getCurrentPosition(
          async (position) => {
            const { latitude, longitude } = position.coords;
            const data = await AirQualityService.getAirQualityByCoords(
              latitude,
              longitude,
            );
            setSelectedStationInfo(data.data);
          },
          async () => {
            const fallbackData = await AirQualityService.getAirQualityByCoords(
              12.9716, // Bangalore lat
              77.5946, // Bangalore lon
            );
            setSelectedStationInfo(fallbackData.data);
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
      <Header
        isDarkMode={isDarkMode}
        toggleTheme={toggleTheme}
        toggleSidebar={toggleSidebar}
      />

      <div className="flex-1 grid grid-cols-12 overflow-hidden">
        {/* Sidebar */}
        <div
          className={`transform transition-transform duration-300 overflow-hidden ${
            isSidebarVisible
              ? "w-full col-span-12 fixed inset-0 z-50 bg-[#383841] text-white md:relative md:w-auto md:col-span-4"
              : "hidden"
          }`}
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
        {/* Map */}
        <div
          className={`transition-all duration-300 ${
            isSidebarVisible ? "col-span-8" : "col-span-12"
          }`}
        >
          <MapContainer
            isDarkMode={isDarkMode}
            setSelectedStationInfo={setSelectedStationInfo}
            isSidebarVisible={isSidebarVisible}
          />
        </div>
      </div>
    </main>
  );
}

export default App;
