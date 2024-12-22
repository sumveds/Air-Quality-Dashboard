import { TStation } from "../../types";

/**
 * This is a function that convers the stations data to a
 * GeoJSON FeatureCollection for easy rendering on the map.
 * @param stations The stations to convert to GeoJSON.
 */
export function stationsToGeoJSON(
  stations: TStation[],
): GeoJSON.FeatureCollection {
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
