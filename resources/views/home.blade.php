@extends('layouts.app')

@section('title', 'Home')

@section('content')
    <header class="masthead text-center text-white d-flex">
        <div class="container my-auto">
            <div class="row">
                <div class="col-lg-10 mx-auto">
                    <div class="profile-image">
                        <img src="https://thispersondoesnotexist.com/" alt="Abdulmelik Saylan">
                    </div>
                    <h1 class="text-uppercase">
                        <strong>Welcome to Abdulmelik Saylan's Website</strong>
                    </h1>
                    <hr>
                </div>
                <div class="col-lg-8 mx-auto">
                    <p class="text-faded mb-5">A Software Engineering student interested in multiple areas and software
                        architectures</p>
                    <a class="btn btn-primary btn-xl" href="#about">Find Out More</a>
                </div>
            </div>
        </div>
    </header>

    <section class="bg-primary" id="about">
        <div class="container">
            <div class="row">
                <div class="col-lg-8 mx-auto text-center">
                    <h2 class="section-heading text-white">About Me</h2>
                    <hr class="light my-4">
                    <p class="text-faded mb-4">I am a Software Engineering student interested in multiple areas and software
                        architectures. I love to learn and explore new technologies.</p>
                    <a class="btn btn-light btn-xl" href="#services">Get Started!</a>
                </div>
            </div>
        </div>
    </section>

    <section id="services">
        <div class="container">
            <div class="row">
                <div class="col-lg-8 mx-auto text-center">
                    <h2 class="section-heading">What I Do</h2>
                    <hr class="my-4">
                    <p class="mb-4">I am interested in multiple areas and software architectures. I love to learn and
                        explore new technologies.</p>
                </div>
            </div>
        </div>
    </section>

    <section class="bg-dark text-white" id="contact">
        <div class="container">
            <div class="row">
                <div class="col-lg-8 mx-auto text-center">
                    <h2 class="section-heading">Let's Get In Touch!</h2>
                    <hr class="my-4">
                    <p class="mb-5">Ready to start your next project with me? Fill out the form below and I will get back
                        to you as soon as possible!</p>
                </div>
            </div>
            <div class="row">
                <div class="col-lg-8 mx-auto">
                    <form>
                        <div class="form-group">
                            <input type="text" class="form-control" placeholder="Your Name">
                        </div>
                        <div class="form-group">
                            <input type="email" class="form-control" placeholder="Your Email">
                        </div>
                        <div class="form-group">
                            <textarea class="form-control" rows="3" placeholder="Your Message"></textarea>
                        </div>
                        <button type="submit" class="btn btn-primary btn-xl">Send Message</button>
                    </form>
                </div>
            </div>
        </div>
    </section>
@endsection
