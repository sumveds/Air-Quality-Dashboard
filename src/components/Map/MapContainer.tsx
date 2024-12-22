import React from "react";
import { TSelectedStation } from "../../types";
import { useMap } from "../../hooks/useMap";

type MapContainerProps = {
  isDarkMode: boolean;
  setSelectedStationInfo: (station: TSelectedStation | null) => void;
};

const MapContainer: React.FC<MapContainerProps> = ({
  isDarkMode,
  setSelectedStationInfo,
}) => {
  // 1) Call the custom hook
  const { mapContainerRef } = useMap({ isDarkMode, setSelectedStationInfo });

  // 2) Render the <div> that hosts the map
  return (
    <div
      ref={mapContainerRef}
      className="col-span-6 w-full h-[95dvh]"
      style={{ position: "relative" }}
    />
  );
};

export default MapContainer;
