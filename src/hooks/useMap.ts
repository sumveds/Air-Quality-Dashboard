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
  const shouldCallApi = useRef(true); // Restrict API calls
  const currentStyleUrl = useRef<string | null>(null); // Track current style URL

  // 1) Create the map once, on mount
  useEffect(() => {
    if (map) return; // Map already created

    // Check if the device has a small screen
    const isSmallDevice = window.innerWidth < 768;
    const initialZoom = isSmallDevice ? 8 : 7; // Zoom in more for small devices

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
            zoom: initialZoom, // Use the dynamic zoom level
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
          currentStyleUrl.current =
            "https://tiles.basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json";
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
            zoom: isSmallDevice ? 6 : 4, // Adjust fallback zoom level
          });
          fallbackMap.addControl(new NavigationControl());
          setMap(fallbackMap);
          currentStyleUrl.current =
            "https://tiles.basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json";
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

    // Only set the style if it is different from the current style
    if (currentStyleUrl.current !== styleUrl) {
      currentStyleUrl.current = styleUrl;
      map.setStyle(styleUrl);

      // When style finishes loading, re-add user marker and re-populate markers
      map.once("styledata", async () => {
        new maplibregl.Marker({ color: "green" })
          .setLngLat(userCoordinates)
          .addTo(map);

        await populateMarkers(map, setSelectedStationInfo, isDarkMode);
      });
    }
  }, [isDarkMode, map, userCoordinates, setSelectedStationInfo]);

  // 3) On map load and movement, fetch or update markers with restricted calls
  useEffect(() => {
    if (!map) return;

    const handleMapBoundsChange = async () => {
      if (shouldCallApi.current) {
        shouldCallApi.current = false; // Prevent additional calls
        setTimeout(() => (shouldCallApi.current = true), 2000); // Reset after 2 seconds
        await populateMarkers(map, setSelectedStationInfo, isDarkMode);
      }
    };

    map.on("load", handleMapBoundsChange);
    map.on("moveend", handleMapBoundsChange);

    return () => {
      map.off("load", handleMapBoundsChange);
      map.off("moveend", handleMapBoundsChange);
    };
  }, [map, setSelectedStationInfo, isDarkMode]);

  return { mapContainerRef, map, userCoordinates };
}
