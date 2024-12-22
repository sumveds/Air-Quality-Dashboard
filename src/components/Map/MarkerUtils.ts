import maplibregl from "maplibre-gl";
import { TSelectedStation } from "../../types";
import AirQualityService from "../../services/airQualityService";
import { stationsToGeoJSON } from "./stationsToGeoJSON";
import { addClusterLayer, addUnclusteredLayer } from "./MapLayer";

const WORLD_AIR_QUALITY_BASE_API_URL = "https://api.waqi.info/";
const WORLD_AIR_QUALITY_API_TOKEN = "e4e922828e41a73cfe4645c0db52103229422e8a";

/**
 * This is a function that populates the points on the map.
 * @param map The maplibre map instance.
 * @param bounds The current bounding box of the map.
 * @param setSelectedStationInfo The callback function to update the state with the clicked/selected station.
 */

export async function populateMarkers(
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
    `${WORLD_AIR_QUALITY_BASE_API_URL}v2/map/bounds/?latlng=${extendedBounds}&token=${WORLD_AIR_QUALITY_API_TOKEN}`,
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
        addClusterLayer(map, isDarkMode);

        // Add unclustered-point layer
        addUnclusteredLayer(map, isDarkMode);

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
