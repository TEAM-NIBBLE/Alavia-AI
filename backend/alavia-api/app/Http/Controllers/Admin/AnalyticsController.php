<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Consultation;
use App\Models\User;
use Carbon\Carbon;
use Illuminate\Http\JsonResponse;

class AnalyticsController extends Controller
{
    public function overview(): JsonResponse
    {
        $users = User::count();
        $consultations = Consultation::count();

        $severityBreakdown = Consultation::query()
            ->selectRaw('severity, COUNT(*) as total')
            ->groupBy('severity')
            ->pluck('total', 'severity');

        $daily = Consultation::query()
            ->where('created_at', '>=', now()->subDays(6)->startOfDay())
            ->get()
            ->groupBy(fn ($consultation) => Carbon::parse($consultation->created_at)->format('Y-m-d'))
            ->map(fn ($items) => $items->count());

        $last7Days = [];
        for ($i = 6; $i >= 0; $i--) {
            $date = now()->subDays($i)->format('Y-m-d');
            $last7Days[$date] = $daily[$date] ?? 0;
        }

        return response()->json([
            'users' => $users,
            'consultations' => $consultations,
            'severity_breakdown' => $severityBreakdown,
            'last_7_days' => $last7Days,
        ]);
    }
}
