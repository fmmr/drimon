/**
 * Planet Positions Module
 * 
 * Provides simplified position calculations for visible planets.
 * Based on low-precision orbital elements suitable for visualization.
 */

window.PlanetPositions = (function() {
    // Orbital elements for planets (simplified)
    // These are approximations valid for general visualization purposes
    // Based on mean orbital elements for epoch J2000
    const PLANETS = {
        mercury: {
            name: 'mercury',
            period: 87.969,  // Orbital period in days
            semiMajorAxis: 0.387098,  // AU
            eccentricity: 0.205630,
            inclination: 7.00487, // degrees
            longitude: 48.331, // degrees
            perihelion: 77.45645, // degrees
            meanAnomaly: 252.25084 // degrees at epoch J2000
        },
        venus: {
            name: 'venus',
            period: 224.701,
            semiMajorAxis: 0.723332,
            eccentricity: 0.006773,
            inclination: 3.39471,
            longitude: 76.680,
            perihelion: 131.53298,
            meanAnomaly: 181.97973
        },
        mars: {
            name: 'mars',
            period: 686.980,
            semiMajorAxis: 1.523679,
            eccentricity: 0.093401,
            inclination: 1.85061,
            longitude: 49.558,
            perihelion: 336.04084,
            meanAnomaly: 355.45332
        },
        jupiter: {
            name: 'jupiter',
            period: 4332.589,
            semiMajorAxis: 5.20260,
            eccentricity: 0.048498,
            inclination: 1.30530,
            longitude: 100.464,
            perihelion: 14.75385,
            meanAnomaly: 34.40438
        },
        saturn: {
            name: 'saturn',
            period: 10759.22,
            semiMajorAxis: 9.55491,
            eccentricity: 0.055546,
            inclination: 2.48446,
            longitude: 113.665,
            perihelion: 92.43194,
            meanAnomaly: 49.94432
        }
    };

    // Convert degrees to radians
    function degreesToRadians(degrees) {
        return degrees * Math.PI / 180;
    }

    // Convert radians to degrees
    function radiansToDegrees(radians) {
        return radians * 180 / Math.PI;
    }

    /**
     * Calculate the approximate position of planets
     * This is a simplified model that provides general directions
     * Returns azimuth and altitude for each visible planet
     */
    function calculatePlanetPositions(date, observer) {
        const result = {};
        const j2000 = new Date('2000-01-01T12:00:00Z');
        
        // Days since J2000 epoch
        const daysSinceJ2000 = (date - j2000) / (1000 * 60 * 60 * 24);
        
        // Earth's position (simplified)
        const earthMeanAnomaly = (356.0470 + 0.9856002585 * daysSinceJ2000) % 360;
        const earthLongitude = (earthMeanAnomaly + 102.9373) % 360;
        
        // Calculate position for each planet
        Object.values(PLANETS).forEach(planet => {
            // Calculate mean anomaly for the planet
            const meanMotion = 360 / planet.period; // degrees per day
            const meanAnomaly = (planet.meanAnomaly + meanMotion * daysSinceJ2000) % 360;
            
            // Calculate eccentric anomaly (approximation)
            // E = M + e*sin(M) for small eccentricities
            const M = degreesToRadians(meanAnomaly);
            const eccentricAnomaly = M + planet.eccentricity * Math.sin(M);
            
            // Calculate true anomaly
            const trueAnomaly = 2 * Math.atan(Math.sqrt((1 + planet.eccentricity) / (1 - planet.eccentricity)) * Math.tan(eccentricAnomaly / 2));
            
            // Calculate heliocentric longitude
            const helioLong = radiansToDegrees(trueAnomaly) + planet.perihelion;
            
            // Distance from sun (in AU)
            const radius = planet.semiMajorAxis * (1 - planet.eccentricity * Math.cos(eccentricAnomaly));
            
            // Convert to geocentric coordinates (highly simplified)
            // This is a rough approximation for visualization purposes
            const earthLongRad = degreesToRadians(earthLongitude);
            const helioLongRad = degreesToRadians(helioLong);
            
            // For outer planets
            let geocentricX, geocentricY;
            if (planet.semiMajorAxis > 1) { // outer planet
                geocentricX = radius * Math.cos(helioLongRad) - Math.cos(earthLongRad);
                geocentricY = radius * Math.sin(helioLongRad) - Math.sin(earthLongRad);
            } else { // inner planet
                geocentricX = Math.cos(earthLongRad) - radius * Math.cos(helioLongRad);
                geocentricY = Math.sin(earthLongRad) - radius * Math.sin(helioLongRad);
            }
            
            // Simplified conversion to horizontal coordinates
            // This does not account for the observer's exact location or time
            // It's a rough approximation
            
            // LST - Local Sidereal Time (simplified)
            const utcHours = date.getUTCHours() + date.getUTCMinutes() / 60;
            const lst = (100.46 + 0.985647 * daysSinceJ2000 + observer.lng + 15 * utcHours) % 360;
            
            // Simple approximation of equatorial coordinates
            const ra = (radiansToDegrees(Math.atan2(geocentricY, geocentricX)) + 360) % 360;
            const dec = radiansToDegrees(Math.atan2(geocentricX * geocentricY, Math.sqrt(geocentricX * geocentricX + geocentricY * geocentricY)));
            
            // Hour angle
            const ha = (lst - ra + 360) % 360;
            
            // Convert to horizontal coordinates
            const latRad = degreesToRadians(observer.lat);
            const decRad = degreesToRadians(dec);
            const haRad = degreesToRadians(ha);
            
            // Calculate altitude and azimuth
            const sinAlt = Math.sin(latRad) * Math.sin(decRad) + Math.cos(latRad) * Math.cos(decRad) * Math.cos(haRad);
            const altitude = Math.asin(sinAlt);
            
            const cosAz = (Math.sin(decRad) - Math.sin(latRad) * Math.sin(altitude)) / (Math.cos(latRad) * Math.cos(altitude));
            const azimuth = Math.acos(Math.max(-1, Math.min(1, cosAz)));
            
            // Correct azimuth for hemisphere
            const adjustedAzimuth = Math.sin(haRad) >= 0 ? 2 * Math.PI - azimuth : azimuth;
            
            // Store result
            result[planet.name] = {
                azimuth: adjustedAzimuth,
                altitude: altitude,
                // Consider visible if altitude is positive (above horizon)
                visible: altitude > 0
            };
        });
        
        return result;
    }
    
    /**
     * Format planet positions into human-readable format
     * @param {Object} positions - Planet positions from calculatePlanetPositions
     * @param {Function} formatFn - Function to format individual positions
     * @returns {Object} Formatted positions for all visible planets
     */
    function formatPlanetPositions(positions, formatFn) {
        const result = {};
        
        Object.entries(positions).forEach(([planet, position]) => {
            if (position.visible) {
                result[planet] = formatFn(position);
            }
        });
        
        return result;
    }

    // Return public API
    return {
        calculatePlanetPositions,
        formatPlanetPositions,
        PLANETS
    };
})();