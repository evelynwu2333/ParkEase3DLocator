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


// The location of Canberra
const position = { lat: -35.2809, lng: 149.1300 };
const ACT_BOUNDS = {
  north: -35.1241,
  south: -35.9213,
  west: 148.7637,
  east: 149.3997
};

// Fetch the API key from the backend
async function loadGoogleMaps() {
  try {
      const response = await fetch('/api-key');
      const data = await response.json();
      const apiKey = data.apiKey;

      // Dynamically load Google Maps API
      const script = document.createElement('script');
      script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&v=alpha&callback=initMap&loading=async`;
      script.async = true;
      script.defer = true;
      document.head.appendChild(script);

      window.initMap = async ()=> {
  
        // The map, centered at Canberra
        const { Map } = await google.maps.importLibrary("maps")
      
        map = new google.maps.Map(document.getElementById("map"), {
          zoom: 10,
          center: position,
          restriction: {
            latLngBounds: ACT_BOUNDS,
            strictBounds: false,
          },
          mapId: "basemap",
        });
      
        // search places for direction and display routes
        directionsService = new google.maps.DirectionsService();
        directionsRenderer = new google.maps.DirectionsRenderer();
        directionsRenderer.setMap(map);
        directionsRenderer.setPanel(
          document.getElementById("sidebar")
        );
        // search place and locate on map
        initAutocomplete()
      
        
      
      }
  } catch (error) {
      console.error('Error fetching API key:', error);
  }
}




// Helper function to create an info window.
function updateInfoWindow(content, center) {
  infoWindow.setContent(content);
  infoWindow.setPosition(center);
  infoWindow.open({
    map,
    anchor: marker,
    shouldFocus: true,
  });  
}

// Function to initialise simple place search - not optimized for real-world search
async function initAutocomplete() {

  const { AdvancedMarkerElement }  = await Promise.all([
    google.maps.importLibrary("marker"),
    google.maps.importLibrary("places"),
  ]);

  const placeAutocomplete = new google.maps.places.PlaceAutocompleteElement({
    locationRestriction: ACT_BOUNDS,
    // types: ['parking', 'park_and_ride']
  });

  placeAutocomplete.id = "place-autocomplete-input";

  const card = document.getElementById("place-autocomplete-card");

  card.appendChild(placeAutocomplete);
  map.controls[google.maps.ControlPosition.TOP_LEFT].push(card);
  
  // Create the marker and infowindow
  let collisionBehavior = google.maps.CollisionBehavior.REQUIRED_AND_HIDES_OPTIONAL;

  marker = new google.maps.marker.AdvancedMarkerElement({
    map,
    gmpClickable: true,
    collisionBehavior: collisionBehavior,
    zIndex: 2,
  });
  infoWindow = new google.maps.InfoWindow({});

  // Add the gmp-placeselect listener, and display the results on the map.
  placeAutocomplete.addEventListener("gmp-placeselect", async ({ place }) => {
    await place.fetchFields({
      // fields: ["displayName", "formattedAddress", "location"],
      fields: ['location']
    });
    // If the place has a geometry, then present it on a map.
    if (place.viewport) {
      map.fitBounds(place.viewport);
    } else {
      map.setCenter(place.location);
      map.setZoom(17);
    }

    // let content =
    //   '<div id="infowindow-content">' +
    //   '<span id="place-displayname" class="title">' +
    //   place.displayName +
    //   "</span><br />" +
    //   '<span id="place-address">' +
    //   place.formattedAddress +
    //   "</span>" +
    //   "</div>";

    // updateInfoWindow(content, place.location);
    // Calculate route to car park
    calcRoute(position, place.location);

    marker.position = place.location;
    marker.addListener("gmp-click", () => {
      console.log("Show 3D map...");
      show3dMap(routeCoordinates, marker.position);
      
    });
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


// Function to show 3D map and camera fly around marker
async function show3dMap(routeCoordinates, markerPosition) {
  // Dynamically create the 3D map container
  const map3dDiv = document.getElementById("map3d");
  map3dDiv.style.display = "block";

  // Initialize the 3D map
  const { Map3DElement, Polyline3DElement, AltitudeMode, Marker3DElement } = await google.maps.importLibrary("maps3d");

  // get coordinates of the last segment of the route
  const lastSegment = [
    routeCoordinates[routeCoordinates.length - 2],
    routeCoordinates[routeCoordinates.length - 1],
  ];

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
  map3d.addEventListener("gmp-click", stopCamera)

  // Add a click listener for marker to show 3d map
  const addMarkerButton = document.getElementById("addMarker");
  const closeButton = document.getElementById("close3d");
  const floatButtons = document.getElementById("floatButtons");
  floatButtons.style.display = "flex";

  addMarkerButton.addEventListener("click", addRemovableMarker);
  closeButton.addEventListener('click', close3dMap);
}

// Function to stop camera animation
async function stopCamera() {
  map3d.stopCameraAnimation();
  console.log("Stopping camera...");
}

// Function to add a removable marker
async function addRemovableMarker() {
  console.log("Add a new entrance...");
  let markers = [];
  // remove stop camera event listener
  map3d.removeEventListener('gmp-click', stopCamera);
  console.log("Stop camera event listner removed");

  const { Marker3DInteractiveElement } = await google.maps.importLibrary("maps3d");
  map3d.addEventListener('gmp-click', (e) => {
    if (markers.length > 0) {
      console.log(markers);
      const interactiveMarker = document.querySelector('gmp-marker-3d-interactive');
      console.log(interactiveMarker);
      interactiveMarker.remove();
      markers = [];
      addedMarker = new Marker3DInteractiveElement({
        position: {lat: e.position.lat, lng: e.position.lng, altitude: 100},
        label: "New entrance",
        zIndex: 10,
      })
      map3d.append(addedMarker);
      markers.push(addedMarker);
      console.log(markers);
      return;
    }
    console.log({lat: e.position.lat, lng: e.position.lng, altitude: 100});
    addedMarker = new Marker3DInteractiveElement({
      position: {lat: e.position.lat, lng: e.position.lng, altitude: 100},
      label: "New entrance",
      zIndex: 10,
    })
    map3d.append(addedMarker);
    markers.push(addedMarker);
    console.log(markers);
  });
  
}

// Function to close 3D map
async function close3dMap() {
  const map3dDiv = document.getElementById("map3d");
  map3dDiv.style.display = "none";
  const floatButtons = document.getElementById("floatButtons");
  floatButtons.style.display = "none";
}

loadGoogleMaps();

