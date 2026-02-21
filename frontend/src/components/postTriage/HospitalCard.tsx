import { type RankedHospital } from '../../utils/hospitalRouting'

interface HospitalCardProps {
  hospital: RankedHospital
  onCall: (phone: string) => void
  onDirections: (hospital: RankedHospital) => void
  onDetails: (hospital: RankedHospital) => void
}

export function HospitalCard({ hospital, onCall, onDirections, onDetails }: HospitalCardProps) {
  return (
    <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h4 className="text-lg font-bold text-slate-900">{hospital.name}</h4>
          <p className="text-sm text-slate-600">{hospital.distanceKm} km • ~{hospital.travelMinutes} min</p>
        </div>
        <div className="flex flex-col items-end gap-1">
          <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-800">{hospital.matchReason}</span>
          <span className={`rounded-full px-3 py-1 text-xs font-semibold ${hospital.isPublic ? 'bg-slate-100 text-slate-700' : 'bg-blue-50 text-blue-700'}`}>
            {hospital.isPublic ? 'Public' : 'Private'}
          </span>
        </div>
      </div>

      <div className="mt-3 flex flex-wrap gap-2">
        {hospital.isEmergencyReady ? (
          <span className="rounded-full bg-red-50 px-3 py-1 text-xs font-semibold text-red-700">Emergency Ready</span>
        ) : null}
      </div>

      <div className="mt-4 grid grid-cols-3 gap-2">
        <button type="button" className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl border border-slate-200 text-sm font-semibold text-slate-700" onClick={() => onCall(hospital.phone)}>
          <span>📞</span>
          <span>Call</span>
        </button>
        <button type="button" className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl border border-slate-200 text-sm font-semibold text-slate-700" onClick={() => onDirections(hospital)}>
          <span>🧭</span>
          <span>Directions</span>
        </button>
        <button type="button" className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-emerald-600 text-sm font-semibold text-white" onClick={() => onDetails(hospital)}>
          <span>ℹ️</span>
          <span>Details</span>
        </button>
      </div>
    </article>
  )
}

