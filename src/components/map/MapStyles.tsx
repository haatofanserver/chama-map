import { useEffect } from 'react';

const MapStyles = () => {
  useEffect(() => {
    // Create and inject styles dynamically
    const style = document.createElement('style');
    style.textContent = `
      .leaflet-pane.leaflet-overlay-pane path {
        transition: fill-opacity 0.5s ease;
      }
    `;
    document.head.appendChild(style);

    // Cleanup function to remove styles when component unmounts
    return () => {
      document.head.removeChild(style);
    };
  }, []);

  return null; // This component doesn't render anything visible
};

export default MapStyles;
