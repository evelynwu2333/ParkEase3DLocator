// Initialize and add the map
let map;
let marker;
let infoWindow;
let map3d;
let markerDup

async function initMap() {
  // The location of Uluru
  const position = { lat: -35.2809, lng: 149.1300 };
  // Request needed libraries.
  //@ts-ignore
  const [ { Map },{ AdvancedMarkerElement } ] = await Promise.all([
    google.maps.importLibrary("marker"),
    google.maps.importLibrary("places"),
  ]);

//   const { AdvancedMarkerElement } = await google.maps.importLibrary("marker");

  // The map, centered at Uluru
  map = new google.maps.Map(document.getElementById("map"), {
    zoom: 10,
    center: position,
    mapId: "basemap",
  });

  //@ts-ignore
  const placeAutocomplete = new google.maps.places.PlaceAutocompleteElement({
    locationBias: {radius: 20000, center: {lat: -35.2809, lng: 149.1300}},
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
  });
  // Add a click listener for each marker, and set up the info window.
  marker.addListener("gmp-click", () => {
    console.log("Show 3D map...");
    show3dMap(marker.position);
  });
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


async function show3dMap(markerPosition) {

  // Initialize the 3D map
  const { Map3DElement, Marker3DElement } = await google.maps.importLibrary("maps3d");


  // Fly the camera around the marker location
  const camera = {
    center: { lat: markerPosition.lat, lng:markerPosition.lng, altitude: 100 }, // Add altitude for 3D effect
    tilt: 55,
    range: 200,
  };

    
  // Create the map with a default camera
  map3d = new Map3DElement({
    ...camera,
    defaultLabelsDisabled: true,
  });

  // Create the marker
  markerDup = new Marker3DElement({
    position: { lat: markerPosition.lat, lng:markerPosition.lng},
  });
  map3d.append(markerDup);
  document.body.append(map3d);

  console.log("Flying camera around the marker...");

  map3d.flyCameraAround({
      camera,
      durationMillis: 20000, // Fly for 10 seconds
      rounds: 1, // Complete one full round
  });
}

initMap();

