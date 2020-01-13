// Store our API endpoint inside queryUrl
var queryUrl = "https://earthquake.usgs.gov/earthquakes/feed/v1.0/summary/2.5_day.geojson";

//create an empty array that will hold arrays of the lat, lng, and intensity for each earthquake 
var heatpoints = []


// Perform a GET request to the query URL
d3.json(queryUrl, function (data) {
  // Once we get a response, send the data.features object to the createFeatures function
  createFeatures(data.features);
});



function createFeatures(earthquakeData) {

  // Define a function we want to run once for each feature in the features array
  // Give each feature a popup describing the place and time of the earthquake


  //this will be used for the heatmap and to populate the popups
  function onEachFeature(feature, layer) {
    layer.bindPopup("<h3>" + feature.properties.place + "<br>" + "Magnitude: " + feature.properties.mag
      + "</h3><hr><p>" + new Date(feature.properties.time) + "</p>");
    //console.log("Adding earthquake of intensity : ");
    var mag = parseFloat(feature.properties.mag);
    var mag_intensity = mag / 8;
    var heatpoint = [parseFloat(feature.geometry.coordinates[1]),
    parseFloat(feature.geometry.coordinates[0]),
      mag_intensity];
    heatpoints.push(heatpoint);


  }

  var geojsonMarkerOptions = {
    radius: 6,
    fillColor: "#ff7800",
    color: "#000",
    weight: 1,
    opacity: 1,
    fillOpacity: 0.8
  };

  function selectColor(feature) {
    console.log("Magnitude of " + feature.properties.mag);
    var mag_val = feature.properties.mag;
    //earthquakes magnitude 6 and more
    if (mag_val >= 6) {
      return "#d7191c";
    }
    //earthquakes from 5.0 to 5.9999
    else if (mag_val < 6 && mag_val >= 5) {
      return "#fdae61";
    }
    //earthquakes from 4.0 to 4.9999
    else if (mag_val < 5 && mag_val >= 4) {
      return "#ffffbf";
    }
    //earthquakes from 3.0 to 3.9999
    else if (mag_val < 4 && mag_val >= 3) {
      return "#a6d96a";
    }
    //earthquakes 2.9999 or less
    else {
      return "white";
    }


  }

  // Create a GeoJSON layer containing the features array on the earthquakeData object
  // Running L.geoJSON automatically retrieves coordinates and places them on a map
  // Run the onEachFeature function once for each piece of data in the array
  var earthquakes = L.geoJSON(earthquakeData,
    {
      onEachFeature: onEachFeature,

      pointToLayer: function (feature, latlng) {
        return L.circleMarker(latlng,
          {
            radius: 8,
            fillColor: selectColor(feature),
            color: selectColor(feature),
            weight: 1,
            opacity: 1,
            fillOpacity: 0.8

          });
      }
    });





  console.log("heat points: ....");
  //console.log(heat_points);


  // Sending our earthquakes layer to the createMap function
  createMap(earthquakes);
}

function createMap(earthquakes, geoJson2heat) {

  // Define streetmap and darkmap layers
  var streetmap = L.tileLayer("https://api.tiles.mapbox.com/v4/{id}/{z}/{x}/{y}.png?access_token={accessToken}", {
    attribution: "Map data &copy; <a href=\"https://www.openstreetmap.org/\">OpenStreetMap</a> contributors, <a href=\"https://creativecommons.org/licenses/by-sa/2.0/\">CC-BY-SA</a>, Imagery © <a href=\"https://www.mapbox.com/\">Mapbox</a>",
    maxZoom: 18,
    id: "mapbox.streets",
    accessToken: API_KEY
  });

  var darkmap = L.tileLayer("https://api.tiles.mapbox.com/v4/{id}/{z}/{x}/{y}.png?access_token={accessToken}", {
    attribution: "Map data &copy; <a href=\"https://www.openstreetmap.org/\">OpenStreetMap</a> contributors, <a href=\"https://creativecommons.org/licenses/by-sa/2.0/\">CC-BY-SA</a>, Imagery © <a href=\"https://www.mapbox.com/\">Mapbox</a>",
    maxZoom: 18,
    id: "mapbox.dark",
    accessToken: "pk.eyJ1IjoiY25qYW5zc2VuIiwiYSI6ImNrNGZ2dHRiMzBxeWIzZXBlMnh0aHJpamUifQ.0XR1ZDx_hZgwUktSFufCRQ"
  });

  // Define a baseMaps object to hold our base layers
  var baseMaps = {
    "Street Map": streetmap,
    "Dark Map": darkmap
  };

  // create heatmap layer
  //console.log(heatpoints);
  var heat = L.heatLayer(heatpoints, {
    radius: 25,
    blur: 0,
    max: 1.0,
    minOpacity: 0.5,
    gradient: { 0.1: 'grey', 0.5: 'blue', 1.0: 'purple' }
  });

  // Create overlay object to hold our overlay layer
  var overlayMaps =
  {
    Earthquakes: earthquakes,
    Heatmap: heat
  };




  // Create our map, giving it the streetmap and earthquakes layers to display on load
  var myMap = L.map("map", {
    center: [
      37.09, -95.71
    ],
    zoom: 4,
    layers: [streetmap, earthquakes, heat]
  });

  // Set up the legend
  var legend = L.control({ position: 'bottomright' });


  // get Color for legend
  function getColor(d) {
    //earthquakes magnitude 6 and more
    return d >= 6 ? '#d7191c' :
    //earthquakes from 5.0 to 5.9999
           d >= 5 && d<6  ? '#fdae61' :
    //earthquakes from 4.0 to 4.9999
           d >=4 && d<5  ? '#ffffbf' :
    //earthquakes from 3.0 to 3.9999
            d >=3 && d<4  ? '#a6d96a' :
                      'white';
}

  legend.onAdd = function (map) {

    var div = L.DomUtil.create('div', 'info legend'),
      magnitudes = [1, 2, 3, 4,5],
      labels = [];
      div.innerHTML = "<h3> Quake Magnitude Legend</h3> <br>"

    // loop through our magnitude intervals and generate a label with a colored square for each interval
    for (var i = 0; i < magnitudes.length; i++) {
      div.innerHTML +=
        '<i style="background:' + getColor(magnitudes[i] + 1) + '"></i> ' +
        magnitudes[i] + (magnitudes[i + 1] ? '&ndash;' + magnitudes[i + 1] + '<br>' : '+');
        console.log(magnitudes[i]);
    }

    return div;
  };


  // Adding legend to the map
  legend.addTo(myMap);

  // Create a layer control
  // Pass in our baseMaps and overlayMaps
  // Add the layer control to the map
  L.control.layers(baseMaps, overlayMaps, {
    collapsed: false
  }).addTo(myMap);

  


}
