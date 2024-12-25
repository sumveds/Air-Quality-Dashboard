import React, { useState, useEffect } from "react";
import GeoService from "../services/geoService";

type PlaceSearchProps = {
  onSearch: (lat: number, lon: number) => void;
  isDarkMode?: boolean;
};

const PlaceSearch: React.FC<PlaceSearchProps> = ({ onSearch, isDarkMode }) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [fetchEnabled, setFetchEnabled] = useState(true);
  const [suggestions, setSuggestions] = useState<
    {
      text: string;
      place_name: string;
      coordinates: { lat: number; lon: number };
    }[]
  >([]);
  const [isLoading, setIsLoading] = useState(false);
  const [focusedIndex, setFocusedIndex] = useState(-1);

  const fetchSuggestions = async (query: string) => {
    if (!query.trim()) {
      setSuggestions([]);
      return;
    }
    setIsLoading(true);
    try {
      const results = await GeoService.searchPlace(query);
      setSuggestions(results);
      setFocusedIndex(-1);
    } catch (error) {
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (fetchEnabled) {
      const debounceTimeout = setTimeout(() => {
        fetchSuggestions(searchQuery);
      }, 300);
      return () => clearTimeout(debounceTimeout);
    }
  }, [searchQuery, fetchEnabled]);

  const handleKeyDown = (event: React.KeyboardEvent) => {
    if (suggestions.length === 0) return;

    if (event.key === "ArrowDown") {
      setFocusedIndex((prev) => (prev + 1) % suggestions.length);
      event.preventDefault();
    } else if (event.key === "ArrowUp") {
      setFocusedIndex((prev) => {
        return prev === -1
          ? suggestions.length - 1
          : (prev - 1 + suggestions.length) % suggestions.length;
      });
      event.preventDefault();
    } else if (event.key === "Enter" && focusedIndex >= 0) {
      event.preventDefault();
      const selectedSuggestion = suggestions[focusedIndex];
      setSearchQuery(selectedSuggestion.place_name);
      setSuggestions([]);
      setFetchEnabled(false);

      onSearch(
        selectedSuggestion.coordinates.lat,
        selectedSuggestion.coordinates.lon,
      );
    }
  };

  return (
    <div className="relative flex items-center">
      <input
        type="text"
        value={searchQuery}
        onChange={(e) => {
          setSearchQuery(e.target.value);
          setFetchEnabled(true);
        }}
        placeholder="Search location..."
        className={`inputField ${isDarkMode ? "bg-gray-800 text-white" : "bg-white text-black"}`}
        onKeyDown={handleKeyDown}
      />
      {searchQuery && (
        <button
          onClick={() => setSearchQuery("")}
          className="absolute right-2 p-1 bg-transparent hover:text-gray-500"
          aria-label="Clear search"
        >
          ✕
        </button>
      )}
      {isLoading && (
        <div className="absolute top-full mt-2 text-sm">Loading...</div>
      )}
      {suggestions.length > 0 && (
        <ul className="absolute top-full left-0 mt-2 bg-white border rounded-lg shadow-lg w-full z-10">
          {suggestions.map((suggestion, index) => (
            <li
              key={index}
              className={`p-2 cursor-pointer ${focusedIndex === index ? "bg-gray-100" : ""}`}
              onMouseEnter={() => setFocusedIndex(index)}
              onClick={() => {
                setSearchQuery(suggestion.place_name);
                setSuggestions([]);
                setFetchEnabled(false);
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
