import { useEffect, useState } from "react";
import maplibregl, {
  GeolocateControl,
  Map,
  NavigationControl,
} from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import Header from "./components/Header";
import Sidebar from "./components/Sidebar/Sidebar";
import { TSelectedStation } from "./types";
import { populateMarkers } from "./components/Map/MarkerUtils";
import {
  WORLD_AIR_QUALITY_API_TOKEN,
  WORLD_AIR_QUALITY_BASE_API_URL,
} from "./constants";

function App() {
  const [map, setMap] = useState<Map | null>(null);
  const [selectedStationInfo, setSelectedStationInfo] =
    useState<null | TSelectedStation>(null);
  const [activePollutant, setActivePollutant] = useState<string>("");
  const [userCoordinates, setUserCoordinates] = useState<
    [number, number] | null
  >(null);
  const [isDarkMode, setIsDarkMode] = useState(true);

  const toggleTheme = () => {
    setIsDarkMode((prevMode) => !prevMode);
  };
  // This useEffect is used to load the map
  useEffect(() => {
    if (map) return;

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        setUserCoordinates([longitude, latitude]);

        const newMap = new maplibregl.Map({
          container: "map",
          style:
            "https://tiles.basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json",
          center: [longitude, latitude],
          zoom: 7,
        });

        newMap.addControl(new NavigationControl());
        newMap.addControl(
          new GeolocateControl({
            positionOptions: { enableHighAccuracy: true },
            trackUserLocation: true,
          }),
        );

        new maplibregl.Marker({ color: "green" })
          .setLngLat([longitude, latitude])
          .addTo(newMap);

        setMap(newMap);
      },
      (error) => {
        console.error("Geolocation error:", error);
      },
    );
  }, [map]);

  useEffect(() => {
    if (!map || !userCoordinates) return;

    const styleUrl = isDarkMode
      ? "https://tiles.basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json"
      : "https://tiles.basemaps.cartocdn.com/gl/positron-gl-style/style.json";

    map.setStyle(styleUrl);

    map.on("styledata", async () => {
      // Re-add the green location marker
      new maplibregl.Marker({ color: "green" })
        .setLngLat(userCoordinates)
        .addTo(map);

      // Re-add clustering and markers
      await populateMarkers(map, setSelectedStationInfo, isDarkMode);
    });
  }, [isDarkMode, map, userCoordinates]);

  useEffect(() => {
    if (!map) return;

    map.on("load", async () => {
      await populateMarkers(map, setSelectedStationInfo, isDarkMode);
    });

    map.on("moveend", async () => {
      await populateMarkers(map, setSelectedStationInfo, isDarkMode);
    });
  }, [map]);

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

  // set the first available forecast data as the default selected
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

        <div id="map" className="col-span-6 w-full h-[95dvh]"></div>
      </div>
    </main>
  );
}

export default App;
