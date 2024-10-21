
// Import the required libraries
import { useEffect, useMemo, useState } from "react"
import maplibregl, { GeolocateControl, Map, NavigationControl } from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';



const WORLD_AIR_QUALITY_BASE_API_URL: string = 'https://api.waqi.info/v2/';
const WORLD_AIR_QUALITY_API_TOKEN: string = 'e4e922828e41a73cfe4645c0db52103229422e8a';


type TStation = {
  uid: string
  aqi: string
  lat: number
  lon: number
  station: {
    name: string
  }
}



function stationsToGeoJSON(stations: TStation[]): GeoJSON.FeatureCollection {
  return {
    type: 'FeatureCollection',
    features: stations.map((station: TStation) => ({
      type: 'Feature',
      properties: {
        stationName: station.station.name,
        uid: station.uid,
        aqi: station.aqi
      },
      geometry: {
        type: 'Point',
        coordinates: [station.lon, station.lat]
      }
    })),
  };
}

async function getMarkerAQI(markerUID: string) {
  return (await fetch(
    "https://api.waqi.info/feed/@" + markerUID + "/?token=" + WORLD_AIR_QUALITY_API_TOKEN
  )).json()
}



async function populateMarkers(map: maplibregl.Map, bounds: string, setSelectedStationInfo: (station: TSelectedStation) => void) {
  return fetch(
    `${WORLD_AIR_QUALITY_BASE_API_URL}map/bounds/?latlng=${bounds}&token=${WORLD_AIR_QUALITY_API_TOKEN}`
  )
    .then((data) => data.json())
    .then((stations) => {
      if (stations.status != "ok") throw stations.data;

      const geoJSON = stationsToGeoJSON(stations.data);

      if (map.getSource("stations")) {
        const source = map.getSource("stations") as maplibregl.GeoJSONSource;
        source.setData(geoJSON);
      } else {

        map.addSource("stations", {
          type: "geojson",
          data: geoJSON,
          cluster: true,
          clusterMaxZoom: 14,
          clusterRadius: 50,
        });


        map.addLayer({
          id: "clusters",
          type: "circle",
          source: "stations",
          filter: ["has", "point_count"],
          paint: {
            "circle-color": [
              "step",
              ["get", "point_count"],
              "#51bbd6",
              100,
              "#f1f075",
              750,
              "#f28cb1",
            ],
            "circle-radius": [
              "step",
              ["get", "point_count"],
              20,
              100,
              30,
              750,
              40,
            ],
          },
        });


        map.addLayer({
          id: "cluster-count",
          type: "symbol",
          source: "stations",
          filter: ["has", "point_count"],
          layout: {
            "text-field": "{point_count_abbreviated}",
            "text-size": 12,
          },
        });


        map.addLayer({
          id: "unclustered-point",
          type: "circle",
          source: "stations",
          filter: ["!", ["has", "point_count"]],
          paint: {
            "circle-color": "#11b4da",
            "circle-radius": 10,
            "circle-stroke-width": 1,
            "circle-stroke-color": "#fff",
          },
        });


        map.on("click", "unclustered-point", async (e: any) => {
          const coordinates = e.features[0].geometry.coordinates.slice();
          const { stationName, uid } = e.features[0].properties;

          new maplibregl.Popup()
            .setLngLat(coordinates)
            .setHTML(`<strong style='color:black;'>${stationName}</strong>`)
            .addTo(map);
          // update the state with the data clicked and show on the sidebar.
          const stationInfo = await getMarkerAQI(uid);
          setSelectedStationInfo(stationInfo?.data);
        });


        map.on("click", "clusters", (e) => {
          const features = map.queryRenderedFeatures(e.point, {
            layers: ["clusters"],
          });
          const clusterId = features[0].properties.cluster_id;
          const source = map.getSource("stations") as maplibregl.GeoJSONSource;

          source.getClusterExpansionZoom(clusterId);
        })


        map.on("mouseenter", "clusters", () => {
          map.getCanvas().style.cursor = "pointer";
        });

        map.on("mouseleave", "clusters", () => {
          map.getCanvas().style.cursor = "";
        });
      }
    })
    .catch((error) => {
      console.error("Error fetching station data:", error);
    });
}


