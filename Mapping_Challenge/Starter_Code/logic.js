// Create base map layers
let street = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
  attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
});

let satellite = L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
  attribution: 'Tiles &copy; Esri &mdash; Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP, and the GIS User Community'
});

let topo = L.tileLayer('https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png', {
  attribution: 'Map data: &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors, <a href="http://viewfinderpanoramas.org">SRTM</a> | Map style: &copy; <a href="https://opentopomap.org">OpenTopoMap</a> (<a href="https://creativecommons.org/licenses/by-sa/3.0/">CC-BY-SA</a>)'
});

// Create map
let map = L.map("map", {
  center: [37.09, -95.71],
  zoom: 3,
  layers: [street]  // Default layer
});

// Create layer groups
let earthquakes = new L.LayerGroup();
let tectonicPlates = new L.LayerGroup();

// Define base maps
let baseMaps = {
  "Street Map": street,
  "Satellite": satellite,
  "Topographic Map": topo
};

// Define overlay maps
let overlayMaps = {
  "Earthquakes": earthquakes,
  "Tectonic Plates": tectonicPlates
};

// Add layer control
L.control.layers(baseMaps, overlayMaps, {
  collapsed: false
}).addTo(map);

// Get earthquake data
d3.json("https://earthquake.usgs.gov/earthquakes/feed/v1.0/summary/all_week.geojson").then(function(data) {

  function markerSize(magnitude) {
      return magnitude * 4;
  }

  function getColor(depth) {
      return depth > 90 ? "#ea2c2c" :
             depth > 70 ? "#ea822c" :
             depth > 50 ? "#ee9c00" :
             depth > 30 ? "#eecc00" :
             depth > 10 ? "#d4ee00" :
                        "#98ee00";
  }

  // Create GeoJSON layer for earthquakes
  L.geoJson(data, {
      pointToLayer: function(feature, latlng) {
          return L.circleMarker(latlng, {
              radius: markerSize(feature.properties.mag),
              fillColor: getColor(feature.geometry.coordinates[2]),
              color: "#000",
              weight: 1,
              opacity: 1,
              fillOpacity: 0.8
          });
      },
      onEachFeature: function(feature, layer) {
          layer.bindPopup(`
              <h3>Location: ${feature.properties.place}</h3>
              <hr>
              <p>Magnitude: ${feature.properties.mag}</p>
              <p>Depth: ${feature.geometry.coordinates[2]} km</p>
              <p>Time: ${new Date(feature.properties.time).toLocaleString()}</p>
          `);
      }
  }).addTo(earthquakes);

  earthquakes.addTo(map);

  // Create legend
  let legend = L.control({position: "bottomright"});

  legend.onAdd = function() {
      let div = L.DomUtil.create("div", "legend");
      let depths = [-10, 10, 30, 50, 70, 90];
      let colors = ["#98ee00", "#d4ee00", "#eecc00", "#ee9c00", "#ea822c", "#ea2c2c"];

      div.innerHTML += "<h4>Depth (km)</h4>";

      for (let i = 0; i < depths.length; i++) {
          div.innerHTML += 
              '<i style="background: ' + colors[i] + '"></i> ' +
              depths[i] + (depths[i + 1] ? '&ndash;' + depths[i + 1] + '<br>' : '+');
      }
      return div;
  };

  legend.addTo(map);
});

// Add tectonic plates
d3.json("https://raw.githubusercontent.com/fraxen/tectonicplates/master/GeoJSON/PB2002_boundaries.json")
  .then(function(plateData) {
      L.geoJson(plateData, {
          color: "#ff6500",
          weight: 2
      }).addTo(tectonicPlates);

      tectonicPlates.addTo(map);
  });