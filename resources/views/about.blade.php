@extends('layouts.app')

@section('title', 'About Me')

@section('content')
    <header class="masthead text-center text-white d-flex">
        <div class="container my-auto">
            <div class="row">
                <div class="col-lg-10 mx-auto">
                    <h1 class="text-uppercase">
                        <strong>About Abdulmelik Saylan</strong>
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
                    <img class="profile-image" src="https://thispersondoesnotexist.com/" alt="Abdulmelik Saylan">
                </div>
                <div class="col-lg-6 mx-auto">
                    <h2 class="section-heading">Who Am I?</h2>
                    <p class="mb-4">I am Abdulmelik Saylan, a Software Engineering student with a passion for learning and
                        exploring new technologies. My interests span multiple areas and software architectures, and I am
                        always eager to expand my knowledge and skills.</p>
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
                    <p class="text-faded mb-4">I started my journey as a Software Engineering student with a keen interest
                        in technology. Over the years, I have gained experience in multiple areas and software
                        architectures, always striving to learn and explore new technologies. My journey has been filled
                        with challenges and opportunities, and I am excited about what the future holds.</p>
                </div>
            </div>
            <div class="row">
                <div class="roadmap">
                    <div class="roadmap-point" data-anim="hide">Start of My Journey</div>
                    <div class="roadmap-point" data-anim="hide">Exploring New Technologies</div>
                    <div class="roadmap-point" data-anim="hide">Looking Forward</div>
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
                    <p class="mb-4">As a Software Engineering student, I have developed a strong foundation in
                        programming, data structures, algorithms, and software design. I am proficient in multiple
                        programming languages and have experience with web development, database management, and cloud
                        computing. I am also familiar with machine learning and data analysis tools.</p>
                </div>
            </div>
            <div class="row">
                <div class="col-lg-3 col-md-6 text-center">
                    <div class="mt-5">
                        <i class="fas fa-4x fa-laptop-code text-primary mb-4"></i>
                        <h3 class="h4 mb-2">Web Development</h3>
                        <p class="theme-text mb-0">Experience with HTML, CSS, JavaScript, and PHP.</p>
                    </div>
                </div>
                <div class="col-lg-3 col-md-6 text-center">
                    <div class="mt-5">
                        <i class="fas fa-4x fa-database text-primary mb-4"></i>
                        <h3 class="h4 mb-2">Database Management</h3>
                        <p class="theme-text mb-0">Knowledge of SQL and experience with MySQL and PostgreSQL.</p>
                    </div>
                </div>
                <div class="col-lg-3 col-md-6 text-center">
                    <div class="mt-5">
                        <i class="fas fa-4x fa-cloud text-primary mb-4"></i>
                        <h3 class="h4 mb-2">Cloud Computing</h3>
                        <p class="theme-text mb-0">Experience with AWS and Google services.</p>
                    </div>
                </div>
                <div class="col-lg-3 col-md-6 text-center">
                    <div class="mt-5">
                        <i class="fas fa-4x fa-brain text-primary mb-4"></i>
                        <h3 class="h4 mb-2">Machine Learning</h3>
                        <p class="theme-text mb-0">Familiarity with machine learning algorithms and data analysis tools.</p>
                    </div>
                </div>
            </div>
        </div>
    </section>
@endsection
