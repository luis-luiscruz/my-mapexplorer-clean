// Highway Exits API Service for Portuguese highways
// Using different base URLs for development and production  
const BASE_URL = window.location.hostname === 'localhost' ? 'http://localhost:3015/api' : '/api';

// Type definitions for highway exits
export interface HighwayExit {
  id?: number;
  highway: string;
  exit_number: string;
  exit_name: string;
  latitude: number;
  longitude: number;
  km_marker?: number;
  direction?: string;
  distance_km?: number; // Added by queries with distance calculation
}

export interface HighwayExitsResponse {
  exits: HighwayExit[];
  count: number;
}

export interface NextExitsResponse {
  next_exits: HighwayExit[];
}

export interface CurrentHighwayResponse {
  highway: string;
  min_distance_km: number;
}

export interface ApiError {
  error: string;
  message?: string;
}

export interface GeolocationCoordinates {
  lat: number;
  lng: number;
}

// API Service class for highway exits
export class HighwayExitsApiService {
  private baseUrl: string;

  constructor(baseUrl: string = BASE_URL) {
    this.baseUrl = baseUrl;
  }
  /**
   * Get nearby highway exits within a specified radius
   * @param coordinates - GPS coordinates (lat, lng)
   * @param radiusKm - Search radius in kilometers (default: 5)
   */
  async getNearbyExits(
    coordinates: GeolocationCoordinates,
    radiusKm: number = 5
  ): Promise<HighwayExitsResponse> {
    const params = new URLSearchParams({
      lat: coordinates.lat.toString(),
      lng: coordinates.lng.toString(),
      radius_km: radiusKm.toString(),
    });

    const response = await fetch(`${this.baseUrl}/highway-exits/nearby?${params}`);

    if (!response.ok) {
      const error: ApiError = await response.json();
      throw new Error(error.message || error.error || 'Failed to fetch nearby exits');
    }

    return response.json();
  }

  /**
   * Identify the current highway based on GPS position
   * Returns the nearest highway to the current position
   * @param coordinates - GPS coordinates (lat, lng)
   */
  async getCurrentHighway(coordinates: GeolocationCoordinates): Promise<CurrentHighwayResponse> {
    const params = new URLSearchParams({
      lat: coordinates.lat.toString(),
      lng: coordinates.lng.toString(),
    });

    const response = await fetch(`${this.baseUrl}/highway-exits/current-highway?${params}`);

    if (!response.ok) {
      const error: ApiError = await response.json();
      throw new Error(error.message || error.error || 'Failed to identify current highway');
    }

    return response.json();
  }

  /**
   * Get the next highway exits based on position, highway, and optional direction
   * @param coordinates - GPS coordinates (lat, lng)
   * @param highway - Highway identifier (e.g., 'A1', 'A2')
   * @param direction - Optional direction filter (e.g., 'N', 'S', 'E', 'W')
   * @param heading - Optional heading/bearing in degrees (0-360)
   */
  async getNextExits(
    coordinates: GeolocationCoordinates,
    highway: string,
    direction?: string,
    heading?: number
  ): Promise<NextExitsResponse> {
    const params = new URLSearchParams({
      lat: coordinates.lat.toString(),
      lng: coordinates.lng.toString(),
      highway: highway,
    });

    if (direction) {
      params.append('direction', direction);
    }

    if (heading !== undefined) {
      params.append('heading', heading.toString());
    }

    const response = await fetch(`${this.baseUrl}/highway-exits/next?${params}`);

    if (!response.ok) {
      const error: ApiError = await response.json();
      throw new Error(error.message || error.error || 'Failed to fetch next exits');
    }

    return response.json();
  }

  /**
   * Get the next highway exit (just the first one)
   * Convenience method that returns only the closest next exit
   */
  async getNextExit(
    coordinates: GeolocationCoordinates,
    highway: string,
    direction?: string,
    heading?: number
  ): Promise<HighwayExit | null> {
    const result = await this.getNextExits(coordinates, highway, direction, heading);
    return result.next_exits.length > 0 ? result.next_exits[0] : null;
  }

  /**
   * Full highway detection workflow:
   * 1. Detect current highway
   * 2. Get next exit on that highway
   * This is the main function for real-time highway exit detection
   */
  async detectNextHighwayExit(
    coordinates: GeolocationCoordinates,
    direction?: string,
    heading?: number
  ): Promise<{
    currentHighway: string;
    nextExit: HighwayExit | null;
    distanceToHighway: number;
  }> {
    try {
      // Step 1: Identify current highway
      const currentHighwayResult = await this.getCurrentHighway(coordinates);
      
      // Step 2: Get next exit on current highway
      const nextExit = await this.getNextExit(
        coordinates,
        currentHighwayResult.highway,
        direction,
        heading
      );

      return {
        currentHighway: currentHighwayResult.highway,
        nextExit: nextExit,
        distanceToHighway: currentHighwayResult.min_distance_km,
      };
    } catch (error) {
      console.error('Error in highway exit detection:', error);
      throw error;
    }
  }
}

// Default instance for easy importing
export const highwayExitsApi = new HighwayExitsApiService();

// Helper functions for formatting and utilities
export const formatDistance = (distanceKm: number): string => {
  if (distanceKm < 1) {
    return `${Math.round(distanceKm * 1000)}m`;
  }
  return `${distanceKm.toFixed(1)}km`;
};

export const formatExitInfo = (exit: HighwayExit): string => {
  const parts = [exit.highway, `Exit ${exit.exit_number}`, exit.exit_name];
  return parts.join(' - ');
};

export const getDirectionName = (direction?: string): string => {
  const directions: Record<string, string> = {
    'N': 'Norte',
    'S': 'Sul',
    'E': 'Este',
    'W': 'Oeste',
  };
  return direction ? directions[direction] || direction : '';
};

// Export types for external use
export type {
  HighwayExit,
  HighwayExitsResponse,
  NextExitsResponse,
  CurrentHighwayResponse,
  ApiError,
  GeolocationCoordinates,
};