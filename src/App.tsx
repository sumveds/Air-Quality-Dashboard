import { useEffect, useState } from "react";
import Header from "./components/Header";
import Sidebar from "./components/Sidebar/Sidebar";
import { TSelectedStation } from "./types";
import {
  WORLD_AIR_QUALITY_API_TOKEN,
  WORLD_AIR_QUALITY_BASE_API_URL,
} from "./constants";
import MapContainer from "./components/Map/MapContainer";

function App() {
  const [selectedStationInfo, setSelectedStationInfo] =
    useState<TSelectedStation | null>(null);
  const [activePollutant, setActivePollutant] = useState<string>("");
  const [isDarkMode, setIsDarkMode] = useState(true);

  const toggleTheme = () => {
    setIsDarkMode((prevMode) => !prevMode);
  };

  // Optionally keep or remove this effect if you want to display the
  // user's own station info in the sidebar.
  useEffect(() => {
    const getUserCurrentLocationAQI = async () => {
      try {
        navigator.geolocation.getCurrentPosition(
          async (position) => {
            const { latitude, longitude } = position.coords;
            const response = await fetch(
              `${WORLD_AIR_QUALITY_BASE_API_URL}feed/geo:${latitude};${longitude}/?token=${WORLD_AIR_QUALITY_API_TOKEN}`,
            );
            const data = await response.json();
            setSelectedStationInfo(data.data);
          },
          async () => {
            // Fallback to default location AQI (Bangalore)
            const response = await fetch(
              `${WORLD_AIR_QUALITY_BASE_API_URL}feed/geo:12.9716;77.5946/?token=${WORLD_AIR_QUALITY_API_TOKEN}`,
            );
            const data = await response.json();
            setSelectedStationInfo(data.data);
          },
        );
      } catch (error) {
        console.error("Error fetching AQI data:", error);
      }
    };

    getUserCurrentLocationAQI();
  }, []);

  // Set the first available forecast data as the default selected
  useEffect(() => {
    if (!selectedStationInfo?.forecast) return;
    if (activePollutant !== "") return;

    if (selectedStationInfo.forecast.daily.no2) {
      setActivePollutant("no2");
    } else if (selectedStationInfo.forecast.daily.pm10) {
      setActivePollutant("pm10");
    } else if (selectedStationInfo.forecast.daily.pm25) {
      setActivePollutant("pm25");
    } else if (selectedStationInfo.forecast.daily.o3) {
      setActivePollutant("o3");
    }
  }, [selectedStationInfo?.forecast, activePollutant]);

  return (
    <main
      className={`transition-colors duration-300 ${isDarkMode ? "bg-black text-white" : "bg-white text-black"}`}
    >
      <Header isDarkMode={isDarkMode} toggleTheme={toggleTheme} />

      <div className="w-full h-screen grid grid-cols-9">
        <Sidebar
          selectedStationInfo={selectedStationInfo}
          activePollutant={activePollutant}
          setActivePollutant={setActivePollutant}
          isDarkMode={isDarkMode}
        />

        {/* The new MapContainer handles all MapLibre logic. */}
        <MapContainer
          isDarkMode={isDarkMode}
          setSelectedStationInfo={setSelectedStationInfo}
        />
      </div>
    </main>
  );
}

export default App;
