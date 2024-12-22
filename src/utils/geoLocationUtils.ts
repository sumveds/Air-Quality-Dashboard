export const formatCoordinates = (lat: number, lon: number): string => {
  return `${lat.toFixed(4)}, ${lon.toFixed(4)}`;
};

export const isValidCoordinates = (lat: number, lon: number): boolean => {
  return lat >= -90 && lat <= 90 && lon >= -180 && lon <= 180;
};
