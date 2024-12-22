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
  const [isDarkMode, setIsDarkMode] = useState(true);

  const toggleTheme = () => {
    setIsDarkMode((prevMode) => !prevMode);
  };

  // Display the user's location info in the sidebar
  useEffect(() => {
    const getUserCurrentLocationAQI = async () => {
      try {
        navigator.geolocation.getCurrentPosition(
          async (position) => {
            const { latitude, longitude } = position.coords;

            // Use the new service method
            const data = await AirQualityService.getAirQualityByCoords(
              latitude,
              longitude,
            );
            setSelectedStationInfo(data.data);
          },
          async () => {
            // Fallback to default location AQI (Bangalore)
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
      <Header isDarkMode={isDarkMode} toggleTheme={toggleTheme} />

      <div className="flex-1 grid grid-cols-9">
        <Sidebar
          selectedStationInfo={selectedStationInfo}
          activePollutant={activePollutant}
          setActivePollutant={setActivePollutant}
          isDarkMode={isDarkMode}
        />

        <MapContainer
          isDarkMode={isDarkMode}
          setSelectedStationInfo={setSelectedStationInfo}
        />
      </div>
    </main>
  );
}

export default App;
