export type ComplaintCategory =
  | 'fever'
  | 'breathing'
  | 'chest'
  | 'stomach'
  | 'injury'
  | 'allergy'
  | 'child'
  | 'general'

export interface Hospital {
  id: string
  name: string
  lat: number
  lng: number
  address: string
  phone: string
  isPublic: boolean
  isEmergencyReady: boolean
  specialties: string[]
  facilities: string[]
  openHours?: string
  city: string
  area: string
}

export const mockHospitals: Hospital[] = [
  {
    id: 'lag-001',
    name: 'Lagos University Teaching Hospital',
    lat: 6.5178,
    lng: 3.3668,
    address: 'Idi-Araba, Surulere, Lagos',
    phone: '+234-01-2934000',
    isPublic: true,
    isEmergencyReady: true,
    specialties: ['cardiology', 'trauma', 'pulmonology', 'pediatrics', 'general'],
    facilities: ['Emergency', 'Lab', 'ICU', 'Pediatrics'],
    city: 'Lagos',
    area: 'Surulere',
  },
  {
    id: 'lag-002',
    name: 'Reddington Hospital',
    lat: 6.4474,
    lng: 3.4703,
    address: '12 Idowu Martins, Victoria Island, Lagos',
    phone: '+234-01-2715340',
    isPublic: false,
    isEmergencyReady: true,
    specialties: ['cardiology', 'emergency', 'general', 'allergy'],
    facilities: ['Emergency', 'Lab', 'Imaging'],
    city: 'Lagos',
    area: 'Victoria Island',
  },
  {
    id: 'lag-003',
    name: 'General Hospital Ikeja',
    lat: 6.6048,
    lng: 3.3491,
    address: 'Oba Akinjobi Way, Ikeja, Lagos',
    phone: '+234-01-4933380',
    isPublic: true,
    isEmergencyReady: true,
    specialties: ['general', 'injury', 'stomach', 'breathing'],
    facilities: ['Emergency', 'Lab'],
    city: 'Lagos',
    area: 'Ikeja',
  },
  {
    id: 'abu-001',
    name: 'National Hospital Abuja',
    lat: 9.0583,
    lng: 7.4891,
    address: 'Central District, Abuja',
    phone: '+234-09-4613000',
    isPublic: true,
    isEmergencyReady: true,
    specialties: ['cardiology', 'neurology', 'pediatrics', 'general', 'trauma'],
    facilities: ['Emergency', 'ICU', 'Lab', 'Pediatrics'],
    city: 'Abuja',
    area: 'Central Area',
  },
  {
    id: 'abu-002',
    name: 'Nizamiye Hospital',
    lat: 9.0818,
    lng: 7.4018,
    address: 'Jabi, Abuja',
    phone: '+234-09-2903000',
    isPublic: false,
    isEmergencyReady: true,
    specialties: ['cardiology', 'stomach', 'allergy', 'general'],
    facilities: ['Emergency', 'Lab', 'Imaging'],
    city: 'Abuja',
    area: 'Jabi',
  },
  {
    id: 'kan-001',
    name: 'Aminu Kano Teaching Hospital',
    lat: 12.0014,
    lng: 8.5237,
    address: 'Zaria Road, Kano',
    phone: '+234-64-666500',
    isPublic: true,
    isEmergencyReady: true,
    specialties: ['pediatrics', 'breathing', 'injury', 'general'],
    facilities: ['Emergency', 'Lab', 'Pediatrics'],
    city: 'Kano',
    area: 'Nasarawa',
  },
  {
    id: 'kan-002',
    name: 'Murtala Muhammed Specialist Hospital',
    lat: 12.0141,
    lng: 8.5309,
    address: 'Fagge, Kano',
    phone: '+234-64-663330',
    isPublic: true,
    isEmergencyReady: false,
    specialties: ['general', 'stomach', 'fever'],
    facilities: ['Lab'],
    city: 'Kano',
    area: 'Fagge',
  },
  {
    id: 'ph-001',
    name: 'University of Port Harcourt Teaching Hospital',
    lat: 4.8469,
    lng: 6.9746,
    address: 'East-West Road, Port Harcourt',
    phone: '+234-84-231222',
    isPublic: true,
    isEmergencyReady: true,
    specialties: ['trauma', 'general', 'breathing', 'pediatrics'],
    facilities: ['Emergency', 'ICU', 'Lab'],
    city: 'Port Harcourt',
    area: 'Alakahia',
  },
  {
    id: 'ib-001',
    name: 'University College Hospital Ibadan',
    lat: 7.4432,
    lng: 3.8965,
    address: 'Oritamefa, Ibadan',
    phone: '+234-02-2410088',
    isPublic: true,
    isEmergencyReady: true,
    specialties: ['cardiology', 'neurology', 'general', 'injury'],
    facilities: ['Emergency', 'Lab', 'Imaging'],
    city: 'Ibadan',
    area: 'Mokola',
  },
  {
    id: 'en-001',
    name: 'Parklane Specialist Hospital',
    lat: 6.4524,
    lng: 7.5105,
    address: 'GRA, Enugu',
    phone: '+234-42-256789',
    isPublic: true,
    isEmergencyReady: false,
    specialties: ['general', 'fever', 'stomach'],
    facilities: ['Lab'],
    city: 'Enugu',
    area: 'GRA',
  },
]

