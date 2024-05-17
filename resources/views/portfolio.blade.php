@extends('layouts.app')

@section('title', 'Portfolio')

@section('content')
    <!-- Your styles here -->

    <header class="masthead text-center text-white d-flex">
        <div class="container my-auto">
            <div class="row">
                <div class="col-lg-10 mx-auto">
                    <div class="profile-image">
                        <img src="https://thispersondoesnotexist.com/" alt="{{ $texts->name }}">
                    </div>
                    <h1 class="text-uppercase">
                        <strong>{{ $texts->welcome_message }}</strong>
                    </h1>
                    <hr>
                </div>
                <div class="col-lg-8 mx-auto">
                    <p class="text-faded mb-5">{{ $texts->project_description }}</p>
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
                                <img src="{{ $project->image }}" class="card-img-top" alt="{{ $project->name }}">
                                <div class="card-body">
                                    <h5 class="card-title">{{ $project->name }}</h5>
                                    <p class="card-text">{{ $project->description }}</p>
                                    @if ($project->link)
                                        <a href="{{ $project->link }}" class="btn btn-primary">View Project</a>
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
