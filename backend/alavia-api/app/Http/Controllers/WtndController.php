<?php

namespace App\Http\Controllers;

use App\Services\WtndSymptomRetrieval;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class WtndController extends Controller
{
    public function search(Request $request, WtndSymptomRetrieval $retrieval): JsonResponse
    {
        $validated = $request->validate([
            'q' => 'required|string|max:200',
            'limit' => 'sometimes|integer|min:1|max:10',
        ]);

        return response()->json($retrieval->search(
            $validated['q'],
            (int) ($validated['limit'] ?? 5),
        ));
    }
}
