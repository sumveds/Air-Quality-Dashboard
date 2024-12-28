import React, { useEffect, useState } from "react";
import { useMap } from "../../hooks/useMap";
import maplibregl, { Map as MapLibreMap } from "maplibre-gl";
import { TSelectedStation, TStationCoordinates } from "../../types";
import { BarLoader } from "react-spinners";
import AirQualityService from "../../services/airQualityService";
import InfoDialog from "../InfoDialog";

type MapContainerProps = {
  isDarkMode: boolean;
  setSelectedStationInfo: (station: TSelectedStation | null) => void;
  isSidebarVisible: boolean;
  location?: TStationCoordinates | null;
  isCurrentLocation: boolean;
};

const MapContainer: React.FC<MapContainerProps> = ({
  isDarkMode,
  setSelectedStationInfo,
  location,
  isCurrentLocation,
}) => {
  const [isLoading, setIsLoading] = useState(false); // Manage loading state
  const [dialogMessage, setDialogMessage] = useState<string | null>(null); // Dialog message state
  const { mapContainerRef, map, currentMarkerRef } = useMap({
    isDarkMode,
    setSelectedStationInfo,
    setIsLoading, // Pass the loading state setter to the useMap hook
  });

  useEffect(() => {
    console.log("Map useEffect triggered with location:", location);

    if (map instanceof MapLibreMap && location) {
      console.log("Focusing map on location:", location);

      // Fly to the location
      map.flyTo({
        center: [location.lon, location.lat],
        zoom: 8,
        essential: true, // Ensures the animation is essential
      });

      // Remove the previous marker if it exists
      if (currentMarkerRef.current) {
        currentMarkerRef.current.remove();
      }

      // Add a marker at the new location
      const newMarker = new maplibregl.Marker({ color: "green" })
        .setLngLat([location.lon, location.lat])
        .addTo(map);

      // Update the currentMarkerRef to point to the latest marker
      currentMarkerRef.current = newMarker;

      // Fetch nearest station
      fetchNearestStationInfo(location);
    } else if (!map) {
      console.log("Map is not initialized yet.");
    }
  }, [map, location]);

  const fetchNearestStationInfo = async (location: TStationCoordinates) => {
    setIsLoading(true); // Show loading spinner during fetch
    try {
      const nearestStationInfo =
        await AirQualityService.getAirQualityOfNearestStation(
          location.lat,
          location.lon,
        );
      if (nearestStationInfo && nearestStationInfo.data) {
        setSelectedStationInfo(nearestStationInfo.data);
      } else {
        // setSelectedStationInfo(null);
        if (isCurrentLocation) {
          setDialogMessage(
            "No nearby station was found for the selected location. " +
              "Displaying data for the default location instead.",
          );
        } else {
          setDialogMessage(
            "No nearby station was found for the selected location. " +
              "Displaying data for the previously selected location instead.",
          );
        }
      }
    } catch (error) {
      console.error("Error fetching nearest station info:", error);
      setDialogMessage("An error occurred while fetching station information.");
    } finally {
      setIsLoading(false); // Hide loading spinner after fetch
    }
  };

  return (
    <div className="relative w-full h-full">
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-white bg-opacity-50 z-50">
          <BarLoader color="#696969" />
        </div>
      )}
      {dialogMessage && (
        <InfoDialog
          message={dialogMessage}
          onClose={() => setDialogMessage(null)}
        />
      )}
      <div
        ref={mapContainerRef}
        className="map-container col-span-6 w-full h-[95dvh]"
      />
    </div>
  );
};

export default MapContainer;
