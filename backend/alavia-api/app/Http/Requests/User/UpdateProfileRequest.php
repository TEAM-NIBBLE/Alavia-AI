<?php

namespace App\Http\Requests\User;

use Illuminate\Foundation\Http\FormRequest;

class UpdateProfileRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'name' => ['sometimes', 'string', 'max:255'],
            'phone' => ['sometimes', 'nullable', 'string', 'max:30', 'unique:users,phone,' . $this->user()->id],
            'language' => ['sometimes', 'in:EN,PIDGIN,YORUBA,HAUSA,IGBO'],
            'emergency_contact_name' => ['sometimes', 'nullable', 'string', 'max:255'],
            'emergency_contact_phone' => ['sometimes', 'nullable', 'string', 'max:30'],
            'emergency_contacts' => ['sometimes', 'nullable', 'array', 'max:5'],
            'emergency_contacts.*.name' => ['required', 'string', 'max:255'],
            'emergency_contacts.*.phone' => ['required', 'string', 'max:30'],
            'emergency_contacts.*.relation' => ['nullable', 'string', 'max:100'],
        ];
    }
}
