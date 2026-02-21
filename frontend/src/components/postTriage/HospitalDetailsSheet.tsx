import { type RankedHospital } from '../../utils/hospitalRouting'

interface HospitalDetailsSheetProps {
  hospital: RankedHospital | null
  onClose: () => void
  onCall: (phone: string) => void
  onDirections: (hospital: RankedHospital) => void
}

export function HospitalDetailsSheet({ hospital, onClose, onCall, onDirections }: HospitalDetailsSheetProps) {
  return (
    <div className={`fixed inset-0 z-40 transition ${hospital ? 'pointer-events-auto opacity-100' : 'pointer-events-none opacity-0'}`}>
      <div className="absolute inset-0 bg-slate-900/40" onClick={onClose} />
      <section className={`absolute bottom-0 left-0 right-0 rounded-t-[28px] bg-white p-6 shadow-2xl transition-transform ${hospital ? 'translate-y-0' : 'translate-y-full'}`}>
        {hospital ? (
          <>
            <div className="mb-4 flex items-start justify-between">
              <div>
                <h4 className="text-xl font-bold text-slate-900">{hospital.name}</h4>
                <p className="text-sm text-slate-600">{hospital.address}</p>
                <p className="text-sm text-slate-600">{hospital.phone}</p>
              </div>
              <button type="button" className="inline-flex min-h-12 min-w-12 items-center justify-center rounded-full border border-slate-200" onClick={onClose}>
                ✕
              </button>
            </div>

            <div className="mb-4 flex flex-wrap gap-2">
              {hospital.facilities.map((item) => (
                <span key={item} className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700">
                  {item}
                </span>
              ))}
            </div>

            <div className="grid grid-cols-3 gap-2">
              <button type="button" className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl border border-slate-200 text-sm font-semibold text-slate-700" onClick={() => onCall(hospital.phone)}>
                📞 Call
              </button>
              <button type="button" className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl border border-slate-200 text-sm font-semibold text-slate-700" onClick={() => onDirections(hospital)}>
                🧭 Directions
              </button>
              <button type="button" className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-emerald-600 text-sm font-semibold text-white">
                ⭐ Save
              </button>
            </div>
          </>
        ) : null}
      </section>
    </div>
  )
}

