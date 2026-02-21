<?php

namespace App\Http\Requests\Admin;

use Illuminate\Foundation\Http\FormRequest;

class HospitalUpdateRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'osm_type' => ['sometimes', 'in:node,way,relation'],
            'osm_id' => ['sometimes', 'integer'],
            'name' => ['sometimes', 'string', 'max:255'],
            'address' => ['sometimes', 'nullable', 'string', 'max:255'],
            'state' => ['sometimes', 'string', 'max:255'],
            'lga' => ['sometimes', 'nullable', 'string', 'max:255'],
            'lat' => ['sometimes', 'numeric'],
            'lng' => ['sometimes', 'numeric'],
            'rating' => ['sometimes', 'nullable', 'numeric', 'min:0', 'max:5'],
            'rating_count' => ['sometimes', 'nullable', 'integer', 'min:0'],
            'is_public' => ['sometimes', 'boolean'],
            'is_24_hours' => ['sometimes', 'boolean'],
            'emergency_ready' => ['sometimes', 'boolean'],
        ];
    }
}
