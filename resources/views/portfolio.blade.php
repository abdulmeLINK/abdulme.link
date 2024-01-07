@extends('layouts.app')

@section('title', 'Portfolio')

@section('content')
    <style>
        body {
            font-family: Arial, sans-serif;
            margin: 0;
            padding: 0;
        }

        header {
            background-color: #333;
            color: #fff;
            padding: 20px;
        }

        nav ul {
            list-style: none;
            margin: 0;
            padding: 0;
        }

        nav li {
            display: inline-block;
            margin-right: 20px;
        }

        nav a {
            color: #fff;
            text-decoration: none;
        }

        main {
            margin: 20px;
        }

        section {
            margin-bottom: 20px;
        }

        h1,
        h2,
        h3 {
            font-weight: normal;
        }

        footer {
            background-color: #333;
            color: #fff;
            padding: 20px;
            text-align: center;
        }

        .project-list {
            display: flex;
            flex-wrap: wrap;
            justify-content: center;
        }

        .card {
            margin: 20px;
            box-shadow: 0 0 10px rgba(0, 0, 0, 0.1);
            transition: transform 0.3s ease-in-out;
        }

        .card:hover {
            transform: translateY(-10px);
        }

        .card-img-top {
            height: 200px;
            object-fit: cover;
        }

        .card-title {
            margin-top: 10px;
        }

        .card-text {
            margin-bottom: 10px;
        }

        .btn-primary {
            background-color: #333;
            border-color: #333;
        }

        .btn-primary:hover {
            background-color: #fff;
            color: #333;
        }

        [data-theme="dark"] {
            --color-bg: #121212;
            --color-fg: #f5f5f5;
            --color-nav: #121212;
            --color-nav-item: #f5f5f5;
            --color-nav-item-hover: #f96d00;
            --color-btn: #f96d00;
        }

        [data-theme="dark"] .card {
            background-color: #333;
            color: #fff;
            box-shadow: 0 0 10px rgba(255, 255, 255, 0.1);
        }

        [data-theme="dark"] .card:hover {
            transform: translateY(-10px);
            box-shadow: 0 0 10px rgba(255, 255, 255, 0.3);
        }

        [data-theme="dark"] .card-title,
        [data-theme="dark"] .card-text {
            color: #fff;
        }

        [data-theme="dark"] .btn-primary {
            background-color: #f96d00;
            border-color: #f96d00;
        }

        [data-theme="dark"] .btn-primary:hover {
            background-color: #fff;
            color: #f96d00;
        }
    </style>
    <header class="masthead text-center text-white d-flex">
        <div class="container my-auto">
            <div class="row">
                <div class="col-lg-10 mx-auto">
                    <div class="profile-image">
                        <img src="https://thispersondoesnotexist.com/" alt="Abdulmelik Saylan">
                    </div>
                    <h1 class="text-uppercase">
                        <strong>Welcome to Abdulmelik Saylan's Portfolio</strong>
                    </h1>
                    <hr>
                </div>
                <div class="col-lg-8 mx-auto">
                    <p class="text-faded mb-5">Here are some of my projects.</p>
                </div>
            </div>
        </div>
    </header>

    <section class="bg-primary" id="projects">
        <div class="container">
            <div class="row">
                <div class="col-lg-8 mx-auto text-center">
                    <h2 class="section-heading text-white">Projects</h2>
                    <hr class="light my-4">
                    <div class="project-list">
                        @foreach ($projects as $project)
                            <div class="card" style="width: 18rem;">
                                <img src="{{ $project['image'] }}" class="card-img-top" alt="{{ $project['name'] }}">
                                <div class="card-body">
                                    <h5 class="card-title">{{ $project['name'] }}</h5>
                                    <p class="card-text">{{ $project['description'] }}</p>
                                    @if ($project['link'])
                                        <a href="{{ $project['link'] }}" class="btn btn-primary">View Project</a>
                                    @endif
                                </div>
                            </div>
                        @endforeach
                    </div>
                </div>
            </div>
        </div>
    </section>
@endsection
