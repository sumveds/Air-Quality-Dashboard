// src/components/Map/MapContainer.tsx
import React, { useEffect, useState } from "react";
import maplibregl, {
  GeolocateControl,
  Map as MapLibreMap,
  NavigationControl,
} from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import { TSelectedStation } from "../../types";
import { populateMarkers } from "./MarkerUtils";

type MapContainerProps = {
  isDarkMode: boolean;
  setSelectedStationInfo: (station: TSelectedStation | null) => void;
};

const MapContainer: React.FC<MapContainerProps> = ({
  isDarkMode,
  setSelectedStationInfo,
}) => {
  const [map, setMap] = useState<MapLibreMap | null>(null);
  const [userCoordinates, setUserCoordinates] = useState<
    [number, number] | null
  >(null);

  // 1) Create the map on first mount
  useEffect(() => {
    if (map) return;

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        setUserCoordinates([longitude, latitude]);

        const newMap = new maplibregl.Map({
          container: "map", // matches the <div id="map"> below
          style:
            "https://tiles.basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json",
          center: [longitude, latitude],
          zoom: 7,
        });

        newMap.addControl(new NavigationControl());
        newMap.addControl(
          new GeolocateControl({
            positionOptions: { enableHighAccuracy: true },
            trackUserLocation: true,
          }),
        );

        // Place a marker at user's location
        new maplibregl.Marker({ color: "green" })
          .setLngLat([longitude, latitude])
          .addTo(newMap);

        setMap(newMap);
      },
      (error) => {
        console.error("Geolocation error:", error);
        // Optional fallback if geolocation fails:
        const fallbackMap = new maplibregl.Map({
          container: "map",
          style:
            "https://tiles.basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json",
          center: [78.9629, 20.5937], // Approx center of India
          zoom: 4,
        });
        fallbackMap.addControl(new NavigationControl());
        setMap(fallbackMap);
      },
    );
  }, [map]);

  // 2) When `isDarkMode` changes, update the map style
  //    Re-add the marker and call populateMarkers again
  useEffect(() => {
    if (!map || !userCoordinates) return;

    const styleUrl = isDarkMode
      ? "https://tiles.basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json"
      : "https://tiles.basemaps.cartocdn.com/gl/positron-gl-style/style.json";

    map.setStyle(styleUrl);

    map.on("styledata", async () => {
      // Re-add the green location marker
      new maplibregl.Marker({ color: "green" })
        .setLngLat(userCoordinates)
        .addTo(map);

      await populateMarkers(map, setSelectedStationInfo, isDarkMode);
    });
  }, [isDarkMode, map, userCoordinates, setSelectedStationInfo]);

  // 3) On map load and on move, fetch and populate markers
  useEffect(() => {
    if (!map) return;

    map.on("load", async () => {
      await populateMarkers(map, setSelectedStationInfo, isDarkMode);
    });

    map.on("moveend", async () => {
      await populateMarkers(map, setSelectedStationInfo, isDarkMode);
    });
  }, [map, setSelectedStationInfo, isDarkMode]);

  return (
    <div
      id="map"
      className="col-span-6 w-full h-[95dvh]"
      style={{ position: "relative" }}
    />
  );
};

export default MapContainer;
