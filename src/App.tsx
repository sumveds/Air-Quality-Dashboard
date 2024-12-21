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
      console.log("Generated GeoJSON with avg_aqi:", geoJSON);

      if (map.getSource("stations")) {
        // Update the existing source with new data
        const source = map.getSource("stations") as maplibregl.GeoJSONSource;
        source.setData(geoJSON);
      } else {
        // Add a new source with clustering and avg_aqi calculation
        map.addSource("stations", {
          type: "geojson",
          data: geoJSON,
          cluster: true,
          clusterMaxZoom: 14, // Max zoom level to cluster points
          clusterRadius: 50, // Radius of each cluster
          clusterProperties: {
            avg_aqi: ["+", ["get", "aqi"]], // Calculate average AQI
          },
        });

        // Add cluster layer
        // Calculate the average AQI for stations in a cluster and color the cluster bubbles.
        map.addLayer({
          id: "clusters",
          type: "circle",
          source: "stations",
          filter: ["has", "point_count"],
          paint: {
            "circle-color": [
              "step",
              ["get", "avg_aqi"], // Use avg_aqi in properties
              "#00FF00", // Good (0-50) - Bright Green
              50,
              "#FFD700", // Moderate (51-100) - Gold
              100,
              "#FF8C00", // Unhealthy for Sensitive Groups (101-150) - Dark Orange
              150,
              "#FF4500", // Unhealthy (151-200) - Orange Red
              200,
              "#DC143C", // Very Unhealthy (201-300) - Crimson
              300,
              "#FF0000", // Hazardous (300+) - Bright Red
            ],
            "circle-radius": [
              "step",
              ["get", "point_count"],
              20, // Size for small clusters
              100,
              30,
              750,
              40,
            ],
            "circle-stroke-width": 2,
            "circle-stroke-color": "#FFFFFF", // White stroke to ensure contrast
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
              "#9BD74E", // Good
              50,
              "#f1f075", // Moderate
              100,
              "#f28cb1", // Unhealthy for Sensitive Groups
              150,
              "#e55e5e", // Unhealthy
              200,
              "#d4201f", // Very Unhealthy
              300,
              "#8b0000", // Hazardous
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

          new maplibregl.Popup()
            .setLngLat(coordinates)
            .setHTML(`<strong style='color:black;'>${stationName}</strong>`)
            .addTo(map);

          // Fetch detailed information for the selected station
          const stationInfo = await getMarkerAQI(uid);
          setSelectedStationInfo(stationInfo?.data); // Update the selected station info state
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
  // This useEffect is used to load the map
  useEffect(() => {
    if (map) return;

    // Fetch user's geolocation
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;

        // Initialize the map with user's location
        const newMap = new maplibregl.Map({
          container: "map",
          style:
            "https://tiles.basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json",
          center: [longitude, latitude], // Center on user's location
          zoom: 10, // Adjust zoom for city-level view
        });

        newMap.addControl(new NavigationControl());
        newMap.addControl(
          new GeolocateControl({
            positionOptions: {
              enableHighAccuracy: true,
            },
            trackUserLocation: true,
          }),
        );

        // Add a marker for the user's current location
        new maplibregl.Marker({ color: "green" }) // Customize the pin color
          .setLngLat([longitude, latitude]) // Set to user's location
          .addTo(newMap);

        setMap(newMap);
      },
      (error) => {
        console.error("Geolocation error:", error);

        // Fallback to a default location (e.g., Bangalore)
        const fallbackLocation = { latitude: 12.9716, longitude: 77.5946 };
        const newMap = new maplibregl.Map({
          container: "map",
          style:
            "https://tiles.basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json",
          center: [fallbackLocation.longitude, fallbackLocation.latitude],
          zoom: 0,
        });

        newMap.addControl(new NavigationControl());
        newMap.addControl(
          new GeolocateControl({
            positionOptions: {
              enableHighAccuracy: true,
            },
            trackUserLocation: true,
          }),
        );

        // Add a marker for the fallback location
        new maplibregl.Marker({ color: "red" }) // Customize the pin color
          .setLngLat([fallbackLocation.longitude, fallbackLocation.latitude])
          .addTo(newMap);

        setMap(newMap);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
      },
    );
  }, [map]);

  useEffect(() => {
    if (!map) return;

    map.on("load", async () => {
      await populateMarkers(map, setSelectedStationInfo);
    });

    map.on("moveend", async () => {
      await populateMarkers(map, setSelectedStationInfo);
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
      <div className="col-span-3 space-y-1.5 h-[95dvh] overflow-scroll bg-[#383841]">
        <div
          className={`text-black p-6 flex flex-col gap-y-3 ${backgroundColors[color]}`}
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
        <div className="p-4 flex flex-col gap-y-4 bg-black">
          <small>Last updated: {selectedStationInfo?.time.s}</small>
          <p className="text-base">Main Pollutants</p>
          <ul className="flex items-center justify-between gap-x-1">
            {/* PM 2.5 */}
            {selectedStationInfo?.iaqi.pm25 && (
              <li className="flex flex-col gap-y-2 items-center">
                <span className="text-base bg-[#383841] px-4 py-1  rounded-2xl">
                  {selectedStationInfo?.iaqi.pm25.v}
                </span>
                <span className="text-xs font-light text-[#9D9DA1]">
                  PM 2.5
                </span>
              </li>
            )}

            {/* PM 10 */}
            {selectedStationInfo?.iaqi.pm10 && (
              <li className="flex flex-col gap-y-2 items-center">
                <span className="text-base bg-[#383841] px-4 py-1  rounded-2xl">
                  {selectedStationInfo?.iaqi.pm10.v}
                </span>
                <span className="text-xs font-light text-[#9D9DA1]">PM 10</span>
              </li>
            )}

            {/* NO2 */}
            {selectedStationInfo?.iaqi.no2 && (
              <li className="flex flex-col gap-y-2 items-center">
                <span className="text-base bg-[#383841] px-4 py-1  rounded-2xl">
                  {selectedStationInfo?.iaqi.no2.v}
                </span>
                <span className="text-xs font-light text-[#9D9DA1]">NO2</span>
              </li>
            )}
            {/* OZONE */}
            {selectedStationInfo?.iaqi.o3 && (
              <li className="flex flex-col gap-y-2 items-center">
                <span className="text-base bg-[#383841] px-4 py-1  rounded-2xl">
                  {selectedStationInfo?.iaqi.o3.v}
                </span>
                <span className="text-xs font-light text-[#9D9DA1]">Ozone</span>
              </li>
            )}
          </ul>
        </div>

        {/* Forecast Chart */}
        {selectedStationInfo?.forecast?.daily ? (
          <div className="p-4 flex flex-col gap-y-4 bg-black">
            <p className="text-base">Air Quality Forecast</p>
            {/* Tabs */}
            <ul className="flex items-center px-2 py-1 rounded-3xl justify-between gap-x-1 bg-[#383841] text-[#9D9DA1]">
              {/* PM 2.5 */}
              {selectedStationInfo.forecast.daily.pm25 && (
                <li
                  className={`cursor-pointer p-2  text-sm ${activePollutant === "pm25" && "bg-black text-white  rounded-3xl"}`}
                  onClick={() => setActivePollutant("pm25")}
                >
                  PM 2.5
                </li>
              )}

              {/* PM 10 */}
              {selectedStationInfo.forecast.daily.pm10 && (
                <li
                  className={`cursor-pointer p-2 text-sm ${activePollutant === "pm10" && "bg-black text-white cursor-pointer rounded-3xl"}`}
                  onClick={() => setActivePollutant("pm10")}
                >
                  PM10
                </li>
              )}

              {/* NO2 */}
              {selectedStationInfo.forecast.daily.no2 && (
                <li
                  className={`cursor-pointer p-2 text-sm ${activePollutant === "no2" && "bg-black text-white cursor-pointer rounded-3xl"}`}
                  onClick={() => setActivePollutant("no2")}
                >
                  NO2
                </li>
              )}
              {/* OZONE */}
              {selectedStationInfo.forecast.daily.o3 && (
                <li
                  className={`cursor-pointer p-2 text-sm ${activePollutant === "o3" && "bg-black text-white cursor-pointer rounded-3xl"}`}
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
                      stroke="#fff"
                      tick={{ fill: "#fff" }}
                      tickLine={{ stroke: "#fff" }}
                      axisLine={{ stroke: "#fff" }}
                      dy={10}
                    />
                    <YAxis
                      stroke="#fff"
                      tick={{ fill: "#fff" }}
                      tickLine={{ stroke: "#fff" }}
                      axisLine={{ stroke: "#fff" }}
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
            {/*  Attributions  */}
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
  }, [selectedStationInfo, activePollutant]);

  return (
    <main className="bg-black text-white">
      <header className="h-14 flex items-center px-6 ">
        <p>Global Real-Time Air Quality Monitoring Dashboard</p>
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
