<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Http;

class FaceRecognition extends Controller
{
    public function analyze(Request $request)
    {
        $request->validate([
            'photo' => 'required',
        ]);

        $photo = $request->input('photo');

        $response = Http::post('https://faceai.abdulme.link/compare', [
            'multipart' => [
                [
                    'name'     => 'photo',
                    'contents' => $photo
                ]
            ]
        ]);

        $body = $response->getBody();
        $data = json_decode($body, true);

        return response()->json($data);
    }
}
