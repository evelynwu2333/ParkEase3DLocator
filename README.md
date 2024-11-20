
# ParkEase 3D Locator

**ParkEase 3D Locator** is a web application designed to enhance car park navigation by leveraging Google Photorealistic 3D Maps. The application allows users to search locations, visualize routes in real-time, and **interact with 3D maps to explore car park surroundings, confirm the car park entrance, and update the destination and route in real-time**. This user feedback on parking entrance location data can improve navigation systems and enrich Google Maps APIs.

---

## Features

- **Photorealistic 3D Maps**: Visualize the route and surroundings in a dynamic 3D map environment.
- **User Interaction**: Update entrance markers on the 3D map, dynamically recalculating routes.
- **Responsive Design**: User-friendly interface with easily accessible features like marker placement and map navigation.

---

## Technologies Used

- **Backend**: Node.js and Express.js for serving the application and securing the API key.
- **Frontend**: HTML5, CSS3, and JavaScript (ES6+).
- **Google APIs**:
  - Google Maps JavaScript API
  - Google Places API
  - Google Directions API
  - Google Maps JavaScript API 3D Maps Library
- **CSS Styling**: Custom styling for a clean, responsive user experience.

---

## Setup Instructions

1. **Clone the Repository**:
   ```bash
   git clone <[repository-url](https://github.com/evelynwu2333/ParkEase3DLocator.git)>
   cd ParkEase3DLocator
   ```

2. **Install Dependencies**:
   Run the following command to install the required dependencies:
   ```bash
   npm install
   ```

3. **Obtain a Google Maps API Key**:
   - Go to [Google Cloud Console](https://console.cloud.google.com/).
   - Enable the required APIs (Maps JavaScript, Places, Directions, and 3D Library).
   - Generate an API key.

4. **Configure the API Key**:
   - Open the `server.js` file.
   - Replace the placeholder for the API key with your actual Google Maps API key.

5. **Run the Application**:
   Start the server using:
   ```bash
   node server.js
   ```
   Access the app at `http://localhost:3000`.

---

## Project Structure

```
ParkEase3DLocator/
├── public/                # Frontend files
│   ├── index.html         # Main HTML file
│   ├── index.js           # Core JavaScript logic
│   ├── style.css          # Custom styles for UI
├── node_modules/          # Node.js dependencies
├── package.json           # Project metadata and dependencies
├── server.js              # Node.js server logic
├── README.md              # Project documentation
```

---

## How to Use

1. **Launch the Application**:
   Open the app in your browser at `http://localhost:3000`.

2. **Search for a Place**:
   Use the search bar to find a destination within the Canberra region. Please note that this is not optimized for the best search experience and we assume that the user will search a car park. 

3. **View Routes**:
   The map displays a driving route from the default starting location to your selected destination. Please note that this app uses the coordinates of Canberra centre as a dummy start location for routing. 

4. **Switch to 3D View**:
   Click the marker to access the Photorealistic 3D Map. Interact with a 3D visualization of the route and the destination (e.g. a car park). Click anywhere on the 3D map to stop the camera animation if feeling motion-sick. 

5. **Add New Entrance**:
   Click "Add New Entrance" to initialize the process, then click on the map to propose a new car park entrance. Close the 3D map once happy with the new location.
   
7. **Submit Feedback**:
   The map uses the new entrance location to update the driving route. The new entrance location is logged for further improvement of navigation data.

---

## Future Enhancements

- Store user feedback in a database for analysis and integration into navigation systems.
- Support for multi-modal routes (walking, biking, etc.).
- Real-time collaboration for multiple users.
- Localization for international use.
- Search and routing (although not the primary goal of this demo web app).

---

## License

This project is licensed under [MIT License](LICENSE).

---

**ParkEase 3D Locator** – Making navigation smarter with user-driven data!
