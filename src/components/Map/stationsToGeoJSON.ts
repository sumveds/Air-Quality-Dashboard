import { TStation } from "../../types";
import AirQualityService from "../../services/airQualityService";

/**
 * This is a function that converts the stations data to a
 * GeoJSON FeatureCollection for easy rendering on the map.
 * @param stations The stations to convert to GeoJSON.
 */
export async function stationsToGeoJSON(
  stations: TStation[],
): Promise<GeoJSON.FeatureCollection> {
  // Step 1: Filter out valid AQI values for avg_aqi calculation
  const validAQIs = stations
    .map((station) => Number(station.aqi))
    .filter((aqi) => !isNaN(aqi) && aqi >= 0);

  const avg_aqi =
    validAQIs.length > 0
      ? validAQIs.reduce((sum, aqi) => sum + aqi, 0) / validAQIs.length
      : null;

  // Step 2: Identify stations with invalid AQI
  const invalidStations = stations.filter(
    (station) => isNaN(Number(station.aqi)) || Number(station.aqi) < 0,
  );

  // Fetch updated AQI values for stations with invalid data
  const updatedAQIData = await Promise.all(
    invalidStations.map(async (station) => {
      try {
        const response = await AirQualityService.getAirQuality(station.uid);
        if (response?.data?.aqi) {
          return { uid: station.uid, aqi: Number(response.data.aqi) };
        }
      } catch (error) {
        console.error(`Failed to fetch AQI for station ${station.uid}`, error);
      }
      return { uid: station.uid, aqi: null }; // Return null if fetch fails
    }),
  );

  // Map updated AQI values for easier lookup
  const updatedAQIMap = new Map(
    updatedAQIData
      .filter((data) => data.aqi !== null && !isNaN(data.aqi) && data.aqi >= 0) // Ensure valid AQI
      .map((data) => [data.uid, data.aqi]),
  );

  // Step 3: Filter out stations with invalid AQI after the update
  const validStations = stations.filter((station) => {
    const parsedAQI = Number(station.aqi);
    const updatedAQI = updatedAQIMap.get(station.uid) ?? null; // Default to null if not found
    return (
      (!isNaN(parsedAQI) && parsedAQI >= 0) ||
      (updatedAQI !== null && updatedAQI >= 0)
    );
  });

  // Step 4: Transform valid stations into GeoJSON features
  const features: GeoJSON.Feature[] = validStations.map((station: TStation) => {
    const parsedAQI = Number(station.aqi);
    const aqi =
      !isNaN(parsedAQI) && parsedAQI >= 0
        ? parsedAQI // Use original AQI if valid
        : (updatedAQIMap.get(station.uid) ?? null); // Use updated AQI or fallback to null

    return {
      type: "Feature",
      properties: {
        stationName: station.station.name,
        uid: station.uid,
        aqi,
        avg_aqi, // Embed avg_aqi for reference
      },
      geometry: {
        type: "Point",
        coordinates: [station.lon, station.lat],
      },
    };
  });

  // Step 5: Return the fully prepared GeoJSON
  return {
    type: "FeatureCollection",
    features,
  };
}
