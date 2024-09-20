/* Example from Leaflet GeoJSON Tutorial*/

// Initialize the map and set center to Denver and zoom to continental
var map = L.map('map').setView([39.73993876023148, -104.99588284905734], 4);

// Add tile layer to map
L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 19,
    attribution: '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>'
}).addTo(map);

// Create function to be called for each feature
function onEachFeature(feature, layer) {
    // Checks if the feature has a property named popupContent
    if (feature.properties && feature.properties.popupContent) {
        // If true, binds popupContent to the feature
        layer.bindPopup(feature.properties.popupContent);
    }
}

// Create new GeoJSON point feature
var geojsonFeature = {
    "type": "Feature",
    "properties": {
        "name": "Coors Field",
        "amenity": "Baseball Stadium",
        // Define content for popup window
        "popupContent": "This is where the Rockies play!"
    },
    "geometry": {
        "type": "Point",
        "coordinates": [-104.99404, 39.75621]
    }
};

// Add GeoJSON point feature to map with popup bound via onEachFeature function
L.geoJSON(geojsonFeature, {
    onEachFeature: onEachFeature
}).addTo(map);

// Create GeoJSON line objects
var myLines = [{
    "type": "LineString",
    "coordinates": [[-100, 40], [-105, 45], [-110, 55]]
}, {
    "type": "LineString",
    "coordinates": [[-105, 40], [-110, 45], [-115, 55]]
}];

// Create common style for line objects
var myStyle = {
    "color": "#ff7800",
    "weight": 5,
    "opacity": 0.65
};

// Add styled line objects to map
L.geoJSON(myLines, {
    style: myStyle
}).addTo(map);


// Create individually styled polygon features
var states = [{
    "type": "Feature",
    "properties": {"party": "Republican"},
    "geometry": {
        "type": "Polygon",
        "coordinates": [[
            [-104.05, 48.99],
            [-97.22,  48.98],
            [-96.58,  45.94],
            [-104.03, 45.94],
            [-104.05, 48.99]
        ]]
    }
}, {
    "type": "Feature",
    "properties": {"party": "Democrat"},
    "geometry": {
        "type": "Polygon",
        "coordinates": [[
            [-109.05, 41.00],
            [-102.06, 40.99],
            [-102.03, 36.99],
            [-109.04, 36.99],
            [-109.05, 41.00]
        ]]
    }
}];

// Add polygon objects to map
L.geoJSON(states, {
    style: function(feature) {
        switch (feature.properties.party) {
            case 'Republican': return {color: "#ff0000"};
            case 'Democrat':   return {color: "#0000ff"};
        }
    }
}).addTo(map);


// Create circle marker
var geojsonMarkerOptions = {
    radius: 8,
    fillColor: "#ff7800",
    color: "#000",
    weight: 1,
    opacity: 1,
    fillOpacity: 0.8
};

// Add circle marker to map
L.geoJSON(geojsonFeature, {
    pointToLayer: function (feature, latlng) {
        return L.circleMarker(latlng, geojsonMarkerOptions);
    }
}).addTo(map);