export const categorizeAQI = (
  aqi: number,
): { category: string; message: string } => {
  if (aqi <= 50) {
    return {
      category: "Good",
      message: `An AQI of ${aqi}µg/m³ indicates that the air quality is healthy.`,
    };
  } else if (aqi > 50 && aqi <= 100) {
    return {
      category: "Moderate",
      message: `An AQI of ${aqi}µg/m³ indicates that the air quality is moderate.`,
    };
  } else {
    return {
      category: "Poor",
      message: `An AQI of ${aqi}µg/m³ indicates that the air quality is unhealthy.`,
    };
  }
};

/*export const categorizeAQI = (aqi: number): { category: string; message: string } => {
  if (aqi <= 50) {
    return {
      category: "Good",
      message: "Air quality is considered satisfactory, and air pollution poses little or no risk.",
    };
  }
  if (aqi <= 100) {
    return {
      category: "Moderate",
      message: "Air quality is acceptable; however, some pollutants may affect sensitive groups.",
    };
  }
  if (aqi <= 150) {
    return {
      category: "Unhealthy for Sensitive Groups",
      message: "Members of sensitive groups may experience health effects. The general public is less likely to be affected.",
    };
  }
  if (aqi <= 200) {
    return {
      category: "Unhealthy",
      message: "Everyone may begin to experience health effects; members of sensitive groups may experience more serious effects.",
    };
  }
  if (aqi <= 300) {
    return {
      category: "Very Unhealthy",
      message: "Health alert: everyone may experience more serious health effects.",
    };
  }
  return {
    category: "Hazardous",
    message: "Health warning of emergency conditions: the entire population is more likely to be affected.",
  };
};*/
