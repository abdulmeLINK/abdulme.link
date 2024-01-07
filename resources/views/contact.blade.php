@extends('layouts.app')

@section('title', 'Contact')

@section('content')
    <style>
        .card {
            margin: 20px;
            box-shadow: 0 0 10px rgba(0, 0, 0, 0.1);
            transition: transform 0.3s ease-in-out;
            padding: 5%;
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
    <div class="container">
        <div class="row justify-content-center">
            <div class="col-md-8">
                <div class="card">
                    <div class="card-header">{{ __('Contact Us') }}</div>

                    <div class="card-body">
                        @if (session('success'))
                            <div class="alert alert-success" role="alert">
                                {{ session('success') }}
                            </div>
                        @endif

                        <form method="POST" action="{{ url('/contact') }}">
                            @csrf

                            <div class="form-group row">
                                <label for="name"
                                    class="col-md-4 col-form-label text-md-right">{{ __('Name') }}</label>

                                <div class="col-md-6">
                                    <input id="name" type="text"
                                        class="form-control @error('name') is-invalid @enderror" name="name"
                                        value="{{ old('name') }}" required autocomplete="name" autofocus>

                                    @error('name')
                                        <span class="invalid-feedback" role="alert">
                                            <strong>{{ $message }}</strong>
                                        </span>
                                    @enderror
                                </div>
                            </div>

                            <div class="form-group row">
                                <label for="email"
                                    class="col-md-4 col-form-label text-md-right">{{ __('E-Mail Address') }}</label>

                                <div class="col-md-6">
                                    <input id="email" type="email"
                                        class="form-control @error('email') is-invalid @enderror" name="email"
                                        value="{{ old('email') }}" required autocomplete="email">

                                    @error('email')
                                        <span class="invalid-feedback" role="alert">
                                            <strong>{{ $message }}</strong>
                                        </span>
                                    @enderror
                                </div>
                            </div>

                            <div class="form-group row">
                                <label for="message"
                                    class="col-md-4 col-form-label text-md-right">{{ __('Message') }}</label>

                                <div class="col-md-6">
                                    <textarea id="message" class="form-control @error('message') is-invalid @enderror" name="message" required>{{ old('message') }}</textarea>

                                    @error('message')
                                        <span class="invalid-feedback" role="alert">
                                            <strong>{{ $message }}</strong>
                                        </span>
                                    @enderror
                                </div>
                            </div>

                            <div class="form-group row">
                                <div class="col-md-6 offset-md-4">
                                    <div class="g-recaptcha" data-sitekey="{{ env('GOOGLE_RECAPTCHA_SITE_KEY') }}"></div>

                                    @error('g-recaptcha-response')
                                        <span class="invalid-feedback" role="alert">
                                            <strong>{{ $message }}</strong>
                                        </span>
                                    @enderror
                                </div>
                            </div>

                            <div class="form-group row mb-0">
                                <div class="col-md-8 offset-md-4">
                                    <button type="submit" class="btn btn-primary">
                                        {{ __('Send Message') }}
                                    </button>
                                </div>
                            </div>
                        </form>
                    </div>
                </div>
            </div>
        </div>
    </div>
@endsection
