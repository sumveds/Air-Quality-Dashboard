import React, { useEffect } from "react";
import { useMap } from "../../hooks/useMap";
import L, { Map as LeafletMap } from "leaflet";
import { TSelectedStation, TStationCoordinates } from "../../types";

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
  const { mapContainerRef, map } = useMap({
    isDarkMode,
    setSelectedStationInfo,
  });

  useEffect(() => {
    if (map instanceof LeafletMap && location) {
      map.setView([location.lat, location.lon], 13);
      L.marker([location.lat, location.lon]).addTo(map);
    }
  }, [map, location]);

  return <div ref={mapContainerRef} className="col-span-6 w-full h-[95dvh]" />;
};

export default MapContainer;
