/**
 * This is where we import the required libraries.
 */
import { useEffect, useMemo, useState } from "react";
import maplibregl, {
  GeolocateControl,
  Map,
  NavigationControl,
} from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import {
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

/**
 * These are constant variables for easy reuse.
 */
const WORLD_AIR_QUALITY_BASE_API_URL: string = "https://api.waqi.info/v2/";
const WORLD_AIR_QUALITY_API_TOKEN: string =
  "e4e922828e41a73cfe4645c0db52103229422e8a";

/**
 * This is a Typescript type for a single station.
 */
type TStation = {
  uid: string;
  aqi: string;
  lat: number;
  lon: number;
  station: {
    name: string;
  };
};

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
 * This is a function that gets the Air Quality information for a single station/point on the map.
 * @param stationUID The unique ID of the station.
 */
async function getMarkerAQI(stationUID: string) {
  return (
    await fetch(
      "https://api.waqi.info/feed/@" +
        stationUID +
        "/?token=" +
        WORLD_AIR_QUALITY_API_TOKEN,
    )
  ).json();
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
              isDarkMode ? "#9BD74E" : "#32CD32", // Adjusted for theme
              50,
              isDarkMode ? "#FFD700" : "#FFC107", // Adjusted for theme
              100,
              isDarkMode ? "#FF8C00" : "#FF5722", // Adjusted for theme
              150,
              isDarkMode ? "#FF4500" : "#E53935", // Adjusted for theme
              200,
              isDarkMode ? "#DC143C" : "#C62828", // Adjusted for theme
              300,
              isDarkMode ? "#FF0000" : "#B71C1C", // Adjusted for theme
            ],
            "circle-radius": 10,
            "circle-stroke-width": 3,
            "circle-stroke-color": "#fff",
          },
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
            const stationInfo = await getMarkerAQI(uid); // Fetch station data
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
 * This functions takes an air quality index and returns some information about it.
 * @param aqi The Air Quality Index (AQI) value.
 * @returns The category of the value, the color code and a message.
 */
const getAirQualitySituation = (
  aqi: number = 0,
): { text: string; color: string; message: string } => {
  if (aqi <= 50) {
    return {
      text: "Good",
      color: "green",
      message: `An AQI of ${aqi}µg/m³ indicates that the air quality is healthy.`,
    };
  } else if (aqi > 50 && aqi <= 100) {
    return {
      text: "Moderate",
      color: "orange",
      message: `An AQI of ${aqi}µg/m³ indicates that the air quality is moderate.`,
    };
  } else {
    return {
      text: "Poor",
      color: "red",
      message: `An AQI of ${aqi}µg/m³ indicates that the air quality is unhealthy.`,
    };
  }
};

/**
 * This is a Typescript type that represents the data type of the API response for a selected station.
 */
