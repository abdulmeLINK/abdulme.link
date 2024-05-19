@extends('layouts.app')

@section('content')
    <div class="d-flex flex-column min-vh-100">
        <div class="container my-5 flex-grow-1">
            <div class="row justify-content-center">
                <div class="col-md-8">
                    <div class="card shadow">
                        <div class="card-header bg-primary text-white">
                            <h3 class="text-center my-0">Which celebrity are you?</h3>
                        </div>
                        <div class="card-body">
                            <form id="compareForm" action="{{ url('compare') }}" method="POST" enctype="multipart/form-data"
                                class="p-4">
                                @csrf
                                <div class="form-group mb-3">
                                    <label for="photo" class="form-label">Capture your photo:</label>
                                    <video id="video" width="320" height="240" autoplay></video>
                                    <button id="startbutton" class="btn btn-secondary mt-2">Take photo</button>
                                    <canvas id="canvas" width="320" height="240" class="d-none"></canvas>
                                </div>
                                <div class="d-grid">
                                    <button type="submit" class="btn btn-success">Compare</button>
                                </div>
                            </form>
                        </div>
                    </div>
                    <div id="results" class="mt-4"></div>
                </div>
            </div>
        </div>

        <footer class="bg-dark text-white-50 py-3 mt-auto">
            <div class="container text-center">
                <small>© {{ date('Y') }} Your Company Name. All rights reserved.</small>
            </div>
        </footer>
    </div>

    <script>
        const video = document.getElementById('video');
        const canvas = document.getElementById('canvas');
        const startbutton = document.getElementById('startbutton');
        const compareForm = document.getElementById('compareForm');
        const resultsDiv = document.getElementById('results');

        navigator.mediaDevices.getUserMedia({
                video: true,
                audio: false
            })
            .then(function(stream) {
                console.log('Received stream from webcam');
                video.srcObject = stream;
                video.play();
            })
            .catch(function(err) {
                console.log("An error occurred: " + err);
            });

        video.addEventListener('play', function() {
            console.log('Video is playing');
        }, false);

        startbutton.addEventListener('click', function(ev) {
            ev.preventDefault();
            canvas.getContext('2d').drawImage(video, 0, 0, 320, 240);
            canvas.classList.remove('d-none');
        }, false);

        compareForm.addEventListener('submit', function(event) {
            event.preventDefault();
            const formData = new FormData();
            canvas.toBlob(function(blob) {
                formData.append('photo', blob, 'photo.png');
                fetch('/api/analyze', {
                        method: 'POST',

                        body: formData
                    })
                    .then(response => response.json())
                    .then(data => {
                        resultsDiv.innerHTML = ''; // clear the results div
                        data.matches.forEach(match => {
                            match.match.forEach(matchImage => {
                                const imageName = matchImage.split('_face')[0] +
                                    '.jpg'; // ignore _face0 or _faceN
                                const imgContainer = document.createElement('div');
                                imgContainer.classList.add('img-match-container',
                                    'text-center', 'my-3');

                                const img = document.createElement('img');
                                img.src = `/images/${imageName}`;
                                img.alt = 'Matched image';
                                img.classList.add('img-thumbnail', 'mx-auto');

                                imgContainer.appendChild(img);
                                resultsDiv.appendChild(imgContainer);
                            });
                        });
                    })
                    .catch(error => {
                        console.error('Error:', error);
                        resultsDiv.innerHTML =
                            '<div class="alert alert-danger" role="alert">AI server is not active</div>';
                    });
            }, 'image/png');
        });
    </script>
@endsection
