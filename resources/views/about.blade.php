@extends('layouts.app')

@section('title', $about->title)

@section('content')
    <header class="masthead text-center text-white d-flex">
        <div class="container my-auto">
            <div class="row">
                <div class="col-lg-10 mx-auto">
                    <h1 class="text-uppercase">
                        <strong>About {{ $about->name }}</strong>
                    </h1>
                    <hr>
                </div>
            </div>
        </div>
    </header>

    <section id="about">
        <div class="container">
            <div class="row">
                <div class="col-lg-6 mx-auto text-center">
                    <img class="profile-image" src="https://thispersondoesnotexist.com/" alt="{{ $about->name }}">
                </div>
                <div class="col-lg-6 mx-auto">
                    <h2 class="section-heading">Who Am I?</h2>
                    <p class="mb-4">{{ $about->description }}</p>
                </div>
            </div>
        </div>
    </section>

    <section class="bg-primary" id="journey">
        <div class="container">
            <div class="row">
                <div class="col-lg-8 mx-auto text-center">
                    <h2 class="section-heading text-white">My Journey</h2>
                    <hr class="light my-4">
                    <p class="text-faded mb-4">{{ $about->journeyDescription }}</p>
                </div>
            </div>
            <div class="row">
                <div class="roadmap">
                    @foreach ($about->journey as $point)
                        <div class="roadmap-point" data-anim="hide">{{ $point }}</div>
                    @endforeach
                </div>
            </div>
        </div>
    </section>

    <section id="skills">
        <div class="container">
            <div class="row">
                <div class="col-lg-8 mx-auto text-center">
                    <h2 class="section-heading">My Skills</h2>
                    <hr class="my-4">
                    <p class="mb-4">{{ $about->skill_description }}</p>
                </div>
            </div>
            @foreach ($skills as $skill)
                <div class="col-lg-3 col-md-6 text-center">
                    <div class="mt-5">
                        <i class="fas fa-4x {{ $skill->icon }} text-primary mb-4"></i>
                        <h3 class="h4 mb-2">{{ $skill->name }}</h3>
                        <p class="theme-text mb-0">{{ $skill->description }}</p>
                    </div>
                </div>
            @endforeach
        </div>
    </section>
@endsection
