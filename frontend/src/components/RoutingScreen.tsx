import { useEffect, useMemo, useState } from 'react'
import { hospitalsApi, type HospitalListItem } from '../api/services'
import { mockHospitals, type ComplaintCategory } from '../data/hospitals'
import { FilterPills } from './postTriage/FilterPills'
import { HospitalCard } from './postTriage/HospitalCard'
import { HospitalDetailsSheet } from './postTriage/HospitalDetailsSheet'
import { ListMapToggle } from './postTriage/ListMapToggle'
import { SeverityBadge } from './postTriage/SeverityBadge'
import { distanceKm, rankHospitals, type RankedHospital } from '../utils/hospitalRouting'

interface RoutingScreenProps {
  severity: 'low' | 'medium' | 'high' | 'critical'
  complaintCategory: ComplaintCategory
  onBack: () => void
}

function toStringArray(value: unknown): string[] {
  if (Array.isArray(value)) return value.map((item) => String(item).toLowerCase())
  if (typeof value === 'string') return value.split(',').map((item) => item.trim().toLowerCase()).filter(Boolean)
  return []
}

function toRankedHospital(item: HospitalListItem, category: ComplaintCategory, location: { lat: number; lng: number } | null, index: number): RankedHospital {
  const specialtyList = toStringArray(item.specialties)
  const facilityList = toStringArray(item.facilities)
  const isEmergencyReady = Boolean(item.isEmergencyReady ?? item.emergency_ready)
  const isPublic = item.is_public ?? true
  const computedDistance = location ? distanceKm(location.lat, location.lng, item.lat, item.lng) : Number((index + 1.2).toFixed(1))
  const resolvedDistance = Number((item.distance_km ?? computedDistance).toFixed(1))
  const travelMinutes = Math.max(8, Math.round((resolvedDistance / 25) * 60))

  return {
    id: String(item.id),
    name: item.name,
    lat: item.lat,
    lng: item.lng,
    address: item.address ?? 'Address unavailable',
    phone: item.phone ?? '112',
    isPublic,
    isEmergencyReady,
    specialties: specialtyList.length > 0 ? specialtyList : ['general'],
    facilities: facilityList,
    openHours: item.openHours ?? item.open_hours,
    city: item.city ?? 'Unknown',
    area: item.area ?? 'Unknown',
    distanceKm: resolvedDistance,
    travelMinutes,
    matchScore: Math.max(1, 100 - Math.round(resolvedDistance * 2)),
    matchReason: specialtyList.includes(category) ? `Best for ${category}` : isEmergencyReady ? 'Has emergency unit' : 'General care available',
  }
}

