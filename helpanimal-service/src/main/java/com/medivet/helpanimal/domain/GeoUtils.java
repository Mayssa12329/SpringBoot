package com.medivet.helpanimal.domain;

/** Calculs geographiques (US20, US22, RM02). */
public final class GeoUtils {

    private static final double EARTH_RADIUS_METERS = 6_371_000;
    private static final double METERS_PER_DEGREE_LAT = 111_320;

    private GeoUtils() {
    }

    /** Distance en metres entre deux points GPS (formule de Haversine). */
    public static double distanceMeters(double lat1, double lng1, double lat2, double lng2) {
        double dLat = Math.toRadians(lat2 - lat1);
        double dLng = Math.toRadians(lng2 - lng1);
        double a = Math.sin(dLat / 2) * Math.sin(dLat / 2)
            + Math.cos(Math.toRadians(lat1)) * Math.cos(Math.toRadians(lat2))
            * Math.sin(dLng / 2) * Math.sin(dLng / 2);
        double c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        return EARTH_RADIUS_METERS * c;
    }

    /**
     * Rectangle qui contient le cercle de rayon donne autour d'un point.
     * Sert de pre-filtre en base avant le calcul exact de distance.
     */
    public static BoundingBox boundingBox(double lat, double lng, double radiusMeters) {
        double dLat = radiusMeters / METERS_PER_DEGREE_LAT;
        double cos = Math.cos(Math.toRadians(lat));
        double dLng = cos < 1e-6 ? 180 : radiusMeters / (METERS_PER_DEGREE_LAT * cos);
        return new BoundingBox(lat - dLat, lat + dLat, lng - dLng, lng + dLng);
    }

    public static boolean isValidLatitude(double lat) {
        return lat >= -90 && lat <= 90;
    }

    public static boolean isValidLongitude(double lng) {
        return lng >= -180 && lng <= 180;
    }

    public record BoundingBox(double minLat, double maxLat, double minLng, double maxLng) {

        public boolean contains(double lat, double lng) {
            return lat >= minLat && lat <= maxLat && lng >= minLng && lng <= maxLng;
        }
    }
}
