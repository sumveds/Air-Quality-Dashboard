import React, { useState, useEffect } from "react";
import GeoService from "../services/geoService";

type PlaceSearchProps = {
  onSearch: (lat: number, lon: number) => void;
  isDarkMode?: boolean;
};

const PlaceSearch: React.FC<PlaceSearchProps> = ({ onSearch, isDarkMode }) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [suggestions, setSuggestions] = useState<
    {
      text: string;
      place_name: string;
      coordinates: { lat: number; lon: number };
    }[]
  >([]);
  const [isLoading, setIsLoading] = useState(false);
  const [focusedIndex, setFocusedIndex] = useState(-1); // Tracks the currently focused suggestion

  const fetchSuggestions = async (query: string) => {
    if (!query.trim()) {
      setSuggestions([]);
      return;
    }
    setIsLoading(true);
    try {
      const results = await GeoService.searchPlace(query);
      setSuggestions(results);
      setFocusedIndex(-1); // Reset focused index when new suggestions load
    } catch (error) {
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    const debounceTimeout = setTimeout(() => {
      fetchSuggestions(searchQuery);
    }, 300); // Debounce API calls
    return () => clearTimeout(debounceTimeout);
  }, [searchQuery]);

  const handleKeyDown = (event: React.KeyboardEvent) => {
    if (suggestions.length === 0) return;

    if (event.key === "ArrowDown") {
      setFocusedIndex((prev) => (prev + 1) % suggestions.length);
      event.preventDefault(); // Prevent cursor from moving in input
    } else if (event.key === "ArrowUp") {
      setFocusedIndex((prev) =>
        prev === -1
          ? suggestions.length - 1
          : (prev - 1 + suggestions.length) % suggestions.length,
      );
      event.preventDefault();
    } else if (event.key === "Enter" && focusedIndex >= 0) {
      const selectedSuggestion = suggestions[focusedIndex];
      setSearchQuery(selectedSuggestion.text);
      setSuggestions([]);
      onSearch(
        selectedSuggestion.coordinates.lat,
        selectedSuggestion.coordinates.lon,
      );
      event.preventDefault(); // Prevent form submission
    }
  };

  return (
    <div className="relative">
      <input
        type="text"
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
        placeholder="Search location..."
        className={`p-2 border rounded-lg mr-2 ${
          isDarkMode ? "bg-gray-800 text-white" : "bg-white text-black"
        }`}
        onKeyDown={handleKeyDown}
      />
      {isLoading && (
        <div className="absolute top-full mt-2 text-sm">Loading...</div>
      )}
      {suggestions.length > 0 && (
        <ul className="absolute top-full left-0 mt-2 bg-white border rounded-lg shadow-lg w-full z-10">
          {suggestions.map((suggestion, index) => (
            <li
              key={index}
              className={`p-2 cursor-pointer ${
                focusedIndex === index ? "bg-gray-100" : ""
              }`}
              onClick={() => {
                setSearchQuery(suggestion.text);
                setSuggestions([]);
                onSearch(
                  suggestion.coordinates.lat,
                  suggestion.coordinates.lon,
                );
              }}
            >
              {suggestion.place_name}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default PlaceSearch;
