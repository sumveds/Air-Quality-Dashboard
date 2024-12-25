import React, { useEffect, useMemo } from "react";
import { TSelectedStation } from "../../types";
import AirQualityInfo from "./AirQualityInfo";
import ForecastChart from "./ForecastChart";

type SidebarProps = {
  selectedStationInfo: TSelectedStation | null;
  activePollutant: string;
  setActivePollutant: (pollutant: string) => void;
  isDarkMode: boolean;
  isVisible: boolean;
  toggleSidebar: () => void;
  onLoad: () => void;
};

const Sidebar: React.FC<SidebarProps> = ({
  selectedStationInfo,
  activePollutant,
  setActivePollutant,
  isDarkMode,
  isVisible,
  toggleSidebar,
  onLoad,
}) => {
  useEffect(() => {
    if (selectedStationInfo) {
      onLoad(); // Notify App when Sidebar is loaded
    }
  }, [selectedStationInfo]);

  const panelContent = useMemo(() => {
    if (!selectedStationInfo) return null;

    return (
      <div className="space-y-1.5">
        <AirQualityInfo
          selectedStationInfo={selectedStationInfo}
          isDarkMode={isDarkMode}
        />
        <ForecastChart
          selectedStationInfo={selectedStationInfo}
          activePollutant={activePollutant}
          setActivePollutant={setActivePollutant}
          isDarkMode={isDarkMode}
        />
      </div>
    );
  }, [selectedStationInfo, activePollutant, isDarkMode]);

  return (
    <div
      className={`sidebar w-full h-full bg-[#383841] text-white transition-transform duration-300 overflow-y-auto ${
        isVisible ? "translate-x-0" : "-translate-x-full"
      } md:translate-x-0 md:col-span-4`}
    >
      {/* Close Button for Mobile */}
      <button
        className="close-sidebar md:hidden absolute top-4 right-4 text-white text-[2.0rem]"
        onClick={toggleSidebar}
      >
        ✕
      </button>

      {panelContent || (
        <div className="flex items-center justify-center h-full">
          <p>No station selected yet.</p>
        </div>
      )}
    </div>
  );
};

export default Sidebar;
