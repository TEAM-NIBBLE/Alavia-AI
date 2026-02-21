import { type ComplaintCategory, type Hospital } from '../data/hospitals'

export interface RankedHospital extends Hospital {
  distanceKm: number
  travelMinutes: number
  matchScore: number
  matchReason: string
}

const specialtyMap: Record<ComplaintCategory, string[]> = {
  fever: ['general', 'infectious', 'pediatrics'],
  breathing: ['pulmonology', 'emergency', 'general'],
  chest: ['cardiology', 'emergency', 'general'],
  stomach: ['gastroenterology', 'general'],
  injury: ['trauma', 'orthopedics', 'emergency'],
  allergy: ['allergy', 'dermatology', 'general'],
  child: ['pediatrics', 'general'],
  general: ['general', 'emergency'],
}

export function detectComplaintCategory(text: string): ComplaintCategory {
  const value = text.toLowerCase()
  if (/(chest|heart|tight)/.test(value)) return 'chest'
  if (/(breath|asthma|wheez)/.test(value)) return 'breathing'
  if (/(stomach|belly|vomit|diarr)/.test(value)) return 'stomach'
  if (/(cut|injur|bleed|fracture|pain from fall)/.test(value)) return 'injury'
  if (/(rash|itch|allerg)/.test(value)) return 'allergy'
  if (/(child|baby|infant)/.test(value)) return 'child'
  if (/(fever|hot body|temperature)/.test(value)) return 'fever'
  return 'general'
}

export function distanceKm(fromLat: number, fromLng: number, toLat: number, toLng: number): number {
  const toRad = (value: number) => (value * Math.PI) / 180
  const earth = 6371
  const dLat = toRad(toLat - fromLat)
  const dLng = toRad(toLng - fromLng)
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(fromLat)) * Math.cos(toRad(toLat)) * Math.sin(dLng / 2) * Math.sin(dLng / 2)
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
  return Number((earth * c).toFixed(1))
}

export function rankHospitals(params: {
  hospitals: Hospital[]
  complaintCategory: ComplaintCategory
  severity: 'low' | 'medium' | 'high' | 'critical'
  location?: { lat: number; lng: number } | null
  areaQuery?: string
}): RankedHospital[] {
  const { hospitals, complaintCategory, severity, location, areaQuery } = params
  const targetSpecialties = specialtyMap[complaintCategory]
  const query = areaQuery?.trim().toLowerCase()

  const filtered = hospitals.filter((hospital) => {
    if (!query) return true
    return (
      hospital.city.toLowerCase().includes(query) ||
      hospital.area.toLowerCase().includes(query) ||
      hospital.address.toLowerCase().includes(query) ||
      hospital.name.toLowerCase().includes(query)
    )
  })

  const ranked = filtered.map((hospital) => {
    const matchHits = hospital.specialties.filter((item) => targetSpecialties.includes(item)).length
    const specialtyScore = matchHits * 40
    const emergencyScore = hospital.isEmergencyReady ? 25 : 0
    const distance = location ? distanceKm(location.lat, location.lng, hospital.lat, hospital.lng) : 0
    const distancePenalty = location ? Math.min(distance, 30) : 0

    let score = specialtyScore - distancePenalty
    if ((severity === 'high' || severity === 'critical') && hospital.isEmergencyReady) {
      score += emergencyScore
    }

    const reason =
      matchHits > 0
        ? `Best for ${complaintCategory.replace('_', ' ')}`
        : hospital.isEmergencyReady
          ? 'Has emergency unit'
          : 'General care available'

    return {
      ...hospital,
      distanceKm: location ? distance : Number((Math.random() * 12 + 1).toFixed(1)),
      travelMinutes: location
        ? Math.max(8, Math.round(((distance || 1) / 25) * 60))
        : Math.round((Math.random() * 30) + 12),
      matchScore: Math.round(score),
      matchReason: reason,
    }
  })

  ranked.sort((left, right) => {
    const leftHit = left.specialties.some((item) => targetSpecialties.includes(item)) ? 1 : 0
    const rightHit = right.specialties.some((item) => targetSpecialties.includes(item)) ? 1 : 0
    if (leftHit !== rightHit) return rightHit - leftHit

    if (severity === 'high' || severity === 'critical') {
      if (left.isEmergencyReady !== right.isEmergencyReady) return Number(right.isEmergencyReady) - Number(left.isEmergencyReady)
    }

    if (left.distanceKm !== right.distanceKm) return left.distanceKm - right.distanceKm
    return right.matchScore - left.matchScore
  })

  return ranked.slice(0, 10)
}

