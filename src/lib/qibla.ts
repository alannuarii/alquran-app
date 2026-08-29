export const KAABA_LAT = 21.422487;
export const KAABA_LONG = 39.826206;

function toRadians(degrees: number): number {
  return degrees * (Math.PI / 180);
}

function toDegrees(radians: number): number {
  return radians * (180 / Math.PI);
}

/**
 * Calculates the Qibla bearing from true north for a given coordinate.
 * @param userLat User's latitude in degrees
 * @param userLong User's longitude in degrees
 * @returns Qibla direction in degrees (0-360)
 */
export function calculateQiblaDirection(userLat: number, userLong: number): number {
  const phiK = toRadians(KAABA_LAT);
  const lambdaK = toRadians(KAABA_LONG);
  const phi = toRadians(userLat);
  const lambda = toRadians(userLong);

  const deltaLambda = lambdaK - lambda;

  const y = Math.sin(deltaLambda);
  const x = Math.cos(phi) * Math.tan(phiK) - Math.sin(phi) * Math.cos(deltaLambda);

  let qiblaHeading = toDegrees(Math.atan2(y, x));
  
  // Normalize to 0-360
  qiblaHeading = (qiblaHeading + 360) % 360;

  return qiblaHeading;
}

/**
 * Calculates the shortest rotation distance between two angles.
 * Prevents the compass from spinning 360 degrees when moving from 359 to 1.
 * @param currentAngle 
 * @param targetAngle 
 */
export function getShortestRotation(currentAngle: number, targetAngle: number): number {
    let diff = (targetAngle - currentAngle) % 360;
    if (diff < -180) {
        diff += 360;
    } else if (diff > 180) {
        diff -= 360;
    }
    return currentAngle + diff;
}

/**
 * Calculates the great-circle distance between two points using the Haversine formula.
 * @returns Distance in kilometers
 */
export function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const R = 6371; // Earth radius in km
    const dLat = toRadians(lat2 - lat1);
    const dLon = toRadians(lon2 - lon1);
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
              Math.cos(toRadians(lat1)) * Math.cos(toRadians(lat2)) *
              Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
}
