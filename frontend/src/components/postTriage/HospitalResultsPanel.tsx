import { useEffect, useMemo, useRef, useState } from 'react'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import { AnimatePresence, motion } from 'framer-motion'
import { useTranslation } from 'react-i18next'
import { AlertTriangle, Clock, Loader2, Map as MapIcon, MapPin, Navigation, Siren } from 'lucide-react'
import type { HospitalListItem } from '../../api/services'

export interface RankedHospital extends HospitalListItem {
  effectiveDistanceKm: number | null
}

interface HospitalResultsPanelProps {
  hospitals: RankedHospital[]
  userLocation: { lat: number; lng: number } | null
  isLoading: boolean
  error: string | null
  notice: string | null
  severity?: string
}

const LAGOS_CENTER: [number, number] = [6.5244, 3.3792]
const MAX_ON_MAP = 8
// Average urban driving speed in Lagos traffic; only used for a rough "about N min" hint.
const URBAN_KMH = 22

const etaMinutes = (km: number) => Math.max(3, Math.round((km / URBAN_KMH) * 60))

const directionsUrl = (hospital: RankedHospital, user: { lat: number; lng: number } | null) => {
  const origin = user ? `&origin=${user.lat},${user.lng}` : ''
  return `https://www.google.com/maps/dir/?api=1${origin}&destination=${hospital.lat},${hospital.lng}&travelmode=driving`
}

const pinHtml = (index: number, emergency: boolean, selected: boolean) =>
  `<div class="alavia-pin${emergency ? ' alavia-pin--emergency' : ''}${selected ? ' alavia-pin--selected' : ''}"><span>${index + 1}</span></div>`