type TSelectedStation = {
  aqi: number;
  city: {
    name: string;
    url: string;
  };
  attributions: { logo: string; name: string; url: string }[];
  time: {
    iso: string;
    s: string;
  };
  forecast: {
    daily: {
      o3: { avg: number; day: string; max: number; min: number }[];
      pm10: { avg: number; day: string; max: number; min: number }[];
      pm25: { avg: number; day: string; max: number; min: number }[];
      no2: { avg: number; day: string; max: number; min: number }[];
    };
  };
  iaqi: {
    pm10?: {
      v: number;
    };
    pm25?: {
      v: number;
    };
    no2?: {
      v: number;
    };
    o3?: {
      v: number;
    };
  };
};

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
          zoom: 10,
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

  // A memo to render the side panel contents.
  const renderSidePanel = useMemo(() => {
    const backgroundColors: Record<string, string> = {
      green: "bg-[#9BD74E]",
      red: "bg-red-500",
      orange: "bg-orange-500",
    };
    const { color, text, message } = getAirQualitySituation(
      selectedStationInfo?.aqi as number,
    );

    return (
      <div
        className={`col-span-3 space-y-1.5 h-[95dvh] overflow-scroll transition-colors duration-300 ${
          isDarkMode ? "bg-[#383841] text-white" : "bg-gray-100 text-black"
        }`}
      >
        <div
          className={`p-6 flex flex-col gap-y-3 ${backgroundColors[color]} text-black`}
        >
          <a href={selectedStationInfo?.city.url} target="_blank">
            <p className="text-base">{selectedStationInfo?.city.name}</p>
          </a>
          <p className="text-3xl">{text}</p>
          <p className="text-3xl">
            AQI{" "}
            <span className="font-semibold">{selectedStationInfo?.aqi}</span>
          </p>
          <p className="text-base">{message}</p>
        </div>
        {/* Metrics */}
        <div
          className={`p-4 flex flex-col gap-y-4 transition-colors duration-300 ${
            isDarkMode ? "bg-black text-white" : "bg-white text-black"
          }`}
        >
          <small>Last updated: {selectedStationInfo?.time.s}</small>
          <p className="text-base">Main Pollutants</p>
          <ul className="flex items-center justify-between gap-x-1">
            {/* PM 2.5 */}
            {selectedStationInfo?.iaqi.pm25 && (
              <li className="flex flex-col gap-y-2 items-center">
                <span
                  className={`text-base px-4 py-1 rounded-2xl ${
                    isDarkMode ? "bg-[#383841]" : "bg-gray-200"
                  }`}
                >
                  {selectedStationInfo?.iaqi.pm25.v}
                </span>
                <span className="text-xs font-light text-[#1A1A1D]">
                  PM 2.5
                </span>
              </li>
            )}
            {/* PM 10 */}
            {selectedStationInfo?.iaqi.pm10 && (
              <li className="flex flex-col gap-y-2 items-center">
                <span
                  className={`text-base px-4 py-1 rounded-2xl ${
                    isDarkMode ? "bg-[#383841]" : "bg-gray-200"
                  }`}
                >
                  {selectedStationInfo?.iaqi.pm10.v}
                </span>
                <span className="text-xs font-light text-[#1A1A1D]">PM 10</span>
              </li>
            )}
            {/* NO2 */}
            {selectedStationInfo?.iaqi.no2 && (
              <li className="flex flex-col gap-y-2 items-center">
                <span
                  className={`text-base px-4 py-1 rounded-2xl ${
                    isDarkMode ? "bg-[#383841]" : "bg-gray-200"
                  }`}
                >
                  {selectedStationInfo?.iaqi.no2.v}
                </span>
                <span className="text-xs font-light text-[#1A1A1D]">NO2</span>
              </li>
            )}
            {/* OZONE */}
            {selectedStationInfo?.iaqi.o3 && (
              <li className="flex flex-col gap-y-2 items-center">
                <span
                  className={`text-base px-4 py-1 rounded-2xl ${
                    isDarkMode ? "bg-[#383841]" : "bg-gray-200"
                  }`}
                >
                  {selectedStationInfo?.iaqi.o3.v}
                </span>
                <span className="text-xs font-light text-[#1A1A1D]">Ozone</span>
              </li>
            )}
          </ul>
        </div>

        {/* Forecast Chart */}
        {selectedStationInfo?.forecast?.daily ? (
          <div
            className={`p-4 flex flex-col gap-y-4 transition-colors duration-300 ${
              isDarkMode ? "bg-black text-white" : "bg-white text-black"
            }`}
          >
            <p className="text-base">Air Quality Forecast</p>
            {/* Tabs */}
            <ul
              className={`flex items-center px-2 py-1 rounded-3xl justify-between gap-x-1 transition-colors duration-300 ${
                isDarkMode
                  ? "bg-[#383841] text-[#9D9DA1]"
                  : "bg-gray-200 text-black"
              }`}
            >
              {/* PM 2.5 */}
              {selectedStationInfo.forecast.daily.pm25 && (
                <li
                  className={`cursor-pointer p-2 text-sm ${
                    activePollutant === "pm25" &&
                    "bg-black text-white rounded-3xl"
                  }`}
                  onClick={() => setActivePollutant("pm25")}
                >
                  PM 2.5
                </li>
              )}
              {/* PM 10 */}
              {selectedStationInfo.forecast.daily.pm10 && (
                <li
                  className={`cursor-pointer p-2 text-sm ${
                    activePollutant === "pm10" &&
                    "bg-black text-white rounded-3xl"
                  }`}
                  onClick={() => setActivePollutant("pm10")}
                >
                  PM10
                </li>
              )}
              {/* NO2 */}
              {selectedStationInfo.forecast.daily.no2 && (
                <li
                  className={`cursor-pointer p-2 text-sm ${
                    activePollutant === "no2" &&
                    "bg-black text-white rounded-3xl"
                  }`}
                  onClick={() => setActivePollutant("no2")}
                >
                  NO2
                </li>
              )}
              {/* OZONE */}
              {selectedStationInfo.forecast.daily.o3 && (
                <li
                  className={`cursor-pointer p-2 text-sm ${
                    activePollutant === "o3" &&
                    "bg-black text-white rounded-3xl"
                  }`}
                  onClick={() => setActivePollutant("o3")}
                >
                  Ozone
                </li>
              )}
            </ul>
            {/* Chart */}
            <div className="w-full h-[300px]">
              {activePollutant ? (
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart
                    // @ts-expect-error bad type definition
                    data={selectedStationInfo.forecast.daily[activePollutant]}
                    margin={{ top: 0, right: 0, left: 0, bottom: 0 }}
                  >
                    <CartesianGrid strokeDasharray="1 1" />
                    <XAxis
                      dataKey="day"
                      stroke={isDarkMode ? "#fff" : "#000"}
                      tick={{ fill: isDarkMode ? "#fff" : "#000" }}
                      tickLine={{ stroke: isDarkMode ? "#fff" : "#000" }}
                      axisLine={{ stroke: isDarkMode ? "#fff" : "#000" }}
                      dy={10}
                    />
                    <YAxis
                      stroke={isDarkMode ? "#fff" : "#000"}
                      tick={{ fill: isDarkMode ? "#fff" : "#000" }}
                      tickLine={{ stroke: isDarkMode ? "#fff" : "#000" }}
                      axisLine={{ stroke: isDarkMode ? "#fff" : "#000" }}
                      dx={-10}
                    />
                    {/* @ts-expect-error bad type definition */}
                    <Tooltip content={<CustomTooltip />} />
                    <Legend />
                    <Line type="monotone" dataKey="avg" stroke="#8884d8" />
                    <Line type="monotone" dataKey="max" stroke="#82ca9d" />
                    <Line type="monotone" dataKey="min" stroke="#ff7300" />
                  </LineChart>
                </ResponsiveContainer>
              ) : null}
            </div>
            {/* Attributions */}
            <small className="text-xs">Attributions:</small>
            <ul className="text-xs">
              {selectedStationInfo?.attributions.map((attribution, id) => (
                <li key={id} className="flex items-center gap-x-2">
                  {attribution.logo && (
                    <img
                      src={`https://aqicn.org/images/feeds/${attribution.logo}`}
                      width={20}
                      height={20}
                    ></img>
                  )}
                  <small>
                    <a href={attribution.url} target="_blank">
                      {attribution.name}
                    </a>
                  </small>
                </li>
              ))}
            </ul>
          </div>
        ) : null}
      </div>
    );
  }, [selectedStationInfo, activePollutant, isDarkMode]);

  return (
    <main
      className={`transition-colors duration-300 ${isDarkMode ? "bg-black text-white" : "bg-white text-black"}`}
    >
      <header
        className={`h-14 flex items-center justify-between px-6 ${
          isDarkMode ? "bg-black text-white" : "bg-white text-black"
        }`}
      >
        <p>Global Real-Time Air Quality Monitoring Dashboard</p>
        <button
          onClick={toggleTheme}
          className={`px-4 py-2 rounded-md ${
            isDarkMode ? "bg-gray-700 text-white" : "bg-gray-300 text-black"
          } hover:opacity-90 transition`}
        >
          {isDarkMode ? "Light Mode" : "Dark Mode"}
        </button>
      </header>
      <div className="w-full h-screen grid grid-cols-9">
        {/* This is the sidebar where the information about the air quality is presented.*/}
        {renderSidePanel}
        {/* This is the html div element containing the map. */}
        <div id="map" className="col-span-6 w-full h-[95dvh]"></div>
      </div>
    </main>
  );
}

// Exporting it, so it can be imported and rendered in the 'main.tsx' file.
export default App;

/**
 * This is a custom Tooltip Component for the chart.
 */
const CustomTooltip = ({
  active,
  payload,
  label,
}: {
  active: boolean;
  payload: Record<string, string>[];
  label: string;
}) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white p-4 rounded-lg shadow-lg">
        <p className="text-sm font-bold text-gray-700">{label}</p>
        <p className="text-sm text-gray-500">Avg: {payload[0].value}</p>
        <p className="text-sm text-gray-500">Max: {payload[1].value}</p>
        <p className="text-sm text-gray-500">Min: {payload[2].value}</p>
      </div>
    );
  }
  return null;
};
