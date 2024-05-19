<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use GuzzleHttp\Client;
use Illuminate\Support\Facades\Log;
use GuzzleHttp\Cookie\CookieJar;

class FaceRecognition extends Controller
{
    public function analyze()
    {
        // The path to the image in the storage directory
        $imagePath = storage_path('public/1716082490.png');

        // The URL of the face recognition service
        $url = 'https://faceai.abdulme.link/compare';

        // Open the file in binary mode
        $file = curl_file_create($imagePath);

        // The body of the request
        $body = [
            'photo' => $file
        ];

        // Initialize cURL
        $ch = curl_init();

        // Set the options
        curl_setopt($ch, CURLOPT_URL, $url);
        curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
        curl_setopt($ch, CURLOPT_POST, true);
        curl_setopt($ch, CURLOPT_POSTFIELDS, $body);
        curl_setopt($ch, CURLOPT_TIMEOUT, 120);

        // Make the request
        $start_time = microtime(true);
        $response = curl_exec($ch);
        $end_time = microtime(true);

        // Close the cURL resource
        curl_close($ch);


        // Print the response
        Log::info('Response:', ['response' => $response]);

        // Print the response time
        Log::info('Response time: ' . ($end_time - $start_time) . ' seconds', []);


        $data = json_decode($response, true);

        // Check if $data is not null and contains a 'matches' key
        if ($data !== null && isset($data['matches'])) {
            // Return the matches
            return response()->json(['matches' => $data['matches']]);
        } else {
            // Return an error response
            return response()->json(['error' => 'Invalid response from face recognition service']);
        }
    }
}
