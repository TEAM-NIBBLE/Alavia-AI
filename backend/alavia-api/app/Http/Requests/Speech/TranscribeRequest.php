<?php

namespace App\Http\Requests\Speech;

use Illuminate\Foundation\Http\FormRequest;

class TranscribeRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'audio' => ['required', 'file', 'max:25600'],
            'language' => ['nullable', 'string', 'max:10'],
        ];
    }
}
