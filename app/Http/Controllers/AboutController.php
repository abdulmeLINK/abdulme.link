<?php

namespace App\Http\Controllers;

use App\Models\About;
use Illuminate\Http\Request;

class AboutController extends Controller
{


    public function index_api()
    {
        $activeAbout = About::where('is_active', 1)->first();
        $skills = $activeAbout->skills;
        return response()->json(['about' => $activeAbout, 'skills' => $skills]);
    }

    public function index()
    {
        $activeAbout = About::where('is_active', 1)->first();
        $skills = $activeAbout->skills;
        return view('about', ['about' => $activeAbout, 'skills' => $skills]);
    }
}
