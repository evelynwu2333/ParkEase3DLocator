// Initialize and add the map
let map;
let marker;
let infoWindow;
let map3d;
let markerDup;
let directionsRenderer;
let directionsService;

// The location of Canberra
const position = { lat: -35.2809, lng: 149.1300 };
const ACT_BOUNDS = {
  north: -35.1241,
  south: -35.9213,
  west: 148.7637,
  east: 149.3997
};

async function initMap() {
  
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
  initAutocomplete();
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

async function initAutocomplete() {
  // Request needed libraries.
  //@ts-ignore
  const { AdvancedMarkerElement }  = await Promise.all([
    google.maps.importLibrary("marker"),
    google.maps.importLibrary("places"),
  ]);

  const placeAutocomplete = new google.maps.places.PlaceAutocompleteElement({
    locationRestriction: ACT_BOUNDS,
  });

  //@ts-ignore
  placeAutocomplete.id = "place-autocomplete-input";

  const card = document.getElementById("place-autocomplete-card");

  //@ts-ignore
  card.appendChild(placeAutocomplete);
  map.controls[google.maps.ControlPosition.TOP_LEFT].push(card);
  
  // Create the marker and infowindow
  marker = new google.maps.marker.AdvancedMarkerElement({
    map,
    gmpClickable: true,
  });
  infoWindow = new google.maps.InfoWindow({});

  // Add the gmp-placeselect listener, and display the results on the map.
  //@ts-ignore
  placeAutocomplete.addEventListener("gmp-placeselect", async ({ place }) => {
    await place.fetchFields({
      fields: ["displayName", "formattedAddress", "location"],
    });
    // If the place has a geometry, then present it on a map.
    if (place.viewport) {
      map.fitBounds(place.viewport);
    } else {
      map.setCenter(place.location);
      map.setZoom(17);
    }

    let content =
      '<div id="infowindow-content">' +
      '<span id="place-displayname" class="title">' +
      place.displayName +
      "</span><br />" +
      '<span id="place-address">' +
      place.formattedAddress +
      "</span>" +
      "</div>";

    updateInfoWindow(content, place.location);
    marker.position = place.location;

    calcRoute(position, place.location);
  });
  
  // Add a click listener for marker to show 3d map
  marker.addListener("gmp-click", () => {
    console.log("Show 3D map...");
    show3dMap(marker.position);
  });
}

function calcRoute(start, end) {
  let request = {
    origin: start,
    destination: end,
    travelMode: 'DRIVING'
  };
  directionsService.route(request, function(result, status) {
    if (status == 'OK') {
      directionsRenderer.setDirections(result);
    } else {
      alert("Could not retrieve route: " + status);
    }
  });
}


// show 3D map and camera fly around marker
async function show3dMap(markerPosition) {
  // Dynamically create the 3D map container
  const map3dDiv = document.getElementById("map3d");
  map3dDiv.style.display = "block";

  // Initialize the 3D map
  const { Map3DElement, Marker3DElement } = await google.maps.importLibrary("maps3d");

  // Fly the camera around the marker location
  const camera = {
    center: { lat: markerPosition.lat, lng:markerPosition.lng, altitude: 500 }, // Add altitude for 3D effect
    tilt: 55,
    range: 300,
  };

  // Create the map with a default camera
  map3d = new Map3DElement({
    ...camera,
    defaultLabelsDisabled: true
  });

  // Create the marker
  markerDup = new Marker3DElement({
    position: { lat: markerPosition.lat, lng:markerPosition.lng },
  });
  map3d.append(markerDup);

  map3dDiv.innerHTML = "";
  map3dDiv.appendChild(map3d);
  

  console.log("Flying camera around the marker...");
  map3d.flyCameraAround({
    camera,
    durationMillis: 10000, // Fly for 10 seconds
    rounds: 1, // Complete one full round
  });  

}

initMap();

