import maplibregl from "maplibre-gl";
import { throttle } from "lodash";
import { TSelectedStation } from "../../types";
import AirQualityService from "../../services/airQualityService";
import GeoService from "../../services/geoService";
import { stationsToGeoJSON } from "./stationsToGeoJSON";
import { addClusterLayer, addUnclusteredLayer } from "./MapLayer";

/**
 * This function populates the points on the map with throttling.
 * @param map The maplibre map instance.
 * @param setSelectedStationInfo The callback function to update the state with the clicked/selected station.
 * @param isDarkMode Whether dark mode is active (for coloring the layers)
 */
export const populateMarkers = throttle(
  async (
    map: maplibregl.Map,
    setSelectedStationInfo: (station: TSelectedStation) => void,
    isDarkMode: boolean,
  ) => {
    const mapBounds = map.getBounds();

    const zoomLevel = map.getZoom();
    const factor = zoomLevel < 10 ? 1 : 0.1;

    // Grab extended bounding box
    const latNorth = mapBounds.getNorth() + factor;
    const lngWest = mapBounds.getWest() - factor;
    const latSouth = mapBounds.getSouth() - factor;
    const lngEast = mapBounds.getEast() + factor;

    try {
      // 1) Use your service method to fetch station data within bounds
      const stations = await GeoService.getStationsWithinBounds(
        latNorth,
        lngWest,
        latSouth,
        lngEast,
      );

      if (stations.status !== "ok") {
        throw stations.data || new Error("Failed to fetch station data");
      }

      // 2) Convert station data to GeoJSON
      const geoJSON = await stationsToGeoJSON(stations.data);

      // 3) Check if we already have a "stations" source
      if (map.getSource("stations")) {
        // Only update the data of the existing source
        const source = map.getSource("stations") as maplibregl.GeoJSONSource;
        source.setData(geoJSON);
      } else {
        // 4) Add the source only if it doesn't exist
        map.addSource("stations", {
          type: "geojson",
          data: geoJSON,
          cluster: true,
          clusterMaxZoom: 14,
          clusterRadius: 50,
          clusterProperties: {
            avg_aqi: ["+", ["get", "aqi"]], // Summation for cluster
          },
        });

        // 5) Add the cluster and unclustered-point layers
        addClusterLayer(map, isDarkMode);
        addUnclusteredLayer(map, isDarkMode);

        // 6) Add hover effect to change the cursor
        map.on("mouseenter", "unclustered-point", () => {
          map.getCanvas().style.cursor = "pointer";
        });
        map.on("mouseleave", "unclustered-point", () => {
          map.getCanvas().style.cursor = "";
        });

        // 7) Add click event listener for unclustered-point
        map.on("click", "unclustered-point", async (e: any) => {
          const coordinates = e.features[0].geometry.coordinates.slice();
          const { stationName, uid } = e.features[0].properties;

          // Show popup for station
          new maplibregl.Popup()
            .setLngLat(coordinates)
            .setHTML(`<strong style="color:black;">${stationName}</strong>`)
            .addTo(map);

          try {
            const stationInfo = await AirQualityService.getAirQuality(uid);
            if (stationInfo && stationInfo.data) {
              setSelectedStationInfo(stationInfo.data);
            } else {
              console.error("Failed to fetch station information");
            }
          } catch (error) {
            console.error("Error fetching station data:", error);
          }
        });
      }
    } catch (error) {
      console.error("Error fetching station data:", error);
    }
  },
  2000, // Throttle interval in milliseconds
  { leading: true, trailing: true }, // Optional: Adjust throttle behavior
);
