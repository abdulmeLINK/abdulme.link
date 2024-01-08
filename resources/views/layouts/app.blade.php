<!DOCTYPE html>
<html lang="en">

<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>@yield('title') - Abdulmelik Saylan</title>
    <link href="{{ asset('resources/css/app.css') }}" media="all" rel="stylesheet" type="text/css" />
    <script type="module" src="{{ asset('resources/js/app.js') }}"></script>
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/5.15.3/css/all.min.css">
    <link href="https://fonts.googleapis.com/css2?family=Roboto:wght@400;700&display=swap" rel="stylesheet">
    <script src="https://code.jquery.com/jquery-3.5.1.slim.min.js"></script>
    <script src="https://stackpath.bootstrapcdn.com/bootstrap/4.5.2/js/bootstrap.min.js"></script>
    @vite(['resources/css/app.css', 'resources/js/app.js'])


</head>

<body>

    <nav class="navbar navbar-expand-lg navbar-dark bg-dark">
        <div class="container">
            <a class="navbar-brand" href="#">Abdulmelik Saylan</a>
            <button class="navbar-toggler" type="button" data-toggle="collapse" data-target="#navbarNav"
                aria-controls="navbarNav" aria-expanded="false" aria-label="Toggle navigation">
                <span class="navbar-toggler-icon"></span>
            </button>
            <div class="collapse navbar-collapse" id="navbarNav">
                <ul class="navbar-nav ml-auto">
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
                    <li class="nav-item">
                        <a class="nav-link" href="https://github.com/abdulmeLINK" target="_blank"><i
                                class="fab fa-github"></i></a>
                    </li>
                    <li class="nav-item">
                        <a class="nav-link" href="https://huggingface.co/abdulmeLINK" target="_blank">🤗</a>
                    </li>
                    <li class="nav-item">
                        <a class="nav-link" href="https://www.linkedin.com/in/abdulmelik-saylan-889096228"
                            target="_blank"><i class="fab fa-linkedin"></i></a>
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
<script>
    const themeSwitch = document.getElementById('themeSwitch');
    const themeLabel = document.querySelector('label[for="themeSwitch"]');
    const navbar = document.querySelector('.navbar');
    const footer = document.querySelector('footer');
    const themeTexts = document.querySelectorAll('.theme-text');
    const currentTheme = localStorage.getItem('theme');

    function switchTheme(theme) {
        document.documentElement.setAttribute('data-theme', theme);
        navbar.classList.remove('navbar-light', 'navbar-dark', 'bg-light', 'bg-dark');
        navbar.classList.add(theme === 'light' ? 'navbar-light' : 'navbar-dark');
        navbar.classList.add(theme === 'light' ? 'bg-light' : 'bg-dark');
        footer.classList.remove('bg-light', 'bg-dark');
        footer.classList.add(theme === 'light' ? 'bg-light' : 'bg-dark');
        themeTexts.forEach(el => {
            el.classList.remove('text-light', 'text-dark');
            el.classList.add(theme === 'light' ? 'text-dark' : 'text-light');
        });
    }

    if (currentTheme) {
        switchTheme(currentTheme);
        if (currentTheme === 'light') {
            themeSwitch.checked = true;
            themeLabel.textContent = 'Light Mode';
        }
    }

    themeSwitch.addEventListener('change', function(event) {
        let theme = 'dark';
        let mode = 'Dark Mode';

        if (event.target.checked) {
            theme = 'light';
            mode = 'Light Mode';
        }

        themeLabel.textContent = mode;
        switchTheme(theme);
        localStorage.setItem('theme', theme);
    });
</script>

</html>
