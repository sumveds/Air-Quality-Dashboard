import maplibregl from "maplibre-gl";

/**
 * Populates or removes the heatmap layer based on visibility.
 * @param map The MapLibre map instance.
 * @param isHeatmapVisible Whether the heatmap is visible.
 */
export const populateHeatmap = (
  map: maplibregl.Map,
  isHeatmapVisible: boolean,
) => {
  if (!map) return;

  if (isHeatmapVisible) {
    if (!map.getLayer("heatmap-layer")) {
      // Add the heatmap layer if it doesn't exist
      map.addLayer({
        id: "heatmap-layer",
        type: "heatmap",
        source: "stations", // Use the same source as the markers
        paint: {
          "heatmap-weight": [
            "interpolate",
            ["linear"],
            ["get", "aqi"],
            0,
            0,
            500,
            1,
          ],
          "heatmap-color": [
            "interpolate",
            ["linear"],
            ["heatmap-density"],
            0,
            "rgba(33,102,172,0)",
            0.2,
            "rgb(103,169,207)",
            0.4,
            "rgb(209,229,240)",
            0.6,
            "rgb(253,219,199)",
            0.8,
            "rgb(239,138,98)",
            1,
            "rgb(178,24,43)",
          ],
          "heatmap-radius": ["interpolate", ["linear"], ["zoom"], 0, 5, 9, 30],
          "heatmap-opacity": 0.7,
        },
      });
    }

    // Hide marker layers
    if (map.getLayer("clusters")) {
      map.setLayoutProperty("clusters", "visibility", "none");
    }
    if (map.getLayer("unclustered-point")) {
      map.setLayoutProperty("unclustered-point", "visibility", "none");
    }
  } else {
    // Remove the heatmap layer if it exists
    if (map.getLayer("heatmap-layer")) {
      map.removeLayer("heatmap-layer");
    }

    // Show marker layers
    if (map.getLayer("clusters")) {
      map.setLayoutProperty("clusters", "visibility", "visible");
    }
    if (map.getLayer("unclustered-point")) {
      map.setLayoutProperty("unclustered-point", "visibility", "visible");
    }
  }
};
