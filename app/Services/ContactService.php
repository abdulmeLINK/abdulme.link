<?php

namespace App\Services;

use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\Validator;

/**
 * ContactService - Manages contact form submissions
 * 
 * Handles form validation, email sending, spam protection,
 * and submission logging
 */
class ContactService
{
    protected array $contactInfo;
    protected int $maxSubmissionsPerHour = 3;

    /**
     * Constructor
     */
    public function __construct()
    {
        $this->loadContactInfo();
    }

    /**
     * Load contact information
     */
    protected function loadContactInfo(): void
    {
        $this->contactInfo = [
            'email' => env('CONTACT_EMAIL', 'abdulmeliksaylan@gmail.com'),
            'phone' => 'Request using email',
            'location' => 'Turkey',
            'responseTime' => '24 hours',
            'availability' => 'Available for work',
        ];
    }

    /**
     * Get contact information with metadata
     */
    public function getContactInfo(): array
    {
        return [
            'contact' => $this->contactInfo,
            '_metadata' => [
                'version' => '1.0.0',
                'lastUpdated' => now()->toIso8601String(),
                'source' => 'contact'
            ]
        ];
    }

    /**
     * Validate contact form data
     */
    public function validateSubmission(array $data): array
    {
        $validator = Validator::make($data, [
            'name' => 'required|string|min:2|max:100',
            'email' => 'required|email|max:255',
            'subject' => 'required|string|min:5|max:200',
            'message' => 'required|string|min:20|max:1000',
            'captcha' => 'nullable|string',
        ]);

        if ($validator->fails()) {
            return [
                'valid' => false,
                'errors' => $validator->errors()->toArray()
            ];
        }

        return ['valid' => true, 'data' => $validator->validated()];
    }

    /**
     * Submit contact form
     */
    public function submitForm(array $data): array
    {
        try {
            // Validate data
            $validation = $this->validateSubmission($data);
            
            if (!$validation['valid']) {
                return [
                    'success' => false,
                    'message' => 'Validation failed',
                    'errors' => $validation['errors']
                ];
            }

            $validatedData = $validation['data'];

            // Check rate limiting (basic implementation)
            if (!$this->checkRateLimit($data['email'] ?? '')) {
                return [
                    'success' => false,
                    'message' => 'Too many submissions. Please try again later.'
                ];
            }

            // Submit to Supabase Edge Function
            $supabaseResult = $this->submitToSupabase($validatedData);
            
            if (!$supabaseResult['success']) {
                Log::error('Supabase submission failed', $supabaseResult);
                return [
                    'success' => false,
                    'message' => 'Failed to save your message. Please try again later.'
                ];
            }

            // Log submission locally
            $this->logSubmission($validatedData);

            // Send notification email (optional)
            $this->sendContactEmail($validatedData);

            return [
                'success' => true,
                'message' => 'Thank you! Your message has been sent successfully.',
                'responseTime' => $this->contactInfo['responseTime'],
                'submissionId' => $supabaseResult['id'] ?? null
            ];

        } catch (\Exception $e) {
            Log::error('Contact form submission failed: ' . $e->getMessage());
            
            return [
                'success' => false,
                'message' => 'Failed to send message. Please try again later.'
            ];
        }
    }

    /**
     * Submit contact form data to Supabase Edge Function
     * 
     * Authentication Strategy:
     * - Uses SUPABASE_ANON_KEY (public key) for contact submissions
     * - No user authentication required (public form)
     * - Rate limiting handled at application level
     * - Edge function validates and sanitizes input
     * - Supabase RLS policies allow service_role to insert
     * 
     * @param array $data Validated form data
     * @return array Result with success status and submission ID
     */
    protected function submitToSupabase(array $data): array
    {
        try {
            $supabaseUrl = env('SUPABASE_URL');
            $supabaseKey = env('SUPABASE_ANON_KEY'); // Using anon key - no user auth needed
            $edgeFunctionUrl = env(
                'SUPABASE_EDGE_FUNCTION_URL', 
                $supabaseUrl . '/functions/v1/contact-submission'
            );

            if (!$supabaseUrl || !$supabaseKey) {
                Log::warning('Supabase credentials not configured');
                return ['success' => false, 'error' => 'Configuration missing'];
            }

            // Prepare payload
            $payload = [
                'name' => $data['name'],
                'email' => $data['email'],
                'subject' => $data['subject'],
                'message' => $data['message'],
                'submitted_at' => now()->toIso8601String(),
                'user_agent' => request()->userAgent(),
                'ip_address' => request()->ip(),
            ];

            // Make HTTP request to edge function
            $ch = curl_init($edgeFunctionUrl);
            curl_setopt_array($ch, [
                CURLOPT_RETURNTRANSFER => true,
                CURLOPT_POST => true,
                CURLOPT_POSTFIELDS => json_encode($payload),
                CURLOPT_HTTPHEADER => [
                    'Content-Type: application/json',
                    'Authorization: Bearer ' . $supabaseKey,
                ],
                CURLOPT_TIMEOUT => 10,
            ]);

            $response = curl_exec($ch);
            $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
            $error = curl_error($ch);
            curl_close($ch);

            if ($error) {
                Log::error('Supabase cURL error: ' . $error);
                return ['success' => false, 'error' => $error];
            }

            if ($httpCode !== 200) {
                Log::error('Supabase HTTP error: ' . $httpCode, ['response' => $response]);
                return ['success' => false, 'error' => 'HTTP ' . $httpCode];
            }

            $result = json_decode($response, true);
            
            return [
                'success' => true,
                'id' => $result['id'] ?? null,
                'data' => $result
            ];

        } catch (\Exception $e) {
            Log::error('Supabase submission exception: ' . $e->getMessage());
            return ['success' => false, 'error' => $e->getMessage()];
        }
    }

    /**
     * Send contact email
     */
    protected function sendContactEmail(array $data): void
    {
        // In production, implement actual email sending
        // For now, just log it
        Log::info('Contact form submission:', $data);
        
        // Example email sending (uncomment in production):
        /*
        Mail::send('emails.contact', $data, function ($message) use ($data) {
            $message->to($this->contactInfo['email'])
                    ->subject('New Contact Form: ' . $data['subject'])
                    ->replyTo($data['email'], $data['name']);
        });
        */
    }

    /**
     * Log submission for analytics
     */
    protected function logSubmission(array $data): void
    {
        $logData = [
            'timestamp' => now(),
            'name' => $data['name'],
            'email' => $data['email'],
            'subject' => $data['subject'],
            'ip' => request()->ip(),
        ];

        Log::channel('daily')->info('Contact submission', $logData);
    }

    /**
     * Check rate limiting (basic implementation)
     */
    protected function checkRateLimit(string $email): bool
    {
        // In production, use Redis or cache for proper rate limiting
        // For now, always return true
        return true;
    }

    /**
     * Get social media links
     */
    public function getSocialLinks(): array
    {
        return [
            'github' => 'https://github.com/abdulmelik',
            'linkedin' => 'https://linkedin.com/in/abdulmelik',
            'twitter' => '',
            'dribbble' => '',
        ];
    }
}
