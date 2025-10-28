<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class UpdatePreferencesRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        return true; // No authentication required for demo
    }

    /**
     * Get the validation rules that apply to the request.
     */
    public function rules(): array
    {
        return [
            'category' => 'required|string|in:general,appearance,desktop,dock,terminal,accessibility',
            'key' => 'required|string|max:50',
            'value' => 'required',
            'preferences' => 'sometimes|array',
            'preferences.*' => 'required',
        ];
    }

    /**
     * Get custom error messages for validation rules.
     */
    public function messages(): array
    {
        return [
            'category.in' => 'The category must be one of: general, appearance, desktop, dock, terminal, accessibility',
            'key.max' => 'The preference key cannot exceed 50 characters',
        ];
    }
}