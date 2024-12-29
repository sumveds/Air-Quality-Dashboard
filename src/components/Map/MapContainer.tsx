import React, { useEffect, useState } from "react";
import { useMap } from "../../hooks/useMap";
import maplibregl, { Map as MapLibreMap } from "maplibre-gl";
import { TSelectedStation, TStationCoordinates } from "../../types";
import { BarLoader } from "react-spinners";
import AirQualityService from "../../services/airQualityService";
import InfoDialog from "../InfoDialog";
import { populateMarkers } from "./MarkerUtils";
import { populateHeatmap } from "./HeatmapUtils";

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
  isSidebarVisible,
  location,
  isCurrentLocation,
}) => {
  const [isLoading, setIsLoading] = useState(false);
  const [dialogMessage, setDialogMessage] = useState<string | null>(null);
  const [isHeatmapVisible, setIsHeatmapVisible] = useState(false); // Heatmap toggle state
  const { mapContainerRef, map, currentMarkerRef } = useMap({
    isDarkMode,
    setSelectedStationInfo,
    setIsLoading,
  });

  useEffect(() => {
    if (map instanceof MapLibreMap && location) {
      map.flyTo({
        center: [location.lon, location.lat],
        zoom: 8,
        essential: true,
      });

      if (currentMarkerRef.current) {
        currentMarkerRef.current.remove();
      }

      const newMarker = new maplibregl.Marker({ color: "green" })
        .setLngLat([location.lon, location.lat])
        .addTo(map);

      currentMarkerRef.current = newMarker;
      fetchNearestStationInfo(location);
    }
  }, [map, location]);

  const fetchNearestStationInfo = async (location: TStationCoordinates) => {
    setIsLoading(true);
    try {
      const nearestStationInfo =
        await AirQualityService.getAirQualityOfNearestStation(
          location.lat,
          location.lon,
        );
      if (nearestStationInfo && nearestStationInfo.data) {
        setSelectedStationInfo(nearestStationInfo.data);
      } else {
        setDialogMessage(
          isCurrentLocation
            ? "No nearby station was found for the selected location. Displaying data for the default location instead."
            : "No nearby station was found for the selected location. Displaying data for the previously selected location instead.",
        );
      }
    } catch (error) {
      console.error("Error fetching nearest station info:", error);
      setDialogMessage("An error occurred while fetching station information.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (map) {
      populateMarkers(map, setSelectedStationInfo, isDarkMode, setIsLoading);
      populateHeatmap(map, isHeatmapVisible); // Call the new utility function
    }
  }, [map, isHeatmapVisible]);

  return (
    <div className="w-full h-full">
      {(!isSidebarVisible || window.innerWidth > 768) && (
        <div
          className="absolute z-[9999] rounded shadow-lg cursor-pointer flex items-center justify-center hover:shadow-xl heatmap-button-container"
          onClick={() => setIsHeatmapVisible((prev) => !prev)}
        >
          <button
            className="w-full h-full flex items-center justify-center text-center font-bold overflow-hidden whitespace-nowrap text-sm md:text-base px-2"
            style={{
              backgroundColor: isHeatmapVisible ? "red" : "green",
              color: "white",
              border: "none",
              borderRadius: "5px",
            }}
          >
            {isHeatmapVisible ? "Hide" : "Show"}
          </button>
        </div>
      )}
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
