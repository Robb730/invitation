import { MapContainer, TileLayer, Marker, useMapEvents} from "react-leaflet";
import "leaflet/dist/leaflet.css";
import { useState, useEffect } from "react";
import L from "leaflet";
import markerIcon from "./images/marker_olive.png";

const customIcon = new L.Icon({
  iconUrl: markerIcon,
  iconSize: [30, 30],
  iconAnchor: [15, 30],
  popupAnchor: [0, -30],
});

const LocationPicker = ({ lat, lng, setLat, setLng, setSelectedAddress }) => {
  const [position, setPosition] = useState(null);

  const map = useMapEvents({
    click: async (e) => {
      const { lat, lng } = e.latlng;
      setPosition(e.latlng);
      setLat(lat);
      setLng(lng);

      try {
        const res = await fetch(
          `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json`
        );
        const data = await res.json();
        setSelectedAddress(data.display_name || "Unknown location");
      } catch (err) {
        console.error("Reverse geocoding failed:", err);
      }
    },
  });

  // 🧠 Update marker when search updates lat/lng
  useEffect(() => {
    if (lat && lng) {
      setPosition({ lat, lng });
      map.setView([lat, lng], 13);
    }
  }, [lat, lng, map]);

  return position ? <Marker position={position} icon={customIcon} /> : null;
};



const MapSection = ({ lat, lng, setLat, setLng, setSelectedAddress }) => {
  const defaultCenter = [lat || 14.5995, lng || 120.9842];

  return (
    <div style={{ position: "relative" }}>
      <MapContainer
        center={defaultCenter}
        zoom={13}
        style={{ height: "300px", width: "100%", borderRadius: "10px" }}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        
        <LocationPicker
          lat={lat}
          lng={lng}
          setLat={setLat}
          setLng={setLng}
          setSelectedAddress={setSelectedAddress}
        />
      </MapContainer>
    </div>
  );
};

export default MapSection;
