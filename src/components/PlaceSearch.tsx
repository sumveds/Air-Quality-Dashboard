import React, { useState, useEffect } from "react";
import Select from "react-select";
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

  const fetchSuggestions = async (query: string) => {
    if (!query.trim()) {
      setSuggestions([]);
      return;
    }
    setIsLoading(true);
    try {
      const results = await GeoService.searchPlace(query);
      setSuggestions(results);
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

  const options = suggestions.map((suggestion) => ({
    label: suggestion.place_name,
    value: suggestion.coordinates,
  }));

  return (
    <div className="place-search w-full">
      <Select
        options={options}
        onInputChange={(inputValue) => {
          setSearchQuery(inputValue);
          setFetchEnabled(true);
        }}
        onChange={(selectedOption) => {
          if (selectedOption) {
            const { lat, lon } = selectedOption.value;
            setSearchQuery(selectedOption.label);
            onSearch(lat, lon);
          }
        }}
        placeholder="Search location..."
        isLoading={isLoading}
        isClearable
        classNamePrefix="react-select"
        styles={{
          control: (provided) => ({
            ...provided,
            backgroundColor: isDarkMode ? "#1f2937" : "#ffffff",
            color: isDarkMode ? "#ffffff" : "#000000",
            borderColor: "#ccc",
            width: "100%", // Stretch to parent container
            maxWidth: "100%", // Respect parent's width
          }),
          menu: (provided) => ({
            ...provided,
            backgroundColor: isDarkMode ? "#1f2937" : "#ffffff",
            color: isDarkMode ? "#ffffff" : "#000000",
          }),
          singleValue: (provided) => ({
            ...provided,
            color: isDarkMode ? "#ffffff" : "#000000",
          }),
        }}
        className="w-full" // Tailwind for fallback responsiveness
      />
    </div>
  );
};

export default PlaceSearch;
