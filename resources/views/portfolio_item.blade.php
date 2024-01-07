@extends('layouts.app')
@section('title', $project['name'])
@section('content')
    <style>
        .portfolio-item {
            margin: 0 auto;
            max-width: 800px;
            padding: 20px;
            box-shadow: 0 0 10px rgba(0, 0, 0, 0.1);
            background-color: #fff;
        }

        .portfolio-image {
            max-width: 100%;
            height: auto;
            display: block;
            margin: 0 auto;
        }

        .portfolio-link {
            display: inline-block;
            margin-top: 20px;
            padding: 10px 20px;
            background-color: #007bff;
            color: white;
            text-decoration: none;
            border-radius: 5px;
            transition: background-color 0.3s ease-in-out;
        }

        .portfolio-link:hover {
            background-color: #0056b3;
        }
    </style>
    <div class="container">
        <div class="portfolio-item">
            <h2>{{ $project['name'] }}</h2>
            <img src="{{ $project['image'] }}" alt="{{ $project['name'] }}" class="portfolio-image">
            <div class="portfolio-description">
                <p>{{ $project['description'] }}</p>
                @if ($project['link'])
                    <a href="{{ $project['link'] }}" class="portfolio-link">View Project</a>
                @endif
            </div>
        </div>
    </div>
@endsection
