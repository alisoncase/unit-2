/* Map of GeoJSON data from elderlyDependencyRatioNoNull.geojson, which includes
the ratio of people aged 65 or older per 100 people of working age (20–64 years old)
to illustrate the dependency burden that the working-age population bears in relation to the 
elderly in major European cities between 2008 and 2019 (years with no null values). 
Data source: OECD https://stats.oecd.org */

// Declare map variable globally so all functions have access
var map;
var dataStats = {};

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
function calcStats(data){
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
    //get min, max, mean stats for our array
    dataStats.min = Math.min(...allValues);
    dataStats.max = Math.max(...allValues);
    //calculate meanValue
    var sum = allValues.reduce(function(a, b){return a+b;});
    dataStats.mean = sum/allValues.length;
};

// Calculate the radius of each proportional symbol
function calcPropRadius(attValue) {
    // Constant factor adjusts symbol sizes evenly
    var minRadius = 5;
    // Flannery Apperance Compensation formula
    var radius = 1.0083 * Math.pow(attValue/dataStats.min,0.5715) * minRadius
    return radius;
};

// Function to define content for popups
function createPopupContent(properties, attribute){
    //add city to popup content string
    var popupContent = "<p><b>City:</b> " + properties.city + "</p>";

    //add formatted attribute to panel content string
    var year = attribute;
    popupContent += "<p><b>Elderly dependency ratio in " + year + ":</b> " + properties[attribute] + " percent</p>";

    return popupContent;
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
        color: "#252525",
        weight: 1,
        opacity: 1,
        fillOpacity: 0.8
    };

    // For each feature, determine its value for the selected attribute
    var attValue = Number(feature.properties[attribute]);
    // Give each feature's circle marker a radius based on its attribute value
    options.radius = calcPropRadius(attValue, dataStats.min);
    // Create circle marker layer
    var layer = L.circleMarker(latlng, options);
    // Define popup content
    var popupContent = createPopupContent(feature.properties, attribute);
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
    var year = attribute
    //update temporal legend
    document.querySelector("span.year").innerHTML = year;
    map.eachLayer(function(layer){
        if (layer.feature && layer.feature.properties[attribute]){
            // Access feature properties
            var props = layer.feature.properties;
            // Update each feature's radius based on new attribute values
            var radius = calcPropRadius(props[attribute]);
            layer.setRadius(radius);
            // Define popup content
            var popupContent = createPopupContent(props, attribute); 
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

//Create new sequence controls
function createSequenceControls(attributes){   
    var SequenceControl = L.Control.extend({
        options: {
            position: 'bottomleft'
        },

        onAdd: function () {
            // create the control container div with a particular class name
            var container = L.DomUtil.create('div', 'sequence-control-container');

            //create range input element (slider)
            container.insertAdjacentHTML('beforeend', '<input class="range-slider" type="range" min="0" max="11" step="1" value="0">');

            //add skip buttons
            container.insertAdjacentHTML('beforeend', '<button class="step" id="reverse" title="Reverse"><img src="img/arrow_back.png"></button>'); 
            container.insertAdjacentHTML('beforeend', '<button class="step" id="forward" title="Forward"><img src="img/arrow_forward.png"></button>');
            
            //disable any mouse event listeners for the container
            L.DomEvent.disableClickPropagation(container);
            return container;
        }
    });

map.addControl(new SequenceControl());    

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


function createLegend(attributes){
    var LegendControl = L.Control.extend({
        options: {
            position: 'bottomright'
        },

        onAdd: function () {
            // create the control container with a particular class name
            var container = L.DomUtil.create('div', 'legend-control-container');

            container.innerHTML = '<p class="temporalLegend">Elderly dependency ratio in <span class="year">2008</span></p>';

            //Step 1: start attribute legend svg string
            var svg = '<svg id="attribute-legend" >';

            //array of circle names to base loop on
            var circles = ["max", "mean", "min"];
    
            //Step 2: loop to add each circle and text to svg string
            for (var i=0; i<circles.length; i++){
                // Assign the r and cy attributes  
                var radius = calcPropRadius(dataStats[circles[i]]);  
                var cy = 50 - radius;
                
                //circle string
                svg += '<circle class="legend-circle" id="' + circles[i] + '" r="' + radius + '"cy="' + cy +
                '" fill="#756bb1" fill-opacity="0.8" stroke="#252525" cx="65"/>';
            
                //evenly space out labels            
                 var textY = i * 20 + 20;            

                //text string            
                svg += '<text id="' + circles[i] + '-text" x="95" y="' + textY + '">' + Math.round(dataStats[circles[i]]*100)/100 + " percent" + '</text>';
                    
            };
    
            //close svg string
            svg += "</svg>";
   
            //add attribute legend svg to container
            container.insertAdjacentHTML('beforeend',svg);

            return container;
        }
    });

    map.addControl(new LegendControl());
};


function addColorPicker(){
    // Create color picker container
    var colorPickerContainer = L.DomUtil.create('div', 'color-picker-container');
    colorPickerContainer.innerHTML = '<label for="colorPicker">Change Color:</label><input type="color" id="colorPicker" value="#998ec3">';
    // Add container to designated element
    document.getElementById("color-picker-container").appendChild(colorPickerContainer);
    };

// Add event listener to color picker
document.getElementById("colorPicker").addEventListener("change", function(event) {
    var newColor = event.target.value;
  
    // Update symbols
    map.eachLayer(function(layer) {
      if (layer instanceof L.CircleMarker) {
        layer.setStyle({ fillColor: newColor });
      }
    });
  
    // Update legend (adjust selectors as needed)
    document.getElementById("attribute-legend").querySelectorAll(".legend-circle").forEach(function(circle) {
      circle.style.fill = newColor;
    });
  });
  

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

            //Call function to calculate stats
            calcStats(json);
            // Call function to create proportional symbols
            createPropSymbols(json, attributes);
            // Call function for sequence controls
            createSequenceControls(attributes);
            // Call function for legend
            createLegend(attributes);
            addColorPicker();
          })
          .catch(function(error) {
            console.error("Error fetching data:", error);
        })
};


document.addEventListener('DOMContentLoaded',createMap)