interface SeverityBadgeProps {
  severity: 'low' | 'medium' | 'high' | 'critical'
}

const styleMap: Record<SeverityBadgeProps['severity'], string> = {
  low: 'bg-emerald-50 text-emerald-800 border-emerald-200',
  medium: 'bg-amber-50 text-amber-800 border-amber-200',
  high: 'bg-orange-50 text-orange-800 border-orange-200',
  critical: 'bg-red-50 text-red-800 border-red-200',
}

export function SeverityBadge({ severity }: SeverityBadgeProps) {
  return (
    <span className={`inline-flex min-h-12 items-center rounded-full border px-4 text-sm font-bold uppercase ${styleMap[severity]}`}>
      {severity}
    </span>
  )
}

