// Initialize and add the map
let map;
let marker;
let infoWindow;
let map3d;
let markerDup;
let directionsRenderer;
let directionsService;
let routeCoordinates;
let addedMarker = null;
let markerClickListener;

// The location of Canberra
const startPosition = { lat: -35.2809, lng: 149.1300 };
const ACT_BOUNDS = {
  north: -35.1241,
  south: -35.9213,
  west: 148.7637,
  east: 149.3997
};

// main
async function loadMaps() {
  // Fetch the API key from the backend
  try {
      const response = await fetch('/api-key');
      const data = await response.json();
      const apiKey = data.apiKey;

      // Load Google Maps API
      const script = document.createElement('script');
      script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&v=alpha&callback=initMap&loading=async`;
      script.async = true;
      script.defer = true;
      document.head.appendChild(script);

      window.initMap = async ()=> {
  
        // Set up Canberra map
        const { Map } = await google.maps.importLibrary("maps")
      
        map = new google.maps.Map(document.getElementById("map"), {
          zoom: 10,
          center: startPosition,
          restriction: {
            latLngBounds: ACT_BOUNDS,
            strictBounds: false,
          },
          mapId: "basemap",
        });
      
        // direction service and renderer
        directionsService = new google.maps.DirectionsService();
        directionsRenderer = new google.maps.DirectionsRenderer();
        directionsRenderer.setMap(map);
        directionsRenderer.setPanel(
          document.getElementById("sidebar")
        );

        // search place and route update
        initAutocomplete()

      }
  } catch (error) {
      console.error('Error fetching API key:', error);
  }
}

// Function to initialise simple place search - not optimized for real-world search
async function initAutocomplete() {

  const { AdvancedMarkerElement, PinElement }  = await Promise.all([
    google.maps.importLibrary("marker"),
    google.maps.importLibrary("places"),
  ]);

  const placeAutocomplete = new google.maps.places.PlaceAutocompleteElement({
    locationRestriction: ACT_BOUNDS,
  });

  placeAutocomplete.id = "place-autocomplete-input";

  const card = document.getElementById("place-autocomplete-card");

  card.appendChild(placeAutocomplete);
  map.controls[google.maps.ControlPosition.TOP_LEFT].push(card);
  
  // Create the marker and infowindow
  let collisionBehavior = google.maps.CollisionBehavior.REQUIRED_AND_HIDES_OPTIONAL;
  const pinElement = new google.maps.marker.PinElement({
    background: "#AB4AEF",
    borderColor: "#E9E8F1",
  });
  marker = new google.maps.marker.AdvancedMarkerElement({
    map,
    gmpClickable: true,
    collisionBehavior: collisionBehavior,
    content: pinElement.element, 
    zIndex: 2,
  });
  infoWindow = new google.maps.InfoWindow({});

  // Add the gmp-placeselect listener, and display the results on the map.
  placeAutocomplete.addEventListener("gmp-placeselect", async ({ place }) => {
    // Step 1: Select place and adjust map view
    await selectPlace(place);

    // Step 2: Display marker and calculate route
    displayMarkerAndRoute(place);

    // Step 3: Add event listener to marker for 3D map
    addMarkerClickListener(marker);
  });
}

// Select Place and Update Map View
async function selectPlace(place) {
  await place.fetchFields({
    fields: ["displayName", "formattedAddress", "location"],
  });

  // If the place has a geometry, adjust the map view
  if (place.viewport) {
    map.fitBounds(place.viewport);
  } else {
    map.setCenter(place.location);
    map.setZoom(17);
  }
}

// Display Marker and Calculate Route
function displayMarkerAndRoute(place) {
  const content =
    '<div id="infowindow-content">' +
    '<span id="place-displayname" class="title">' +
    place.displayName +
    "</span><br />" +
    '<span id="place-address">' +
    place.formattedAddress +
    "</span>" +
    "</div>";

  updateInfoWindow(content, place.location); // Update the info window
  calcRoute(startPosition, place.location); // Calculate route from start position to selected location

  // Update marker position
  marker.position = place.location;
} 

// Add Marker Event Listener
function addMarkerClickListener(marker) {
  if (markerClickListener) {
    google.maps.event.removeListener(markerClickListener);
  }

  markerClickListener = marker.addListener(
    "gmp-click",
    async () => {
      console.log("Show 3D map...");
      await show3dMap(routeCoordinates, marker.position);
    },
    { once: true } // Add the listener only once
  );
}


// Helper function to create an info window.
function updateInfoWindow(content, center) {
  infoWindow.setContent(content);
  infoWindow.setPosition(center);
  infoWindow.open({
    map,
    anchor: marker,
    shouldFocus: false,
  });  
}

// Function to calculate route
async function calcRoute(start, end) {
  let request = {
    origin: start,
    destination: end,
    travelMode: 'DRIVING',
    region: 'au',
  };

  directionsService.route(request, async function(result, status) {
    if (status == 'OK') {
      directionsRenderer.setDirections(result);
      directionsRenderer.setMap(map);
      directionsRenderer.setOptions({suppressMarkers: true});
      // extract route coordinates
      routeCoordinates = result.routes[0].overview_path.map(point => ({
        lat: point.lat(),
        lng: point.lng(),
      }));
    } else {
      alert("Could not retrieve route: " + status);
    }
  });
}


// Function to show 3D map and user add new entrance on 3D map
async function show3dMap(routeCoordinates, markerPosition) {
  
  // Dynamically create the 3D map container
  const map3dDiv = document.getElementById("map3d");
  map3dDiv.style.display = "block";

  // Initialize the 3D map
  const { AdvancedMarkerElement, Map3DElement, Polyline3DElement, AltitudeMode, Marker3DElement } = await google.maps.importLibrary("maps3d");

  // Initial camera setting
  const initialCamera = {
    center: { ...routeCoordinates[0], altitude: 500 }, // Add altitude for 3D effect
    tilt: 55,
    range: 300,
  };

  // Create the map with a default camera
  map3d = new Map3DElement({
    ...initialCamera,
    defaultLabelsDisabled: true
  });

  // Add 3D map to div
  map3dDiv.innerHTML = "";
  map3dDiv.appendChild(map3d);
  alert("If feeling uncomfortable with 3D motion, please click anywhere on the screen to stop the animation.");

  const routeCoordinatesWithAltitude = routeCoordinates.map(coord => ({
    lat: coord.lat,
    lng: coord.lng,
    altitude: 600, // Set a fixed altitude
  }));

  const routeCoordinatesPolyline = routeCoordinates.map(coord => ({
    lat: coord.lat,
    lng: coord.lng,
    // altitude: 600, // Set a fixed altitude
  }));

  // Create a 3D polyline for the route
  const routePolyLine = new Polyline3DElement({
    coordinates: routeCoordinatesPolyline,
    altitudeMode: "CLAMP_TO_GROUND",
    strokeColor: 'rgba(25, 102, 210, 0.75)',
    strokeWidth: 10,
    zIndex: 6,
  });

  // Add the segment line to the 3D map
  map3d.append(routePolyLine);

  // Create the marker
  markerDup = new Marker3DElement({
    position: { lat: markerPosition.lat, lng:markerPosition.lng, altitude: 100 },
    zIndex: 4,
  });
  map3d.append(markerDup);
  
  // Fly camera to the destination
  console.log("Flying camera to the destination...");
  for (const coord of routeCoordinatesWithAltitude) {
    map3d.flyCameraTo({
      endCamera: {
        center: coord,
        tilt: 35,
        range: 500,
      },
      durationMillis: 15000,
    })
  }

  // Stop camera animation
  map3d.addEventListener("gmp-click", () => {
    stopCamera();
  }, { once: true });
  
  // show close button and add marker button
  const addMarkerButton = document.getElementById("addMarker");
  const closeButton = document.getElementById("close3d");
  const floatButtons = document.getElementById("floatButtons");
  floatButtons.style.display = "flex";

  // user to click "Add new entrance" button then click on map to add a new marker
  let mks;
  addMarkerButton.removeEventListener('click', addRemovableMarker);
  addMarkerButton.addEventListener("click", async () => {
    mks = await addRemovableMarker();
  }, { once: true });
  // console.log(mks);

  // close the 3D map to update the route to the new entrance
  closeButton.addEventListener('click', async () => {
    await close3dMap(mks);
    mks = [];
  }, { once: true });
}

// Function to stop camera animation
async function stopCamera() {
  await map3d.stopCameraAnimation();
  console.log("Stopping camera...");
}

// Function to add a removable marker
async function addRemovableMarker() {
  console.log("Add a new entrance...");
  let markers = [];
  // remove stop camera event listener from 3D map
  map3d.removeEventListener('gmp-click', stopCamera);

  // add marker event listener to 3D map
  map3d.removeEventListener('gmp-click', clickMap);
  map3d.addEventListener('gmp-click', async (e) => {
    await clickMap(e, markers); 
    // get the new entrance position
    console.log(`New marker added: ${addedMarker.position.lat}, ${addedMarker.position.lng}`);
  });
  return markers;

}

// Function to manage 3D marker addition and remove
async function clickMap(e, markers) {
  const { Marker3DInteractiveElement } = await google.maps.importLibrary("maps3d");
  // console.log(markers.length);
  if (markers.length > 0) {
    // remove old marker and add new marker at clicked position
    const interactiveMarker = document.querySelector('gmp-marker-3d-interactive');
    interactiveMarker.remove();
    addedMarker = new Marker3DInteractiveElement({
      position: {lat: e.position.lat, lng: e.position.lng, altitude: 100},
      label: "New entrance",
      zIndex: 10,
    })
    map3d.append(addedMarker);
    markers = [];
    // console.log("removed marker: ", markers);
    console.log(markers.length);
    markers.push(addedMarker);
    // console.log("added new marker: ", markers);
  } else {
    // add new marker
    addedMarker = new Marker3DInteractiveElement({
      position: {lat: e.position.lat, lng: e.position.lng, altitude: 100},
      label: "New entrance",
      zIndex: 10,
    })
    map3d.append(addedMarker);
    markers.push(addedMarker);
    // console.log("new marker added: ", markers);
  }
}

// Actions after close 3D map
async function close3dMap(mks) {
  // remove 3D map and buttons
  const map3dDiv = document.getElementById("map3d");
  map3dDiv.innerHTML = null;
  map3dDiv.style.display = "none";
  const floatButtons = document.getElementById("floatButtons");
  floatButtons.style.display = "none";
  // console.log(mks);
  if (!mks) { 
    console.log('No markers added');
    return; 
  } else if (mks.length > 0) {
    // update marker and recalculate route
    updateRoute();
  }
}

// Function to update route and marker after close 3D map
async function updateRoute() {
  const { AdvancedMarkerElement }  = await Promise.all([
    google.maps.importLibrary("marker"),
    google.maps.importLibrary("places"),
  ]);

  marker.remove();
  // console.log(addedMarker);
  marker = new google.maps.marker.AdvancedMarkerElement({
    map,
    position: {lat: addedMarker.position.lat, lng: addedMarker.position.lng},
    gmpClickable: true,
    title: 'New entrance',
    zIndex: 2,
  });
  // Recalculate route with new entrace position
  calcRoute(startPosition, {lat: addedMarker.position.lat, lng: addedMarker.position.lng});
  console.log("Route is updated");
}

loadMaps();
