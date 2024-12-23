import React from "react";
import { TSelectedStation } from "../../types";
import { useMap } from "../../hooks/useMap";

type MapContainerProps = {
  isDarkMode: boolean;
  setSelectedStationInfo: (station: TSelectedStation | null) => void;
  isSidebarVisible: boolean;
};

const MapContainer: React.FC<MapContainerProps> = ({
  isDarkMode,
  setSelectedStationInfo,
}) => {
  const { mapContainerRef } = useMap({ isDarkMode, setSelectedStationInfo });

  return (
    <div
      ref={mapContainerRef}
      className="col-span-6 w-full h-[95dvh]"
      style={{ position: "relative" }}
    />
  );
};

export default MapContainer;
