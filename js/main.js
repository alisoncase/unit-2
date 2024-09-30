/* Map of GeoJSON data from elderlyDependencyRatioNoNull.geojson, which includes
the ratio of people aged 65 or older per 100 people of working age (20–64 years old)
to illustrate the dependency burden that the working-age population bears in relation to the 
elderly in major European cities between 2008 and 2019 (years with no null values). 
Data source: OECD https://stats.oecd.org */

// Declare map variable globally so all functions have access
var map;
var minValue;

// Function to instantiate the Leaflet map
function createMap(){
    // Create the map
    map = L.map('map', {
        // Center on Europe
        center: [56.1946291535801, 15.245700543391719],
        zoom: 4
    });

    // Add base tilelayer
    L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Light_Gray_Base/MapServer/tile/{z}/{y}/{x}', {
	    maxZoom: 16,
        attribution: 'Tiles &copy; Esri &mdash; Esri, DeLorme, NAVTEQ',
        ext: 'png'
    }).addTo(map);

    // Call getData function
    getData(map);
};

// Function to calcuate minimum value
function calculateMinValue(data){
    // Create empty array to store all data values
    var allValues = [];
    // Loop through each city
    for(var city of data.features){
        // Loop through each year in dataset
        for(var year = 2008; year <= 2019; year+=1){
              // Get population for current year
              var value = city.properties[String(year)];
              // Add value to array
              allValues.push(value);
        }
    }
    // Get minimum value of our array
    var minValue = Math.min(...allValues)
    return minValue;
}

// Calculate the radius of each proportional symbol
function calcPropRadius(attValue) {
    // Constant factor adjusts symbol sizes evenly
    var minRadius = 5;
    // Flannery Apperance Compensation formula
    var radius = 1.0083 * Math.pow(attValue/minValue,0.5715) * minRadius
    return radius;
};

// Function to convert markers to circle markers
function pointToLayer(feature, latlng, attributes){
    // Assign the current attribute based on the first index of the attributes array
    var attribute = attributes[0];
    // Check
    console.log(attribute);

    //Create marker options
    var options = {
        fillColor: "#998ec3",
        color: "#756bb1",
        weight: 1,
        opacity: 1,
        fillOpacity: 0.8
    };

    // For each feature, determine its value for the selected attribute
    var attValue = Number(feature.properties[attribute]);
    // Give each feature's circle marker a radius based on its attribute value
    options.radius = calcPropRadius(attValue);
    // Create circle marker layer
    var layer = L.circleMarker(latlng, options);
    // Build popup content string
    var popupContent = "<p><b>City:</b> " + feature.properties.city + "</p>";
    // Add formatted attribute to popup content string
    var year = attribute;
    popupContent += "<p><b>Elderly dependency ratio in " + year + ":</b> " + feature.properties[attribute] + " percent</p>";
    // Bind the popup to the circle marker
    layer.bindPopup(popupContent, {
        offset: new L.Point(0,-options.radius) 
    });
    //Return the circle marker to the L.geoJson pointToLayer option
    return layer;
};

// Function to add proportional circle markers for point features to the map
function createPropSymbols(data, attributes){
    // Create a Leaflet GeoJSON layer and add it to the map
    L.geoJson(data, {
        pointToLayer: function(feature, latlng){
            return pointToLayer(feature, latlng, attributes);
        }
    }).addTo(map);
};

// Function to resize proportional symbols according to new attribute values by year
function updatePropSymbols(attribute){
    map.eachLayer(function(layer){
        if (layer.feature && layer.feature.properties[attribute]){
            // Access feature properties
            var props = layer.feature.properties;

            // Update each feature's radius based on new attribute values
            var radius = calcPropRadius(props[attribute]);
            layer.setRadius(radius);

            // Add city to popup content string
            var popupContent = "<p><b>City:</b> " + props.city + "</p>";
            // Add formatted attribute to popup content string
            var year = attribute;
            popupContent += "<p><b>Elderly dependency ratio in " + year + ":</b> " + props[attribute] + " percent</p>";

            // Update popup content            
            popup = layer.getPopup();            
            popup.setContent(popupContent).update();
    };
    });
};

// Function to build an attributes array from the data
function processData(data){
    // Empty array to hold attributes
    var attributes = [];

    // Properties of the first feature in the dataset
    var properties = data.features[0].properties;

    // Push each attribute name into attributes array
    for (var attribute in properties){
        // Only take attributes with values
        if (attribute > -1){
            attributes.push(attribute);
        };
    };

    // Check result
    console.log(attributes);

    return attributes;
};

// Function to create new sequence controls
function createSequenceControls(attributes){
    // Create range input element (slider)
    var slider = "<input class='range-slider' type='range'></input>";
    document.querySelector("#panel").insertAdjacentHTML('beforeend',slider);
    // Set slider attributes
    document.querySelector(".range-slider").max = 11;
    document.querySelector(".range-slider").min = 0;
    document.querySelector(".range-slider").value = 0;
    document.querySelector(".range-slider").step = 1;
    document.querySelector('#panel').insertAdjacentHTML('beforeend','<button class="step" id="reverse"></button>');
    document.querySelector('#panel').insertAdjacentHTML('beforeend','<button class="step" id="forward"></button>');
    document.querySelector('#reverse').insertAdjacentHTML('beforeend',"<img src='img/arrow_back.png'>");
    document.querySelector('#forward').insertAdjacentHTML('beforeend',"<img src='img/arrow_forward.png'>");
    // Click listener for buttons
    document.querySelectorAll('.step').forEach(function(step){
        step.addEventListener("click", function(){
            var index = document.querySelector('.range-slider').value;
                        
            // Increment or decrement depending on button clicked
            if (step.id == 'forward'){
                index++;
                // If past the last attribute, wrap around to first attribute
                index = index > 11 ? 0 : index;
            } else if (step.id == 'reverse'){
                index--;
                // If past the first attribute, wrap around to last attribute
                index = index < 0 ? 11 : index;
            };
            console.log(index)
            // Update slider
            document.querySelector('.range-slider').value = index;
            // Pass new attribute to update symbols
            updatePropSymbols(attributes[index]);
        });
        
    // Input listener for slider
    document.querySelector('.range-slider').addEventListener('input', function(){
        // Get the new index value
        var index = this.value;
        console.log(index)
        // Pass new attribute to update symbols
        updatePropSymbols(attributes[index]);
        })
    });
};

// Import GeoJSON data
function getData(){
    // Load the data
    fetch("data/elderlyDependencyRatioNoNull.geojson")
        .then(function(response){
            return response.json();
        })
        .then(function(json){
            // Create an attributes array
            var attributes = processData(json);
            // Calculate minimum data value
            minValue = calculateMinValue(json);
            // Call function to create proportional symbols
            createPropSymbols(json, attributes);
            // Call function for sequence controls
            createSequenceControls(attributes);
        })
};

document.addEventListener('DOMContentLoaded',createMap)