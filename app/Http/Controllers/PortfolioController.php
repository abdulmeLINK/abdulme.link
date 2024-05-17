<?php

namespace App\Http\Controllers;

use App\Models\Portfolio;

class PortfolioController extends Controller
{
    public function index()
    {
        $projects = Portfolio::all();

        $texts = (object)[
            'name' => 'Abdulmelik Saylan',
            'welcome_message' => 'Welcome to my portfolio',
            'project_description' => 'Here are some of my projects',
        ];

        return view('portfolio', ['projects' => $projects, 'texts' => $texts]);
    }

    public function show($name)
    {
        $project = Portfolio::where('name', $name)->first();

        if ($project) {
            return view('portfolio_item', ['project' => $project]);
        }

        return abort(404, 'Project not found');
    }
}
