import { useState, useEffect } from 'react';

/**
 * Hook to detect if the current device is a mobile device
 * Returns true for phones and tablets
 */
export function useIsMobile() {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    // Function to check if device is mobile
    const checkIsMobile = () => {
      const userAgent = navigator.userAgent.toLowerCase();
      const mobileRegex = /android|webos|iphone|ipad|ipod|blackberry|iemobile|opera mini|mobile|tablet/i;
      
      // Check viewport width as a secondary indicator
      const viewportIsMobile = window.innerWidth <= 768;
      
      // If either the user agent or viewport indicates mobile, set to true
      setIsMobile(mobileRegex.test(userAgent) || viewportIsMobile);
    };

    // Check on mount
    checkIsMobile();

    // Add resize listener to update on orientation changes or window resizing
    window.addEventListener('resize', checkIsMobile);

    // Cleanup listener on unmount
    return () => {
      window.removeEventListener('resize', checkIsMobile);
    };
  }, []);

  return isMobile;
}