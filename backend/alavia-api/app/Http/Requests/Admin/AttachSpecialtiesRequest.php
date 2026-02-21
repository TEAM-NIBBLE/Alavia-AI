<?php

namespace App\Http\Requests\Admin;

use Illuminate\Foundation\Http\FormRequest;

class AttachSpecialtiesRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'specialties' => ['required', 'array', 'min:1'],
            'specialties.*' => ['string', 'max:255'],
        ];
    }
}
