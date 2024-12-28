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
  setIsLoading: (loading: boolean) => void; // Add setIsLoading here
}

export function useMap({
  isDarkMode,
  setSelectedStationInfo,
  setIsLoading,
}: UseMapOptions) {
  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const [map, setMap] = useState<MapLibreMap | null>(null);
  const [userCoordinates, setUserCoordinates] = useState<
    [number, number] | null
  >(null);
  const shouldCallApi = useRef(true); // Restrict API calls
  const currentStyleUrl = useRef<string | null>(null); // Track current style URL
  const currentMarkerRef = useRef<maplibregl.Marker | null>(null); // Track the current marker
  const latestLocation = useRef<[number, number] | null>(null); // Track the latest marker's location

  // Handle dark mode style changes
  useEffect(() => {
    if (map) {
      const styleUrl = isDarkMode
        ? "https://tiles.basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json"
        : "https://tiles.basemaps.cartocdn.com/gl/positron-gl-style/style.json";

      if (currentStyleUrl.current !== styleUrl) {
        currentStyleUrl.current = styleUrl;
        map.setStyle(styleUrl);

        // Re-add markers when style changes
        map.once("styledata", async () => {
          if (currentMarkerRef.current) {
            currentMarkerRef.current.remove();
          }
          if (latestLocation.current) {
            currentMarkerRef.current = new maplibregl.Marker({ color: "green" })
              .setLngLat(latestLocation.current)
              .addTo(map);
          }

          await populateMarkers(
            map,
            setSelectedStationInfo,
            isDarkMode,
            setIsLoading,
          );
        });
      }
    }
  }, [isDarkMode, map, setSelectedStationInfo, setIsLoading]);

  // Initialize the map on mount
  useEffect(() => {
    if (map) return;

    const isSmallDevice = window.innerWidth < 768;
    const initialZoom = isSmallDevice ? 9 : 7;

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        setUserCoordinates([longitude, latitude]);

        if (mapContainerRef.current) {
          const newMap = new maplibregl.Map({
            container: mapContainerRef.current,
            style:
              "https://tiles.basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json",
            center: [longitude, latitude],
            zoom: initialZoom,
          });

          newMap.addControl(new NavigationControl());
          newMap.addControl(
            new GeolocateControl({
              positionOptions: { enableHighAccuracy: true },
              trackUserLocation: true,
            }),
          );

          const initialMarker = new maplibregl.Marker({ color: "green" })
            .setLngLat([longitude, latitude])
            .addTo(newMap);

          setMap(newMap);
          currentMarkerRef.current = initialMarker;
          latestLocation.current = [longitude, latitude];
          currentStyleUrl.current =
            "https://tiles.basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json";
        }
      },
      (error) => {
        console.error("Geolocation error:", error);

        if (mapContainerRef.current) {
          const fallbackMap = new maplibregl.Map({
            container: mapContainerRef.current,
            style:
              "https://tiles.basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json",
            center: [78.9629, 20.5937], // Center of India
            zoom: isSmallDevice ? 6 : 4,
          });
          fallbackMap.addControl(new NavigationControl());
          setMap(fallbackMap);
          currentStyleUrl.current =
            "https://tiles.basemaps.cartocdn.com/gl/dark-matter-gl-style.json";
        }
      },
    );
  }, [map]);

  // Handle markers on map load and movement
  useEffect(() => {
    if (!map) return;

    const handleMapBoundsChange = async () => {
      if (shouldCallApi.current) {
        shouldCallApi.current = false; // Prevent additional calls
        setTimeout(() => (shouldCallApi.current = true), 2000); // Reset after 2 seconds
        await populateMarkers(
          map,
          setSelectedStationInfo,
          isDarkMode,
          setIsLoading,
        );
      }
    };

    map.on("load", handleMapBoundsChange);
    map.on("moveend", handleMapBoundsChange);

    return () => {
      map.off("load", handleMapBoundsChange);
      map.off("moveend", handleMapBoundsChange);
    };
  }, [map, setSelectedStationInfo, isDarkMode, setIsLoading]);

  return {
    mapContainerRef,
    map,
    userCoordinates,
    currentMarkerRef,
    latestLocation,
  };
}
