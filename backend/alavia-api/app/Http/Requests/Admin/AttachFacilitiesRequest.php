<?php

namespace App\Http\Requests\Admin;

use Illuminate\Foundation\Http\FormRequest;

class AttachFacilitiesRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'facilities' => ['required', 'array', 'min:1'],
            'facilities.*' => ['string', 'max:255'],
        ];
    }
}
