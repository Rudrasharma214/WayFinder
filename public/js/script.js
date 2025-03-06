const socket = io();
let userLocation = null;

if (navigator.geolocation) {
    navigator.geolocation.watchPosition(
        (position) => {
            const { latitude, longitude } = position.coords;
            userLocation = [latitude, longitude];
            socket.emit("send-location", { latitude, longitude });
        },
        (error) => {
            console.error(error);
        },
        {
            enableHighAccuracy: true,
            timeout: 10000,
            maximumAge: 10000,
        }
    );
}

const map = L.map("map").setView([0, 0], 16);
L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
    attribution: "OpenStreetMap",
}).addTo(map);

const markers = {};
const routingControl = L.Routing.control({
    waypoints: [],
    createMarker: () => null,
}).addTo(map);

socket.on("receive-location", (data) => {
    const { id, latitude, longitude } = data;
    map.setView([latitude, longitude]);
    if (markers[id]) {
        markers[id].setLatLng([latitude, longitude]);
    } else {
        markers[id] = L.marker([latitude, longitude]).addTo(map);
    }
});

socket.on("user-disconnect", (id) => {
    if (markers[id]) {
        map.removeLayer(markers[id]);
        delete markers[id];
    }
});

const searchLocation = async () => {
    if (userLocation) {
        const query = document.querySelector(".search-input").value;
        const response = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${query}`);
        const result = await response.json();
        if (result.length > 0) {
            const dest = [parseFloat(result[0].lat), parseFloat(result[0].lon)];
            routingControl.setWaypoints([L.latLng(userLocation), L.latLng(dest)]);
        }
    }
};

map.on("click", (e) => {
    if (userLocation) {
        routingControl.setWaypoints([L.latLng(userLocation), L.latLng(e.latlng)]);
    }
});
const searchButton = document.querySelector(".search-button");
const searchInput = document.querySelector(".search-input");

searchButton.addEventListener("click", searchLocation);
searchInput.addEventListener("keypress", (e) => {
    if (e.key === "Enter") {
        searchLocation();
    }
});

const relocationbutton = document.querySelector(".relocation")

relocationbutton.addEventListener("click",()=>{
    if(userLocation) {
        map.setView(userLocation,16)
    }
})
