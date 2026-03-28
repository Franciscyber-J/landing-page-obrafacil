import React, { useEffect, useRef, useState } from 'react';
import GlobeComponent from 'react-globe.gl';

export default function Globe() {
    const globeRef = useRef();
    const [arcsData, setArcsData] = useState([]);
    const [windowDimensions, setWindowDimensions] = useState({
        width: typeof window !== 'undefined' ? window.innerWidth : 800,
        height: typeof window !== 'undefined' ? window.innerHeight : 800,
    });

    useEffect(() => {
        function handleResize() {
            setWindowDimensions({
                width: window.innerWidth,
                height: window.innerHeight,
            });
        }
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    useEffect(() => {
        // Generate some random routes connecting some fixed locations
        const N = 20;
        const arcs = [...Array(N).keys()].map(() => ({
            startLat: (Math.random() - 0.5) * 160,
            startLng: (Math.random() - 0.5) * 360,
            endLat: (Math.random() - 0.5) * 160,
            endLng: (Math.random() - 0.5) * 360,
            color: ['#1affb2', '#00ffcc'] // Much brighter and varied neon
        }));
        setArcsData(arcs);

        if (globeRef.current) {
            globeRef.current.controls().autoRotate = true;
            globeRef.current.controls().autoRotateSpeed = 0.1; // Extremely slow rotation
            globeRef.current.controls().enableZoom = false;
        }
    }, []);

    return (
        <div style={{
            position: 'fixed',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            zIndex: -1,
            opacity: 0.5,
            pointerEvents: 'none'
        }}>
            <GlobeComponent
                ref={globeRef}
                height={Math.min(windowDimensions.height * 1.2, 1200)}
                width={Math.min(windowDimensions.width, 1200)}
                backgroundColor="rgba(0,0,0,0)" // Transparent background
                globeImageUrl="//unpkg.com/three-globe/example/img/earth-dark.jpg"
                arcsData={arcsData}
                arcColor="color"
                arcDashLength={0.4}
                arcDashGap={0.2}
                arcStroke={0.6} // Thicker lines
                arcDashAnimateTime={6000} // Very slow arc animation
                arcsTransitionDuration={10000} // Extra slow entrance animation
            />
        </div>
    );
}
