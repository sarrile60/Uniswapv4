import React, { useEffect, useState, useRef } from 'react';
import { useLocation } from 'react-router-dom';

/**
 * PageTransition — Wraps route content with a smooth fade/slide animation.
 * Uses CSS keyframes only, no external deps.
 */

const styles = {
  container: {
    animation: 'pageEnter 0.35s cubic-bezier(0.4, 0, 0.2, 1) forwards',
    willChange: 'opacity, transform',
  },
};

// Inject keyframes once
if (typeof document !== 'undefined' && !document.getElementById('page-transition-keyframes')) {
  const styleSheet = document.createElement('style');
  styleSheet.id = 'page-transition-keyframes';
  styleSheet.textContent = `
    @keyframes pageEnter {
      0% {
        opacity: 0;
        transform: translateY(12px);
      }
      100% {
        opacity: 1;
        transform: translateY(0);
      }
    }
    @keyframes pageFadeIn {
      0% { opacity: 0; }
      100% { opacity: 1; }
    }
  `;
  document.head.appendChild(styleSheet);
}

const PageTransition = ({ children }) => {
  const location = useLocation();
  const [displayKey, setDisplayKey] = useState(location.key || location.pathname);
  const containerRef = useRef(null);

  useEffect(() => {
    setDisplayKey(location.key || location.pathname);
    // Restart animation by removing and re-adding the animation property
    if (containerRef.current) {
      containerRef.current.style.animation = 'none';
      // Trigger reflow
      void containerRef.current.offsetHeight;
      containerRef.current.style.animation = 'pageEnter 0.35s cubic-bezier(0.4, 0, 0.2, 1) forwards';
    }
  }, [location.pathname]);

  return (
    <div ref={containerRef} style={styles.container} key={displayKey}>
      {children}
    </div>
  );
};

export default PageTransition;