export function HospitalResultsPanel({ hospitals, userLocation, isLoading, error, notice, severity }: HospitalResultsPanelProps) {
  const { t } = useTranslation()
  const mapElRef = useRef<HTMLDivElement | null>(null)
  const mapRef = useRef<L.Map | null>(null)
  const layerRef = useRef<L.LayerGroup | null>(null)
  const cardRefs = useRef<Record<number, HTMLDivElement | null>>({})
  const [selectedId, setSelectedId] = useState<number | null>(null)
  const [mapFailed, setMapFailed] = useState(false)
  const fitAllRef = useRef<() => void>(() => {})

  const shown = useMemo(() => hospitals.slice(0, MAX_ON_MAP), [hospitals])
  const urgent = ['high', 'critical'].includes((severity ?? '').toLowerCase())
  // For serious cases surface the nearest place we believe has an emergency unit.
  const nearestEmergency = useMemo(
    () => (urgent ? shown.find((h) => h.emergency_ready) ?? null : null),
    [shown, urgent],
  )

  // Create the map once.
  useEffect(() => {
    if (!mapElRef.current || mapRef.current) return
    const map = L.map(mapElRef.current, { zoomControl: true, attributionControl: true, scrollWheelZoom: false })
      .setView(LAGOS_CENTER, 12)
    const tiles = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      attribution: '&copy; OpenStreetMap contributors',
    })
    tiles.on('tileerror', () => setMapFailed(true))
    tiles.on('tileload', () => setMapFailed(false))
    tiles.addTo(map)
    layerRef.current = L.layerGroup().addTo(map)
    mapRef.current = map

    return () => {
      map.remove()
      mapRef.current = null
      layerRef.current = null
    }
  }, [])

  // Redraw markers whenever results, location or selection change.
  useEffect(() => {
    const map = mapRef.current
    const layer = layerRef.current
    if (!map || !layer) return

    layer.clearLayers()
    const bounds: L.LatLngExpression[] = []

    shown.forEach((hospital, index) => {
      const latlng: L.LatLngExpression = [hospital.lat, hospital.lng]
      bounds.push(latlng)
      const marker = L.marker(latlng, {
        icon: L.divIcon({
          className: 'alavia-pin-wrap',
          html: pinHtml(index, !!hospital.emergency_ready, hospital.id === selectedId),
          iconSize: [34, 34],
          iconAnchor: [17, 34],
        }),
        title: hospital.name,
        zIndexOffset: hospital.id === selectedId ? 1000 : 0,
      })
      marker.on('click', () => setSelectedId(hospital.id))
      marker.addTo(layer)
    })

    if (userLocation) {
      bounds.push([userLocation.lat, userLocation.lng])
      L.marker([userLocation.lat, userLocation.lng], {
        icon: L.divIcon({ className: 'alavia-user-wrap', html: '<div class="alavia-user"></div>', iconSize: [18, 18] }),
        interactive: false,
        zIndexOffset: 2000,
      }).addTo(layer)

      const target = shown.find((h) => h.id === selectedId)
      if (target) {
        L.polyline([[userLocation.lat, userLocation.lng], [target.lat, target.lng]], {
          color: '#059669', weight: 3, dashArray: '6 8', opacity: 0.85,
        }).addTo(layer)
      }
    }

    fitAllRef.current = () => {
      if (bounds.length) map.fitBounds(L.latLngBounds(bounds), { padding: [36, 36], maxZoom: 15 })
    }
    if (selectedId == null) fitAllRef.current()
  }, [shown, userLocation, selectedId])

  // Selecting a card flies the map to it.
  useEffect(() => {
    const map = mapRef.current
    const target = shown.find((h) => h.id === selectedId)
    if (map && target) map.flyTo([target.lat, target.lng], Math.max(map.getZoom(), 15), { duration: 0.6 })
  }, [selectedId, shown])

  // The map container is hidden (zero-sized) until results arrive, so once it is visible
  // recompute its size and frame everything again; otherwise it frames the wrong area.
  const visible = !(shown.length === 0 || isLoading || error)
  useEffect(() => {
    if (!visible) return
    const id = window.setTimeout(() => {
      mapRef.current?.invalidateSize()
      if (selectedId == null) fitAllRef.current()
    }, 120)
    return () => window.clearTimeout(id)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visible, shown.length])

  const selectFromCard = (id: number) => {
    setSelectedId((current) => (current === id ? null : id))
  }

  // Marker click: bring the matching card into view.
  useEffect(() => {
    if (selectedId != null) cardRefs.current[selectedId]?.scrollIntoView({ behavior: 'smooth', block: 'nearest' })
  }, [selectedId])

  const distanceText = (hospital: RankedHospital) =>
    hospital.effectiveDistanceKm != null
      ? t('voice.distanceAway', { distance: `${hospital.effectiveDistanceKm} km` })
      : t('voice.distanceUnavailable')

  return (
    <div className="overflow-hidden rounded-[32px] border border-slate-100 bg-white p-5 shadow-2xl shadow-slate-200/50 sm:p-8">
      <div className="mb-5 flex items-start justify-between gap-4">
        <div>
          <h3 className="mb-1 text-lg font-black tracking-tight text-slate-800 sm:text-2xl">{t('voice.routingTitle')}</h3>
          <p className="text-sm font-bold text-slate-400">{t('voice.routingDesc')}</p>
        </div>
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600">
          <MapIcon size={24} />
        </div>
      </div>

      {notice && !isLoading && (
        <div className="mb-4 flex items-start gap-2 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-xs font-bold text-amber-800">
          <MapPin size={14} className="mt-0.5 shrink-0" />
          <span>{notice}</span>
        </div>
      )}

      {urgent && nearestEmergency && (
        <motion.a
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          href={directionsUrl(nearestEmergency, userLocation)}
          target="_blank"
          rel="noreferrer"
          className="mb-4 flex flex-col gap-3 rounded-3xl bg-red-600 p-4 text-white transition-all hover:bg-red-700 active:scale-[0.99] sm:flex-row sm:items-center sm:gap-4"
        >
          <div className="flex min-w-0 flex-1 items-center gap-3">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-white/20">
            <Siren size={22} />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-[10px] font-black uppercase tracking-widest text-white/80">{t('voice.hospitals.nearestEmergency')}</p>
            <p className="text-base font-black leading-tight">{nearestEmergency.name}</p>
            <p className="text-xs font-bold text-white/80">
              {distanceText(nearestEmergency)}
              {nearestEmergency.effectiveDistanceKm != null && ` · ${t('voice.hospitals.eta', { minutes: etaMinutes(nearestEmergency.effectiveDistanceKm) })}`}
            </p>
          </div>
          </div>
          <span className="inline-flex shrink-0 items-center justify-center gap-1.5 rounded-full bg-white px-4 py-2.5 text-xs font-black uppercase tracking-wider text-red-700">
            <Navigation size={14} />
            {t('voice.hospitals.goNow')}
          </span>
        </motion.a>
      )}

      {isLoading && (
        <div className="flex items-center gap-3 rounded-2xl bg-slate-50 px-4 py-5 text-sm font-bold text-slate-500">
          <Loader2 size={18} className="animate-spin text-emerald-600" />
          {t('voice.status.processing')}
        </div>
      )}

      {!isLoading && error && (
        <div className="flex items-start gap-2 rounded-2xl border border-red-200 bg-red-50 px-4 py-4 text-sm font-bold text-red-700">
          <AlertTriangle size={16} className="mt-0.5 shrink-0" />
          {error}
        </div>
      )}

      {!isLoading && !error && shown.length === 0 && (
        <div className="rounded-2xl bg-slate-50 px-4 py-5 text-sm font-bold text-slate-500">{t('voice.noHospitals')}</div>
      )}

      {/* The map stays mounted so Leaflet isn't torn down while results reload. */}
      <div className={visible ? 'block' : 'hidden'}>
        <div className="relative isolate z-0 h-72 overflow-hidden rounded-3xl border border-slate-100 sm:h-80">
          <div ref={mapElRef} className="h-full w-full" />
          {mapFailed && (
            <div className="absolute inset-x-3 top-3 z-[500] rounded-xl bg-amber-50 px-3 py-2 text-[11px] font-bold text-amber-800">
              {t('voice.hospitals.mapLoadFailed')}
            </div>
          )}
          <div className="pointer-events-none absolute bottom-3 left-3 z-[500] flex items-center gap-3 rounded-full bg-white/95 px-3 py-1.5 text-[10px] font-bold text-slate-600">
            {userLocation && (
              <span className="flex items-center gap-1.5"><i className="inline-block h-2.5 w-2.5 rounded-full bg-blue-500" />{t('voice.mapYou')}</span>
            )}
            <span className="flex items-center gap-1.5"><i className="inline-block h-2.5 w-2.5 rounded-full bg-red-600" />{t('voice.hospitals.emergencyReady')}</span>
            <span className="flex items-center gap-1.5"><i className="inline-block h-2.5 w-2.5 rounded-full bg-emerald-600" />{t('voice.mapHospital')}</span>
          </div>
        </div>

        <p className="mb-3 mt-5 text-[11px] font-black uppercase tracking-widest text-slate-400">
          {t('voice.hospitals.nearestCount', { count: shown.length })}
        </p>

        <div className="space-y-3">
          <AnimatePresence initial={false}>
            {shown.map((hospital, index) => {
              const selected = hospital.id === selectedId
              return (
                <motion.div
                  key={hospital.id}
                  ref={(el) => { cardRefs.current[hospital.id] = el }}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: Math.min(index, 6) * 0.04 }}
                  className={`rounded-3xl border p-4 transition-colors sm:p-5 ${selected ? 'border-emerald-400 bg-emerald-50/60' : 'border-slate-100 bg-slate-50/70'}`}
                >
                  <button type="button" onClick={() => selectFromCard(hospital.id)} className="flex w-full items-start gap-4 text-left">
                    <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-sm font-black text-white ${hospital.emergency_ready ? 'bg-red-600' : 'bg-emerald-600'}`}>
                      {index + 1}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block text-sm font-black leading-tight text-slate-900 sm:text-base">{hospital.name}</span>
                      <span className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] font-bold text-slate-500">
                        <span>{distanceText(hospital)}</span>
                        {hospital.effectiveDistanceKm != null && (
                          <span className="inline-flex items-center gap-1">
                            <Clock size={11} />
                            {t('voice.hospitals.eta', { minutes: etaMinutes(hospital.effectiveDistanceKm) })}
                          </span>
                        )}
                        {index === 0 && hospital.effectiveDistanceKm != null && (
                          <span className="text-emerald-600">{t('voice.hospitals.closestToYou')}</span>
                        )}
                      </span>
                    </span>
                  </button>

                  {/* Only show a badge when we actually know it; unknown is left unsaid. */}
                  <div className="mt-3 flex flex-wrap gap-1.5">
                    {hospital.emergency_ready && (
                      <span className="rounded-full bg-red-100 px-2.5 py-1 text-[10px] font-black uppercase tracking-wider text-red-700">{t('voice.hospitals.emergencyReady')}</span>
                    )}
                    {hospital.is_public && (
                      <span className="rounded-full bg-blue-100 px-2.5 py-1 text-[10px] font-black uppercase tracking-wider text-blue-700">{t('voice.hospitals.public')}</span>
                    )}
                    {hospital.is_24_hours && (
                      <span className="rounded-full bg-emerald-100 px-2.5 py-1 text-[10px] font-black uppercase tracking-wider text-emerald-700">{t('voice.hospitals.hours24')}</span>
                    )}
                    {hospital.rating != null && (
                      <span className="rounded-full bg-amber-100 px-2.5 py-1 text-[10px] font-black uppercase tracking-wider text-amber-700">{t('voice.hospitals.rating', { rating: hospital.rating })}</span>
                    )}
                    {(hospital.specialties ?? []).slice(0, 3).map((s) => (
                      <span key={s} className="rounded-full bg-slate-200/70 px-2.5 py-1 text-[10px] font-black uppercase tracking-wider text-slate-600">{s}</span>
                    ))}
                  </div>

                  {hospital.address && <p className="mt-2 text-[11px] font-semibold text-slate-400">{hospital.address}</p>}

                  <a
                    href={directionsUrl(hospital, userLocation)}
                    target="_blank"
                    rel="noreferrer"
                    className="mt-3 flex w-full items-center justify-center gap-2 rounded-full bg-emerald-600 py-3 text-[11px] font-black uppercase tracking-widest text-white transition-all hover:bg-emerald-700 active:scale-[0.98]"
                  >
                    <Navigation size={14} />
                    {t('voice.hospitals.getDirections')}
                  </a>
                </motion.div>
              )
            })}
          </AnimatePresence>
        </div>
      </div>
    </div>
  )
}
