<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class FaceRecognition extends Controller
{
    public function analyze(Request $request)
    {
        // Check if a file was uploaded
        if ($request->hasFile('photo')) {
            // Get the file from the request
            $photo = $request->file('photo');

            // The URL of the face recognition service
            $url = 'https://faceai.abdulme.link/compare';

            // The body of the request
            $body = [
                'photo' => fopen($photo->getPathname(), 'r')
            ];

            // Make the request
            $start_time = microtime(true);

            $response = Http::asMultipart()->timeout(120)->post($url, $body);

            $end_time = microtime(true);

            // Log the response
            Log::info('Response:', ['body' => $response->body()]);

            // Log the response time
            Log::info('Response time: ' . ($end_time - $start_time) . ' seconds');

            // Decode the JSON response
            $data = json_decode($response->body(), true);

            // Log the decoded data
            Log::info('Decoded data:', $data);

            // Return the matches
            return response()->json(['matches' => $data['matches']]);
        } else {
            // Log an error message
            Log::error('No photo uploaded');

            // Return an error response
            return response()->json(['error' => 'No photo uploaded']);
        }
    }
}
