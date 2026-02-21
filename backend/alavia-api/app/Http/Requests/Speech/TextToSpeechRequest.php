<?php

namespace App\Http\Requests\Speech;

use Illuminate\Foundation\Http\FormRequest;

class TextToSpeechRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'text' => ['required', 'string', 'max:5000'],
            'language' => ['required', 'string', 'max:10'],
            'voice' => ['required', 'string', 'max:50'],
        ];
    }
}
