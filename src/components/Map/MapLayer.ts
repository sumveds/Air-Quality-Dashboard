import maplibregl from "maplibre-gl";

/**
 * A function to add a cluster layer to an existing "stations" source,
 * for a given theme (isDarkMode).
 */
export function addClusterLayer(map: maplibregl.Map, isDarkMode: boolean) {
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
      "circle-radius": ["step", ["get", "point_count"], 20, 100, 30, 750, 40],
      "circle-stroke-width": 2,
      "circle-stroke-color": "#FFFFFF",
    },
  });
}

/**
 * A function to add a unclustered layer to an existing "stations" source,
 * for a given theme (isDarkMode).
 */
export function addUnclusteredLayer(map: maplibregl.Map, isDarkMode: boolean) {
  // Add unclustered layer with updated colors
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
}
