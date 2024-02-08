<!DOCTYPE html>
<html lang="en">

<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>@yield('title') - Abdulmelik Saylan</title>
    <link href="{{ asset('css/app.css') }}" media="all" rel="stylesheet" type="text/css" />
    <link href="{{ asset('css/vendor.css') }}"  rel="stylesheet" type="text/css" />
    <script type="module" src="{{ asset('js/app.js') }}"></script>
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/5.15.3/css/all.min.css">
    <link href="https://fonts.googleapis.com/css2?family=Roboto:wght@400;700&display=swap" rel="stylesheet">
    <script src="https://code.jquery.com/jquery-3.7.1.min.js"></script>
    <script src="https://code.jquery.com/ui/1.13.2/jquery-ui.min.js"></script>
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/jqueryui/1.13.2/themes/base/jquery-ui.min.css" integrity="sha512-ELV+xyi8IhEApPS/pSj66+Jiw+sOT1Mqkzlh8ExXihe4zfqbWkxPRi8wptXIO9g73FSlhmquFlUOuMSoXz5IRw==" crossorigin="anonymous" referrerpolicy="no-referrer" />

</head>

<body>
    
    <nav class="navbar navbar-expand-md navbar-dark bg-dark mac-navbar">
        <div class="dropdown ml-md-2  flex-column flex-md-row" style="margin-left: 20px">
            <a class="navbar-brand dropdown-toggle" href="#" id="navbarDropdown" role="button" data-bs-toggle="dropdown" aria-expanded="false">
                Abdulmelik Saylan
            </a>
    
            <ul class="dropdown-menu" aria-labelledby="navbarDropdown">
                <li class="nav-item">
                    <a class="nav-link" href="https://github.com/abdulmeLINK" target="_blank"><i class="fab fa-github"></i> Github</a>
                </li>
                <li class="nav-item">
                    <a class="nav-link" href="https://huggingface.co/abdulmeLINK" target="_blank">🤗 HuggingFace</a>
                </li>
                <li class="nav-item">
                    <a class="nav-link" href="https://www.linkedin.com/in/abdulmelik-saylan-889096228" target="_blank"><i class="fab fa-linkedin"></i> LinkedIn</a>
                </li>
            </ul>
        </div>
        <div class="container d-flex justify-content-start flex-column flex-md-row">
           
            <div class="navbar-collapse collapse w-100 order-1 order-md-0 dual-collapse2" id="navbarNav">
                <ul class="navbar-nav mr-auto">
                    <li class="nav-item {{ Request::is('/') ? 'active' : '' }}">
                        <a class="nav-link" href="/">Home</a>
                    </li>
                    <li class="nav-item {{ Request::is('about') ? 'active' : '' }}">
                        <a class="nav-link" href="/about">About</a>
                    </li>
                    <li class="nav-item {{ Request::is('portfolio') ? 'active' : '' }}">
                        <a class="nav-link" href="/portfolio">Portfolio</a>
                    </li>
                    <li class="nav-item {{ Request::is('contact') ? 'active' : '' }}">
                        <a class="nav-link" href="/contact">Contact</a>
                    </li>
                  
                </ul>
            </div>
          
        </div>

    </nav>

    @yield('content')

</body>


<footer class="bg-light text-center text-lg-start text-theme">
    <div class="container p-4">
        <div class="row">
            <div class="col-lg-6 col-md-12 mb-4 mb-md-0">
                <h5 class="text-uppercase theme-text">About Me</h5>
                <p class="theme-text">
                    I am a Software Engineering student interested in multiple areas and software architectures. I love
                    to learn and explore new technologies.
                </p>
                <div class="form-check form-switch">
                    <input class="form-check-input" type="checkbox" id="themeSwitch">
                    <label class="form-check-label theme-text" for="themeSwitch">Dark Mode</label>
                </div>
            </div>
            <div class="col-lg-3 col-md-6 mb-4 mb-md-0">
                <h5 class="text-uppercase theme-text">Links</h5>
                <ul class="list-unstyled mb-0">
                    <li>
                        <a href="#!" class="theme-text">Link 1</a>
                    </li>
                    <li>
                        <a href="#!" class="theme-text">Link 2</a>
                    </li>
                    <li>
                        <a href="#!" class="theme-text">Link 3</a>
                    </li>
                    <li>
                        <a href="#!" class="theme-text">Link 4</a>
                    </li>
                </ul>
            </div>
            <div class="col-lg-3 col-md-6 mb-4 mb-md-0">

                <h5 class="text-uppercase theme-text">Contact</h5>
                <ul class="list-unstyled mb-0">
                    <li>
                        <a href="#!" class="theme-text">Email</a>
                    </li>
                    <li>
                        <a href="#!" class="theme-text">Phone</a>
                    </li>
                </ul>
            </div>
        </div>
    </div>
    <div class="text-center p-3 theme-text" style="background-color: rgba(0, 0, 0, 0.2);">
        © 2024 Abdulmelik Saylan
    </div>
</footer>

</html>
