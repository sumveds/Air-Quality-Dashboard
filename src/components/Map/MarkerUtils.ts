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
    setSelectedStationInfo: (station: TSelectedStation | null) => void,
    isDarkMode: boolean,
    setIsLoading: (loading: boolean) => void, // Pass state to control spinner visibility
  ) => {
    // setIsLoading(true); // Start showing spinner

    const mapBounds = map.getBounds();

    const zoomLevel = map.getZoom();
    const factor = zoomLevel < 10 ? 1 : 0.1;

    const latNorth = mapBounds.getNorth() + factor;
    const lngWest = mapBounds.getWest() - factor;
    const latSouth = mapBounds.getSouth() - factor;
    const lngEast = mapBounds.getEast() + factor;

    try {
      // Fetch station data within bounds
      const stations = await GeoService.getStationsWithinBounds(
        latNorth,
        lngWest,
        latSouth,
        lngEast,
      );

      if (stations.status !== "ok" || !stations.data) {
        console.error("Failed to fetch station data");
        setIsLoading(false);
        return;
      }

      // Convert station data to GeoJSON
      const geoJSON = await stationsToGeoJSON(stations.data);

      // Check if the source already exists
      if (map.getSource("stations")) {
        // Update the existing source's data
        const source = map.getSource("stations") as maplibregl.GeoJSONSource;
        source.setData(geoJSON);
      } else {
        // Add a new GeoJSON source with clustering enabled
        map.addSource("stations", {
          type: "geojson",
          data: geoJSON,
          cluster: true,
          clusterMaxZoom: 14, // Maximum zoom level for clusters
          clusterRadius: 50, // Cluster radius in pixels
          clusterProperties: {
            avg_aqi: ["+", ["get", "aqi"]], // Sum up AQI values for clusters
          },
        });

        // Add cluster and unclustered-point layers
        addClusterLayer(map, isDarkMode);
        addUnclusteredLayer(map, isDarkMode);

        // Add hover effect for unclustered points
        map.on("mouseenter", "unclustered-point", () => {
          map.getCanvas().style.cursor = "pointer";
        });
        map.on("mouseleave", "unclustered-point", () => {
          map.getCanvas().style.cursor = "";
        });

        // Remove previous event listeners to avoid duplicates
        map.off("mouseenter", "unclustered-point", () => {
          map.getCanvas().style.cursor = "pointer";
        });
        map.off("mouseleave", "unclustered-point", () => {
          map.getCanvas().style.cursor = "";
        });

        // Add click event for unclustered points
        map.on("click", "unclustered-point", async (e: any) => {
          // setSelectedStationInfo(null);
          setIsLoading(true);
          const coordinates = e.features[0].geometry.coordinates.slice();
          const { stationName, uid } = e.features[0].properties;

          // Show popup for the selected station
          new maplibregl.Popup({
            className: "custom-popup",
            closeOnClick: true,
            closeOnMove: true,
          })
            .setLngLat(coordinates)
            .setHTML(`<strong style="color:black;">${stationName}</strong>`)
            .addTo(map);

          // Fetch and update station details
          try {
            const stationInfo = await AirQualityService.getAirQuality(uid);
            if (stationInfo && stationInfo.data) {
              setSelectedStationInfo(stationInfo.data);
            } else {
              console.error("Failed to fetch station information");
            }
          } catch (error) {
            console.error("Error fetching station data:", error);
          } finally {
            setIsLoading(false);
          }
        });
      }
    } catch (error) {
      console.error("Error in populateMarkers:", error);
    } /* finally {
      setIsLoading(false); // Stop showing spinner
    }*/
  },
  300, // Throttle interval in milliseconds
  { leading: true, trailing: true },
);