export function RoutingScreen({ severity, complaintCategory, onBack }: RoutingScreenProps) {
  const [viewMode, setViewMode] = useState<'list' | 'map'>('list')
  const [sortMode, setSortMode] = useState('best')
  const [locationStatus, setLocationStatus] = useState<'loading' | 'granted' | 'denied' | 'manual'>('loading')
  const [location, setLocation] = useState<{ lat: number; lng: number } | null>(null)
  const [query, setQuery] = useState('')
  const [selectedHospital, setSelectedHospital] = useState<RankedHospital | null>(null)
  const [largeTextMode, setLargeTextMode] = useState(false)
  const [darkMode, setDarkMode] = useState(false)
  const [apiHospitals, setApiHospitals] = useState<RankedHospital[]>([])
  const [hospitalsLoading, setHospitalsLoading] = useState(false)
  const [hospitalsError, setHospitalsError] = useState('')

  useEffect(() => {
    if (!navigator.geolocation) {
      setLocationStatus('denied')
      return
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setLocation({
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        })
        setLocationStatus('granted')
      },
      () => setLocationStatus('denied'),
      { timeout: 10000, enableHighAccuracy: true }
    )
  }, [])

  useEffect(() => {
    let cancelled = false

    const loadHospitals = async () => {
      setHospitalsLoading(true)
      setHospitalsError('')
      try {
        const response = await hospitalsApi.list({
          lat: location?.lat,
          lng: location?.lng,
          specialty: complaintCategory === 'general' ? undefined : complaintCategory,
          severity,
          emergency_ready: severity === 'high' || severity === 'critical' ? true : undefined,
          is_public: sortMode === 'public' ? true : sortMode === 'private' ? false : undefined,
        })
        if (cancelled) return
        const mapped = response.data.map((item, index) => toRankedHospital(item, complaintCategory, location, index))
        setApiHospitals(mapped)
      } catch (error) {
        if (cancelled) return
        setHospitalsError(error instanceof Error ? error.message : 'Could not load hospitals from API.')
        setApiHospitals([])
      } finally {
        if (!cancelled) setHospitalsLoading(false)
      }
    }

    void loadHospitals()
    return () => {
      cancelled = true
    }
  }, [complaintCategory, location?.lat, location?.lng, severity, sortMode])

  const fallbackRanked = useMemo(() => {
    return rankHospitals({
      hospitals: mockHospitals,
      complaintCategory,
      severity,
      location,
      areaQuery: query,
    })
  }, [complaintCategory, location, query, severity])

  const visibleHospitals = useMemo(() => {
    const source = apiHospitals.length > 0 ? apiHospitals : fallbackRanked
    let rows = [...source]
    const loweredQuery = query.trim().toLowerCase()

    if (loweredQuery) {
      rows = rows.filter((item) =>
        item.name.toLowerCase().includes(loweredQuery) ||
        item.address.toLowerCase().includes(loweredQuery) ||
        item.city.toLowerCase().includes(loweredQuery) ||
        item.area.toLowerCase().includes(loweredQuery)
      )
    }

    if (sortMode === 'nearest') rows = rows.sort((left, right) => left.distanceKm - right.distanceKm)
    if (sortMode === 'public') rows = rows.filter((item) => item.isPublic)
    if (sortMode === 'private') rows = rows.filter((item) => !item.isPublic)
    if (sortMode === 'emergency') rows = rows.filter((item) => item.isEmergencyReady)
    return rows.slice(0, 10)
  }, [apiHospitals, fallbackRanked, query, sortMode])

  const openDirections = (hospital: RankedHospital) => {
    const url = `https://www.google.com/maps/search/?api=1&query=${hospital.lat},${hospital.lng}`
    window.open(url, '_blank', 'noopener,noreferrer')
  }

  const callHospital = (phone: string) => {
    window.location.href = `tel:${phone}`
  }

  return (
    <div className={`min-h-screen ${darkMode ? 'bg-slate-950 text-slate-100' : 'bg-[#f8faf9] text-[#1f2933]'} ${largeTextMode ? 'text-lg' : 'text-base'}`}>
      <header className="sticky top-0 z-20 border-b border-emerald-100 bg-white/95 px-4 py-3 backdrop-blur-md dark:bg-slate-900/95">
        <div className="mx-auto max-w-5xl">
          <div className="mb-2 h-1.5 rounded-full bg-[linear-gradient(90deg,#0f9f62_0%,#ffffff_50%,#0f9f62_100%)]" />
          <div className="flex items-center justify-between gap-3">
            <button type="button" className="inline-flex min-h-12 items-center gap-2 rounded-xl border border-slate-200 px-4 text-sm font-semibold" onClick={onBack}>
              Back
            </button>
            <h1 className="text-xl font-bold">Hospital Routing</h1>
            <div className="flex items-center gap-2">
              <span className="inline-flex min-h-12 items-center rounded-full border border-emerald-200 bg-emerald-50 px-4 text-sm font-semibold text-emerald-800">
                {complaintCategory.toUpperCase()}
              </span>
              <button type="button" className="inline-flex min-h-12 min-w-12 items-center justify-center rounded-full border border-red-200 bg-red-50 text-red-700">
                SOS
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="mx-auto w-full max-w-5xl space-y-5 px-4 pb-8 pt-6">
        <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:bg-slate-900">
          <div className="mb-3 flex flex-wrap items-center gap-2">
            <SeverityBadge severity={severity} />
            <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700">
              {locationStatus === 'granted' ? 'Using your location' : locationStatus === 'loading' ? 'Checking location...' : 'Enter your area'}
            </span>
            <button type="button" className="inline-flex min-h-12 items-center gap-2 rounded-xl border border-slate-200 px-4 text-sm font-semibold" onClick={() => setLargeTextMode((value) => !value)}>
              {largeTextMode ? 'Standard Text' : 'Large Text'}
            </button>
            <button type="button" className="inline-flex min-h-12 items-center gap-2 rounded-xl border border-slate-200 px-4 text-sm font-semibold" onClick={() => setDarkMode((value) => !value)}>
              {darkMode ? 'Light' : 'Dark'}
            </button>
          </div>

          <div className="grid gap-3 md:grid-cols-[1fr_auto]">
            <input
              value={query}
              onChange={(event) => {
                setQuery(event.target.value)
                if (locationStatus !== 'granted') setLocationStatus('manual')
              }}
              className="min-h-12 rounded-xl border border-slate-300 px-4 text-sm text-slate-900 outline-none focus:ring-2 focus:ring-emerald-200"
              placeholder="Search area or landmark"
            />
            <ListMapToggle mode={viewMode} onChange={setViewMode} />
          </div>

          <div className="mt-3">
            <FilterPills
              active={sortMode}
              onChange={setSortMode}
              options={[
                { key: 'nearest', label: 'Nearest' },
                { key: 'best', label: 'Best match' },
                { key: 'public', label: 'Public' },
                { key: 'private', label: 'Private' },
                { key: 'emergency', label: 'Emergency ready' },
              ]}
            />
          </div>
        </section>

        <section className="rounded-2xl border border-emerald-100 bg-emerald-50 p-4 text-sm text-emerald-900 shadow-sm">
          We ranked hospitals by specialty and urgency, then distance.
        </section>

        {hospitalsLoading ? (
          <section className="rounded-2xl border border-slate-200 bg-white p-4 text-sm text-slate-700 shadow-sm">
            Loading hospitals from API...
          </section>
        ) : null}

        {hospitalsError ? (
          <section className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900 shadow-sm">
            {hospitalsError} Showing fallback list.
          </section>
        ) : null}

        {locationStatus === 'denied' ? (
          <section className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900 shadow-sm">
            Location access is denied. Enable location in browser settings or search by your area manually.
          </section>
        ) : null}

        {visibleHospitals.length === 0 && !hospitalsLoading ? (
          <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:bg-slate-900">
            <h3 className="text-lg font-bold">No exact matches found</h3>
            <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">
              Try another area, or call emergency services if symptoms are severe.
            </p>
          </section>
        ) : null}

        {viewMode === 'list' ? (
          <section className="space-y-3">
            {visibleHospitals.map((hospital) => (
              <HospitalCard
                key={hospital.id}
                hospital={hospital}
                onCall={callHospital}
                onDirections={openDirections}
                onDetails={setSelectedHospital}
              />
            ))}
          </section>
        ) : (
          <section className="grid gap-3 lg:grid-cols-[2fr_1fr]">
            <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:bg-slate-900">
              <div className="mb-3 flex items-center justify-between">
                <h3 className="text-lg font-bold">Map View (MVP Placeholder)</h3>
                <span className="text-xs text-slate-500">Pins shown as list</span>
              </div>
              <div className="grid h-72 place-items-center rounded-2xl border border-dashed border-slate-300 bg-slate-50 text-sm text-slate-500">
                Map container placeholder
              </div>
            </div>

            <div className="space-y-2">
              {visibleHospitals.slice(0, 6).map((hospital) => (
                <button
                  key={hospital.id}
                  type="button"
                  className="flex min-h-12 w-full items-center justify-between rounded-xl border border-slate-200 bg-white px-3 text-left text-sm font-semibold text-slate-700 shadow-sm dark:bg-slate-900 dark:text-slate-100"
                  onClick={() => setSelectedHospital(hospital)}
                >
                  <span>{hospital.name}</span>
                  <span className="text-xs text-slate-500">{hospital.distanceKm} km</span>
                </button>
              ))}
            </div>
          </section>
        )}
      </main>

      <HospitalDetailsSheet hospital={selectedHospital} onClose={() => setSelectedHospital(null)} onCall={callHospital} onDirections={openDirections} />
    </div>
  )
}
