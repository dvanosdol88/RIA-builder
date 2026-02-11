import React, { useEffect, useRef, useState } from 'react';
import { Loader } from '@googlemaps/js-api-loader';
import { Loader2 } from 'lucide-react';

const GOOGLE_MAPS_API_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY || '';

// Data extracted from heatmap_interactive.html
const DATA = {
  avoid: {
    color: "#D62728",
    opacity: 0.6,
    points: [
      { name: "Greenwich",    lat: 41.026, lng: -73.628, size: 160 },
      { name: "Darien",       lat: 41.048, lng: -73.473, size: 46.6 },
      { name: "New Canaan",   lat: 41.146, lng: -73.494, size: 46.6 }
    ]
  },
  target: {
    color: "#2CA02C",
    opacity: 0.6,
    points: [
      { name: "Yorktown",     lat: 41.272, lng: -73.784, size: 68.6 },
      { name: "Cortlandt",    lat: 41.288, lng: -73.918, size: 56.6 },
      { name: "Mahopac",      lat: 41.372, lng: -73.737, size: 43.3 },
      { name: "Somers",       lat: 41.325, lng: -73.692, size: 52.0 },
      { name: "Croton",       lat: 41.209, lng: -73.886, size: 20.6 },
      { name: "Trumbull",     lat: 41.258, lng: -73.2,   size: 79.3 },
      { name: "Monroe",       lat: 41.332, lng: -73.21,  size: 41.3 },
      { name: "Madison",      lat: 41.278, lng: -72.597, size: 45.3 },
      { name: "Guilford",     lat: 41.288, lng: -72.681, size: 59.3 },
      { name: "Old Saybrook", lat: 41.291, lng: -72.376, size: 30.0 }
    ]
  }
};

const MapsView: React.FC = () => {
  const mapRef = useRef<HTMLDivElement>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loader = new Loader({
      apiKey: GOOGLE_MAPS_API_KEY,
      version: 'weekly',
    });

    loader.load().then((google) => {
      if (mapRef.current) {
        const map = new google.maps.Map(mapRef.current, {
          center: { lat: 41.2, lng: -73.2 }, // Centered roughly between the points
          zoom: 10,
          mapId: 'RIA_HEATMAP',
          disableDefaultUI: false,
          zoomControl: true,
          streetViewControl: false,
          mapTypeControl: false,
        });

        // Helper to draw a set of points
        const drawLayer = (group: typeof DATA['avoid']) => {
          group.points.forEach(point => {
            // Draw Circle
            new google.maps.Circle({
              strokeColor: "black",
              strokeOpacity: 0.8,
              strokeWeight: 1,
              fillColor: group.color,
              fillOpacity: group.opacity,
              map,
              center: { lat: point.lat, lng: point.lng },
              radius: point.size * 20, // Scale multiplier to make pixels visible on map meters
            });

            // Draw Label
            new google.maps.Marker({
              position: { lat: point.lat, lng: point.lng },
              map,
              icon: {
                path: google.maps.SymbolPath.CIRCLE,
                scale: 0, // Hidden marker, just for label
              },
              label: {
                text: point.name,
                color: "black",
                fontSize: "12px",
                fontWeight: "bold",
                className: "map-label" // We can style this in CSS if needed
              }
            });
          });
        };

        drawLayer(DATA.avoid);
        drawLayer(DATA.target);

        setLoading(false);
      }
    }).catch(e => {
      console.error('Error loading Google Maps:', e);
      setLoading(false);
    });
  }, []);

  return (
    <div className="w-full h-full relative bg-gray-50">
      {loading && (
        <div className="absolute inset-0 z-10 bg-white/80 flex items-center justify-center backdrop-blur-sm">
          <div className="flex flex-col items-center gap-2">
            <Loader2 className="animate-spin text-indigo-600" size={48} />
            <p className="text-gray-600 font-medium">Loading Heatmap...</p>
          </div>
        </div>
      )}
      <div ref={mapRef} className="w-full h-full" />
      
      {/* Legend Overlay */}
      <div className="absolute top-4 right-4 bg-white p-4 rounded-lg shadow-lg border border-gray-200 z-10 max-w-xs">
        <h3 className="font-bold text-gray-900 mb-2">Legend</h3>
        <div className="flex items-center gap-2 mb-1">
          <div className="w-4 h-4 rounded-full bg-[#D62728] opacity-60 border border-black"></div>
          <span className="text-sm text-gray-700">Avoid (Status Seekers)</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded-full bg-[#2CA02C] opacity-60 border border-black"></div>
          <span className="text-sm text-gray-700">Target (Efficiency/Savings)</span>
        </div>
      </div>
    </div>
  );
};

export default MapsView;