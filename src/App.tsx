/**
 * This is where we import the required libraries.
 */
import { useEffect, useState } from "react";
import maplibregl, {
  GeolocateControl,
  Map,
  NavigationControl,
} from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import Header from "./components/Header";
import Sidebar from "./components/Sidebar/Sidebar";
import { TSelectedStation, TStation } from "./types";
import AirQualityService from "./services/airQualityService";

/**
 * These are constant variables for easy reuse.
 */
const WORLD_AIR_QUALITY_BASE_API_URL: string = "https://api.waqi.info/v2/";
const WORLD_AIR_QUALITY_API_TOKEN: string =
  "e4e922828e41a73cfe4645c0db52103229422e8a";

/**
 * This is a function that convers the stations data to a GeoJSON FeatureCollection for easy rendering on the map.
 * @param stations The stations to convert to GeoJSON.
 */
function stationsToGeoJSON(stations: TStation[]): GeoJSON.FeatureCollection {
  // Calculate avg_aqi for all stations
  const avg_aqi =
    stations.reduce((sum, station) => sum + Number(station.aqi), 0) /
    stations.length;

  const features: GeoJSON.Feature[] = stations.map((station: TStation) => ({
    type: "Feature", // Explicitly "Feature"
    properties: {
      stationName: station.station.name,
      uid: station.uid,
      aqi: Number(station.aqi),
      avg_aqi, // Embed avg_aqi here
    },
    geometry: {
      type: "Point", // Explicitly "Point"
      coordinates: [station.lon, station.lat],
    },
  }));

  return {
    type: "FeatureCollection", // Explicitly "FeatureCollection"
    features,
  };
}

/**
 * This is a function that populates the points on the map.
 * @param map The maplibre map instance.
 * @param bounds The current bounding box of the map.
 * @param setSelectedStationInfo The callback function to update the state with the clicked/selected station.
 */

async function populateMarkers(
  map: maplibregl.Map,
  setSelectedStationInfo: (station: TSelectedStation) => void,
  isDarkMode: boolean,
) {
  const mapBounds = map.getBounds();

  const zoomLevel = map.getZoom();
  const factor = zoomLevel < 10 ? 1 : 0.1;

  const extendedBounds = [
    mapBounds.getNorth() + factor,
    mapBounds.getWest() - factor,
    mapBounds.getSouth() - factor,
    mapBounds.getEast() + factor,
  ].join(",");

  await fetch(
    `${WORLD_AIR_QUALITY_BASE_API_URL}map/bounds/?latlng=${extendedBounds}&token=${WORLD_AIR_QUALITY_API_TOKEN}`,
  )
    .then((data) => data.json())
    .then((stations) => {
      if (stations.status !== "ok") throw stations.data;

      const geoJSON = stationsToGeoJSON(stations.data);

      if (map.getSource("stations")) {
        const source = map.getSource("stations") as maplibregl.GeoJSONSource;
        source.setData(geoJSON);
      } else {
        map.addSource("stations", {
          type: "geojson",
          data: geoJSON,
          cluster: true,
          clusterMaxZoom: 14,
          clusterRadius: 50,
          clusterProperties: {
            avg_aqi: ["+", ["get", "aqi"]],
          },
        });

        // Add cluster layer with updated colors
        map.addLayer({
          id: "clusters",
          type: "circle",
          source: "stations",
          filter: ["has", "point_count"],
          paint: {
            "circle-color": [
              "step",
              ["get", "avg_aqi"],
              isDarkMode ? "#00FF00" : "#32CD32", // Good: Bright green
              50,
              isDarkMode ? "#FFD700" : "#FFC107", // Moderate: Sharper yellow
              100,
              isDarkMode ? "#FF8C00" : "#FF5722", // Unhealthy for Sensitive Groups
              150,
              isDarkMode ? "#FF4500" : "#E53935", // Unhealthy
              200,
              isDarkMode ? "#DC143C" : "#C62828", // Very Unhealthy
              300,
              isDarkMode ? "#FF0000" : "#B71C1C", // Hazardous
            ],
            "circle-radius": [
              "step",
              ["get", "point_count"],
              20,
              100,
              30,
              750,
              40,
            ],
            "circle-stroke-width": 2,
            "circle-stroke-color": "#FFFFFF",
          },
        });

        // Add unclustered-point layer
        map.addLayer({
          id: "unclustered-point",
          type: "circle",
          source: "stations",
          filter: ["!", ["has", "point_count"]],
          paint: {
            "circle-color": [
              "step",
              ["get", "aqi"],
              isDarkMode ? "#9BD74E" : "#32CD32", // 0 <= AQI < 50
              50,
              isDarkMode ? "#FFD700" : "#FFC107", // 50 <= AQI < 100
              100,
              isDarkMode ? "#FF8C00" : "#FF5722", // 100 <= AQI < 150
              150,
              isDarkMode ? "#FF4500" : "#E53935", // 150 <= AQI < 200
              200,
              isDarkMode ? "#DC143C" : "#C62828", // 200 <= AQI < 300
              300,
              isDarkMode ? "#FF0000" : "#B71C1C", // Adjusted for theme
            ],
            "circle-radius": 10,
            "circle-stroke-width": 3,
            "circle-stroke-color": "#fff",
          },
        });

        // Add hover effect to change the cursor to a pointer
        map.on("mouseenter", "unclustered-point", () => {
          map.getCanvas().style.cursor = "pointer";
        });

        // Revert the cursor back to default when not hovering
        map.on("mouseleave", "unclustered-point", () => {
          map.getCanvas().style.cursor = "";
        });

        // Add click event listener for unclustered-point
        map.on("click", "unclustered-point", async (e: any) => {
          const coordinates = e.features[0].geometry.coordinates.slice();
          const { stationName, uid } = e.features[0].properties;

          // Add a popup at the clicked location
          new maplibregl.Popup()
            .setLngLat(coordinates)
            .setHTML(`<strong style="color:black;">${stationName}</strong>`)
            .addTo(map);

          // Fetch detailed information for the selected station
          try {
            const stationInfo = await AirQualityService.getAirQuality(uid); // Fetch station data
            if (stationInfo && stationInfo.data) {
              setSelectedStationInfo(stationInfo.data); // Update the side panel state
            } else {
              console.error("Failed to fetch station information");
            }
          } catch (error) {
            console.error("Error fetching station data:", error);
          }
        });
      }
    })
    .catch((error) => {
      console.error("Error fetching station data:", error);
    });
}

/**
 * This is a React Component to write our application code.
 */
function App() {
  // Local states

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
              `https://api.waqi.info/feed/geo:${latitude};${longitude}/?token=${WORLD_AIR_QUALITY_API_TOKEN}`,
            );
            const data = await response.json();
            setSelectedStationInfo(data.data);
          },
          async () => {
            // Fallback to default location AQI (Bangalore)
            const response = await fetch(
              `https://api.waqi.info/feed/geo:12.9716;77.5946/?token=${WORLD_AIR_QUALITY_API_TOKEN}`,
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

// Exporting it, so it can be imported and rendered in the 'main.tsx' file.
export default App;
