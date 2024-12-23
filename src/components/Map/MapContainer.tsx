import React, { useEffect } from "react";
import { useMap } from "../../hooks/useMap";
import maplibregl, { Map as MapLibreMap } from "maplibre-gl";
import { TSelectedStation, TStationCoordinates } from "../../types";
import AirQualityService from "../../services/airQualityService";

type MapContainerProps = {
  isDarkMode: boolean;
  setSelectedStationInfo: (station: TSelectedStation | null) => void;
  isSidebarVisible: boolean;
  location?: TStationCoordinates | null;
};

const MapContainer: React.FC<MapContainerProps> = ({
  isDarkMode,
  setSelectedStationInfo,
  location,
}) => {
  console.log("Received location prop in MapContainer:", location);
  const { mapContainerRef, map } = useMap({
    isDarkMode,
    setSelectedStationInfo,
  });

  useEffect(() => {
    console.log("Map useEffect triggered with location:", location);

    if (map instanceof MapLibreMap && location) {
      console.log("Focusing map on location:", location);

      // Fly to the location
      map.flyTo({
        center: [location.lon, location.lat],
        zoom: 13,
        essential: true, // Ensures the animation is essential
      });

      // Add a marker at the new location
      new maplibregl.Marker({ color: "red" })
        .setLngLat([location.lon, location.lat])
        .addTo(map);

      // Fetch nearest station
      fetchNearestStationInfo(location);
    } else if (!map) {
      console.log("Map is not initialized yet.");
    }
  }, [map, location]);

  const fetchNearestStationInfo = async (location: TStationCoordinates) => {
    const nearestStationInfo =
      await AirQualityService.getAirQualityOfNearestStation(
        location.lat,
        location.lon,
      );
    setSelectedStationInfo(nearestStationInfo.data);
  };

  return <div ref={mapContainerRef} className="col-span-6 w-full h-[95dvh]" />;
};

export default MapContainer;
