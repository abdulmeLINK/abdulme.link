@extends('layouts.app')

@section('content')
    <div class="d-flex flex-column min-vh-100 justify-content-center align-items-center">
        <div class="container my-5">
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
                                    <div class="d-flex justify-content-center">
                                        <video id="video" width="320" height="240" autoplay></video>
                                    </div>
                                    <div class="d-grid">
                                        <button id="startbutton" class="btn btn-secondary mt-2">Take photo</button>
                                    </div>
                                    <div class="d-flex justify-content-center">
                                        <canvas id="canvas" width="320" height="240" class="d-none"></canvas>
                                    </div>
                                </div>
                                <div class="form-group mb-3">
                                    <label for="upload">Or upload a photo:</label>
                                    <input type="file" id="upload" name="upload" class="form-control">
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
    </div>

    <script>
        const video = document.getElementById('video');
        const canvas = document.getElementById('canvas');
        const startbutton = document.getElementById('startbutton');
        const compareForm = document.getElementById('compareForm');
        const resultsDiv = document.getElementById('results');
        const uploadInput = document.getElementById('upload');

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

        compareForm.addEventListener('submit', async function(event) {
            event.preventDefault();
            const formData = new FormData();

            if (uploadInput.files.length > 0) {
                const file = uploadInput.files[0];
                const compressedBlob = await compressImage(file);
                formData.append('photo', compressedBlob, 'photo.jpg');
                submitForm(formData);
            } else {
                canvas.toBlob(async function(blob) {
                    const compressedBlob = await compressImage(blob);
                    formData.append('photo', compressedBlob, 'photo.jpg');
                    submitForm(formData);
                }, 'image/jpeg');
            }
        });

        function compressImage(file) {
            return new Promise((resolve) => {
                const reader = new FileReader();
                reader.onload = function(event) {
                    const img = new Image();
                    img.onload = function() {
                        const canvas = document.createElement('canvas');
                        const ctx = canvas.getContext('2d');
                        canvas.width = img.width;
                        canvas.height = img.height;
                        ctx.drawImage(img, 0, 0);
                        canvas.toBlob(function(blob) {
                            if (blob.size > 2 * 1024 * 1024) {
                                resolve(compressImageQuality(blob,
                                0.7)); // Adjust quality if size > 2MB
                            } else {
                                resolve(blob);
                            }
                        }, 'image/jpeg', 0.9); // Initial quality setting
                    };
                    img.src = event.target.result;
                };
                reader.readAsDataURL(file);
            });
        }

        function compressImageQuality(blob, quality) {
            return new Promise((resolve) => {
                const reader = new FileReader();
                reader.onload = function(event) {
                    const img = new Image();
                    img.onload = function() {
                        const canvas = document.createElement('canvas');
                        const ctx = canvas.getContext('2d');
                        canvas.width = img.width;
                        canvas.height = img.height;
                        ctx.drawImage(img, 0, 0);
                        canvas.toBlob(function(newBlob) {
                            if (newBlob.size > 2 * 1024 * 1024 && quality > 0.1) {
                                resolve(compressImageQuality(newBlob, quality -
                                0.1)); // Reduce quality further
                            } else {
                                resolve(newBlob);
                            }
                        }, 'image/jpeg', quality);
                    };
                    img.src = event.target.result;
                };
                reader.readAsDataURL(blob);
            });
        }

        function submitForm(formData) {
            fetch('/api/analyze', {
                    method: 'POST',
                    body: formData
                })
                .then(response => response.json())
                .then(data => {
                    resultsDiv.innerHTML = ''; // clear the results div
                    const imgRow = document.createElement('div');
                    imgRow.classList.add('d-flex', 'flex-wrap', 'justify-content-center');
                    resultsDiv.appendChild(imgRow);

                    data.matches.forEach(match => {
                        match.match.forEach(matchImage => {
                            const imageName = matchImage.split('_face')[0]; // ignore _face0 or _faceN
                            const imgContainer = document.createElement('div');
                            imgContainer.classList.add('img-match-container', 'text-center', 'my-3',
                                'mx-2');

                            const img = document.createElement('img');
                            img.src = `/images/${imageName}`;
                            img.alt = 'Matched image';
                            img.classList.add('img-thumbnail', 'mx-auto');

                            const imgName = document.createElement('p');
                            imgName.textContent = imageName.replace(/_/g, ' ').replace(/[0-9]/g, '')
                                .replace('.jpg', '');
                            imgName.classList.add('mt-2');

                            imgContainer.appendChild(img);
                            imgContainer.appendChild(imgName);
                            imgRow.appendChild(imgContainer);
                        });
                    });
                })
                .catch(error => {
                    console.error('Error:', error);
                    resultsDiv.innerHTML = '<div class="alert alert-danger" role="alert">An Error Occurred</div>';
                });
        }
    </script>
@endsection
