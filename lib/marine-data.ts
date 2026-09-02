export const marineData = {
  location: {
    name: "Visakhapatnam",
    country: "India",
    latitude: 17.6868,
    longitude: 83.2185,
  },

  ocean: {
    sst: 29.4,
    chlorophyll: "High",
    waveHeight: 1.8,
    seaState: "Moderate",
    currentSpeed: 1.2,
    currentDirection: "NE",
  },

  weather: {
    temperature: 31,
    windSpeed: 24,
    windDirection: "NE",
    visibility: 8,
    condition: "Partly Cloudy",
  },

  tides: {
    nextHigh: "14:32",
    nextLow: "21:48",
    highHeight: 1.7,
    lowHeight: 0.4,
  },

  fisheries: [
    {
      id: "PFZ-01",
      name: "North-East Visakhapatnam",
      latitude: 17.82,
      longitude: 83.38,
      distance: 18.6,
      direction: "North East",
      suitability: "High",
      sst: 29.4,
      chlorophyll: "High",
      safety: "Good",
    },
    {
      id: "PFZ-02",
      name: "South-East Visakhapatnam",
      latitude: 17.55,
      longitude: 83.55,
      distance: 24.2,
      direction: "South East",
      suitability: "Moderate",
      sst: 28.9,
      chlorophyll: "Moderate",
      safety: "Good",
    },
    {
      id: "PFZ-03",
      name: "Offshore Visakhapatnam",
      latitude: 17.72,
      longitude: 83.72,
      distance: 31.7,
      direction: "East",
      suitability: "Moderate",
      sst: 29.1,
      chlorophyll: "High",
      safety: "Caution",
    },
  ],

  hazards: [
    {
      id: "HZ-01",
      name: "Elevated Wave Area",
      latitude: 17.72,
      longitude: 83.72,
      severity: "Moderate",
      description: "Elevated wave conditions. Exercise caution.",
    },
  ],

  advisories: [
    {
      id: "ADV-01",
      type: "Fishermen Advisory",
      severity: "Moderate",
      title: "Moderate sea conditions",
      description:
        "Wave height is around 1.8 m with winds reaching 24 km/h.",
    },
  ],

  system: {
    status: "Operational",
    lastUpdated: "18 minutes ago",
    dataSources: 8,
  },
};

export type MarineData = typeof marineData;