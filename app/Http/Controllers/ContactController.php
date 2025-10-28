<?php

namespace App\Http\Controllers;

use App\Services\ContactService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

/**
 * ContactController - Handles Contact API endpoints
 * 
 * Thin controller for contact form operations
 */
class ContactController extends Controller
{
    protected ContactService $contactService;

    public function __construct(ContactService $contactService)
    {
        $this->contactService = $contactService;
    }

    /**
     * Get contact information
     */
    public function index(): JsonResponse
    {
        try {
            $contactData = $this->contactService->getContactInfo();
            $socialLinks = $this->contactService->getSocialLinks();
            
            return response()->json([
                'success' => true,
                'data' => [
                    'contact' => $contactData['contact'] ?? $contactData,
                    'social' => $socialLinks
                ],
                '_metadata' => $contactData['_metadata'] ?? []
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to load contact information'
            ], 500);
        }
    }

    /**
     * Submit contact form
     */
    public function submit(Request $request): JsonResponse
    {
        try {
            $data = $request->all();
            $result = $this->contactService->submitForm($data);
            
            $statusCode = $result['success'] ? 200 : 422;
            
            return response()->json($result, $statusCode);
            
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to process submission'
            ], 500);
        }
    }

    /**
     * Validate form data without submitting
     */
    public function validateForm(Request $request): JsonResponse
    {
        try {
            $data = $request->all();
            $validation = $this->contactService->validateSubmission($data);
            
            return response()->json([
                'success' => $validation['valid'],
                'errors' => $validation['errors'] ?? []
            ]);
            
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Validation failed'
            ], 500);
        }
    }
}