const getAirQualitySituation = (aqi: number = 0): { text: string, color: string, message: string } => {
  if (aqi <= 50) {
    return { text: 'Good', color: 'green', message: `An AQI of ${aqi}µg/m³ indicates that the air quality is healthy.` }
  } else if (aqi > 50 && aqi <= 100) {
    return { text: 'Moderate', color: 'orange', message: `An AQI of ${aqi}µg/m³ indicates that the air quality is moderate.` }
  } else {
    return { text: 'Poor', color: 'red', message: `An AQI of ${aqi}µg/m³ indicates that the air quality is unhealthy.` }
  }
}


type TSelectedStation = {
  aqi: number
  city: {
    name: string
    url: string
  },
  dominentpol: string
  time: {
    iso: string
    s: string
  }
  iaqi: {
    pm10?: {
      v: number
    }
    pm25?: {
      v: number
    }
    no2?: {
      v: number
    }
    o3?: {
      v: number
    }
  }
}

// A React Component to write our application code.
function App() {

  const [map, setMap] = useState<Map | null>(null);
  const [selectedStationInfo, setSelectedStationInfo] = useState<null | TSelectedStation>(null);


  // To Load the Map
  useEffect(() => {
    if (map) return;
    // This is used to initialize the map. The library used here is Maplibre GL JS (https://maplibre.org).
    setMap(
      new maplibregl.Map({
        container: 'map',
        style: 'https://basemaps.cartocdn.com/gl/positron-gl-style/style.json', // The url to the style i.e basemap that is displayed.
        center: [20.11, 49.35], // The center of the map.
        zoom: 4 // The zoom level of the map.
      }).addControl(
        new NavigationControl()) // To zoom in and out.
        .addControl(
          new GeolocateControl({
            positionOptions: {
              enableHighAccuracy: true
            },
          })))
    // To Geolocate
  }, [map])

  // To Fetch the air quality data stations within the current map bounds

  useEffect(() => {
    if (!map) return
    // Show it immediately after loading
    map.on('load', () => {
      // Get the bounds of the map as the user pans around
      const bounds = map.getBounds();
      const apiBounds =
        bounds.getNorth() +
        "," +
        bounds.getWest() +
        "," +
        bounds.getSouth() +
        "," +
        bounds.getEast();
      populateMarkers(map, apiBounds, setSelectedStationInfo);
    });

    //Fetch new data when panning
    setTimeout(function () {
      map.on("moveend", () => {
        // Get the bounds of the map as the user pans around
        const bounds = map.getBounds();
        const apiBounds =
          bounds.getNorth() +
          "," +
          bounds.getWest() +
          "," +
          bounds.getSouth() +
          "," +
          bounds.getEast();
        populateMarkers(map, apiBounds, setSelectedStationInfo);
      });
    }, 1000);
  }, [map])

  const renderSidePanel = useMemo(() => {

    const backgroundColors: Record<string, string> = {
      green: 'bg-[#9BD74E]',
      red: 'bg-red-500',
      orange: 'bg-orange-500'
    }
    const { color, text, message } = getAirQualitySituation(selectedStationInfo?.aqi as number);

    return (
      <div className="text-white col-span-2 ">
        <div className={`text-black p-6 flex flex-col gap-y-6 ${backgroundColors[color]}`}>
          <p className="text-base">{selectedStationInfo?.city.name}</p>
          <p className="text-3xl">{text}</p>
          <p className="text-3xl">AQI <span className="font-semibold">{selectedStationInfo?.aqi}</span></p>
          <p className="text-base">{message}</p>
        </div>
        <div className="p-6 ">
          <small>Last updated: {selectedStationInfo?.time.s}</small>
          <p>Main Pollutants</p>
          <ul>
            <li>PM 2.5</li>
            <li>PM 10</li>
            <li>NO2</li>
            <li>Ozone</li>
          </ul>
        </div>
      </div>
    )
  }, [selectedStationInfo])

  return (
    <main className="bg-black text-white">
      <header className="h-20 flex items-center px-6">
        <p>Global Air Quality Monitoring Dashboard</p>
      </header>
      <div className="w-full h-screen grid grid-cols-9 ">
        {/* This is the sidebar where the information about the air quality is presented.*/}
        {renderSidePanel}
        {/* This is the html div element containing the map. */}
        <div id="map" className="col-span-7 w-full h-full" ></div>
      </div>
    </main>
  )
}

// Exporting it, so it can be imported and rendered in the 'main.tsx' file.
export default App
