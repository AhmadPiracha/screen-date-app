// Geolocation Service
// Uses browser Geolocation API + reverse geocoding

export interface LocationData {
  latitude: number
  longitude: number
  city: string | null
  state: string | null
  country: string | null
  formattedAddress: string | null
}

export interface GeolocationError {
  code: number
  message: string
}

// Get current position using browser API
export function getCurrentPosition(): Promise<GeolocationPosition> {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error('Geolocation is not supported by this browser'))
      return
    }

    navigator.geolocation.getCurrentPosition(
      resolve,
      (error) => {
        const errors: Record<number, string> = {
          1: 'Permission denied. Please enable location access.',
          2: 'Position unavailable. Please try again.',
          3: 'Request timed out. Please try again.',
        }
        reject(new Error(errors[error.code] || 'Unknown error'))
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 300000, // 5 minutes cache
      }
    )
  })
}

// Reverse geocode using Google Maps API
export async function reverseGeocode(
  latitude: number,
  longitude: number
): Promise<LocationData> {
  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY

  if (apiKey) {
    // Use Google Maps Geocoding API
    const url = `https://maps.googleapis.com/maps/api/geocode/json?latlng=${latitude},${longitude}&key=${apiKey}`
    
    try {
      const response = await fetch(url)
      const data = await response.json()

      if (data.status === 'OK' && data.results.length > 0) {
        const result = data.results[0]
        const components = result.address_components

        let city = null
        let state = null
        let country = null

        for (const component of components) {
          if (component.types.includes('locality')) {
            city = component.long_name
          }
          if (component.types.includes('administrative_area_level_1')) {
            state = component.long_name
          }
          if (component.types.includes('country')) {
            country = component.long_name
          }
        }

        return {
          latitude,
          longitude,
          city,
          state,
          country,
          formattedAddress: result.formatted_address,
        }
      }
    } catch (error) {
      console.error('Google Geocoding error:', error)
    }
  }

  // Fallback: Use free Nominatim API (OpenStreetMap)
  try {
    const url = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&zoom=10`
    
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'MoviePartnerFinder/1.0',
      },
    })
    
    const data = await response.json()

    return {
      latitude,
      longitude,
      city: data.address?.city || data.address?.town || data.address?.village || null,
      state: data.address?.state || null,
      country: data.address?.country || null,
      formattedAddress: data.display_name || null,
    }
  } catch (error) {
    console.error('Nominatim Geocoding error:', error)
    return {
      latitude,
      longitude,
      city: null,
      state: null,
      country: null,
      formattedAddress: null,
    }
  }
}

// Combined function: get location and city
export async function getLocationWithCity(): Promise<LocationData> {
  const position = await getCurrentPosition()
  const { latitude, longitude } = position.coords
  return reverseGeocode(latitude, longitude)
}

// Check if we have location permission
export async function checkLocationPermission(): Promise<PermissionState> {
  if (!navigator.permissions) {
    return 'prompt' // Assume prompt if API not available
  }
  
  const result = await navigator.permissions.query({ name: 'geolocation' })
  return result.state
}
