import { useEffect, useRef, useState } from "react";
import maplibregl, {
  GeolocateControl,
  Map as MapLibreMap,
  NavigationControl,
} from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import { TSelectedStation } from "../types";
import { populateMarkers } from "../components/Map/MarkerUtils";

interface UseMapOptions {
  isDarkMode: boolean;
  setSelectedStationInfo: (station: TSelectedStation | null) => void;
}

/**
 * A custom hook that handles:
 * 1) Creating the MapLibre map
 * 2) Handling geolocation (user coordinates)
 * 3) Updating the style on `isDarkMode` changes
 * 4) Populating markers on load and move
 *
 * Returns a `mapContainerRef` you can attach to a <div> and the `map` instance.
 */
export function useMap({ isDarkMode, setSelectedStationInfo }: UseMapOptions) {
  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const [map, setMap] = useState<MapLibreMap | null>(null);
  const [userCoordinates, setUserCoordinates] = useState<
    [number, number] | null
  >(null);

  // 1) Create the map once, on mount
  useEffect(() => {
    if (map) return; // Map already created

    // Attempt geolocation
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        setUserCoordinates([longitude, latitude]);

        // Create the map only if we have a container and no map yet
        if (mapContainerRef.current) {
          const newMap = new maplibregl.Map({
            container: mapContainerRef.current, // the <div> from useRef
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

          // Mark user's location
          new maplibregl.Marker({ color: "green" })
            .setLngLat([longitude, latitude])
            .addTo(newMap);

          setMap(newMap);
        }
      },
      (error) => {
        console.error("Geolocation error:", error);

        // Fallback: show a large portion of India if geolocation fails
        if (mapContainerRef.current) {
          const fallbackMap = new maplibregl.Map({
            container: mapContainerRef.current,
            style:
              "https://tiles.basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json",
            center: [78.9629, 20.5937], // near center of India
            zoom: 4,
          });
          fallbackMap.addControl(new NavigationControl());
          setMap(fallbackMap);
        }
      },
    );
  }, [map]);

  // 2) Handle `isDarkMode` style changes
  useEffect(() => {
    if (!map || !userCoordinates) return;

    // Decide style URL
    const styleUrl = isDarkMode
      ? "https://tiles.basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json"
      : "https://tiles.basemaps.cartocdn.com/gl/positron-gl-style/style.json";

    map.setStyle(styleUrl);

    // When style finishes loading, re-add user marker and re-populate markers
    map.on("styledata", async () => {
      new maplibregl.Marker({ color: "green" })
        .setLngLat(userCoordinates)
        .addTo(map);

      await populateMarkers(map, setSelectedStationInfo, isDarkMode);
    });
  }, [isDarkMode, map, userCoordinates, setSelectedStationInfo]);

  // 3) On map load and movement, fetch or update markers
  useEffect(() => {
    if (!map) return;

    map.on("load", async () => {
      await populateMarkers(map, setSelectedStationInfo, isDarkMode);
    });

    map.on("moveend", async () => {
      await populateMarkers(map, setSelectedStationInfo, isDarkMode);
    });
  }, [map, setSelectedStationInfo, isDarkMode]);

  return { mapContainerRef, map, userCoordinates };
}
