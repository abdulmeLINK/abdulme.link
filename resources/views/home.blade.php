@extends('layouts.app')

@section('content')
<div class="stylish-element-above">
    <!-- Add content for the stylish element above the terminal here -->
</div>

<div id="desktop"><div class="mac-window" id="draggable-terminal">
    <div class="mac-window-titlebar">
        <div class="mac-window-buttons">
            <div class="mac-window-button mac-window-button-close"></div>
            <div class="mac-window-button mac-window-button-minimize"></div>
            <div class="mac-window-button mac-window-button-maximize"></div>
        </div>
    </div>
    <div id="terminal">
        <div id="xterm-container"></div>
    </div>
</div></div>

<div class="stylish-element-below">
    <!-- Add content for the stylish element below the terminal here -->
</div>

<style>
    #desktop {
        
        height: 100vh;
        width: 100vw;
        overflow: hidden;
    }
    body::-webkit-scrollbar {
    display: none;
}
body::before {
    content: "";
    position: fixed;
    top: 0;
    right: 0;
    bottom: 0;
    left: 0;
    background: var(--background-image) no-repeat center center fixed;
    background-size: cover;
    z-index: -1;
    transition: background 1s ease; /* Add this line */
}
    /* Linux terminal theme styling */
    body {
        
        font-family: monospace;
        background-color: #fff;
        color: #fff;
        margin: 0;
        padding: 0;
        background-size: cover;
        cursor: url('images/cursor.png'), auto;
    }
    .terminal-container {
            flex-grow: 1;
            position: relative;
        }

    .mac-window {
        cursor: url('images/cursor.png'), auto;
        width: 50vw;
        margin: 25vh auto;
        border-radius: 5px;
        box-shadow: 0 0 10px rgba(0, 0, 0, 0.6);
        background-color: rgba(0, 0, 0, 0.6);
    }

    #terminal, #xterm-container {
        /* Make the terminal and xterm container fill the window */
        cursor: url('images/cursor.png'), auto;
        width: 100%;
        height: 100%;
        /* Set the background color to the same as the window */
    }

    .mac-window-titlebar {
        height: 30px;
        background-color: #ddd;
        border-top-left-radius: 5px;
        border-top-right-radius: 5px;
        display: flex;
        align-items: center;
        padding-left: 10px;
        cursor: url('images/cursor.png'), auto;
    }

    .mac-window-buttons {
        display: flex;
        gap: 5px;
    }

    .mac-window-button {
        width: 12px;
        height: 12px;
        border-radius: 50%;
    }

    .mac-window-button-close {
        background-color: #ff5f57;
    }

    .mac-window-button-minimize {
        background-color: #ffbd2e;
    }

    .mac-window-button-maximize {
        background-color: #27c93f;
    }

    
    .xterm{
        cursor: url('images/cursor.png'), auto;
    }
    #terminal {
        cursor: url('images/cursor.png'), auto;
        padding: 10px;
        box-sizing: border-box;
        overflow: hidden;
    }

    #xterm-container {
        cursor: url('images/cursor.png'), auto;
        height: 100%;
        overflow-y: hidden;
        overflow-x: hidden;
    }
    .xterm-screen {
        cursor: url('images/cursor.png'), auto;
        overflow-y: hidden !important;
        overflow-x: hidden !important;
    }
    

    .xterm-scroll-area{
        cursor: url('images/cursor.png'), auto;
    }

    .xterm-viewport {
        cursor: url('images/cursor.png'), auto !important;
        overflow-y: hidden !important;
        overflow-x: hidden !important;
    }

    /* Custom cursor styling */
    .xterm-cursor {
        background-color: #fff;
    }
    .ui-resizable-handle { 
    background-image: none;
 }
    /* Add more custom styling as needed */
</style>
<script>
    
    // Array of day and night screenshots
    const dayScreenshots = [
        '/images/10-11-6k.jpg',
        '/images/10-13-6k.jpg',
        '/images/10-6-6k.jpg',
        '/images/10-7-6k.jpg',
        '/images/10-8-6k.jpg',
        '/images/10-14-Day-6k.jpg',
        '/images/10-15-Day.jpg',
        '/images/11-0-Day.jpg',
        '/images/11-0-Color-Day.jpg',
        '/images/14-Sonoma-Light.jpg',
        '/images/Ventura light.jpg',
        '/images/Yosemite 2.jpg',
        '/images/Yosemite 3.jpg',
        '/images/Yosemite 4.jpg',
        '/images/Yosemite 5.jpg',
        '/images/Yosemite.jpg',
        '/images/Sierra.jpg',
        '/images/Zebra.jpg'
    ];

    const nightScreenshots = [
        '/images/10-14-Night-6k.jpg',
        '/images/10-15-Night.jpg',
        '/images/10-6-Server-6k.jpg',
        '/images/11-0-Big-Sur-Color-Night.jpg',
        '/images/11-0-Night.jpg',
        '/images/12-Dark.jpg',
        '/images/14-Sonoma-Dark.jpg',
        '/images/The-Starry-Night.jpg',
        '/images/Ventura dark.jpg'
    ];

    // Function to select a random screenshot
    function selectRandomScreenshot(screenshots) {
        const index = Math.floor(Math.random() * screenshots.length);
        return screenshots[index];
    }

// Function to get the current theme
function getCurrentTheme() {
    // Replace this with your actual logic for getting the current theme
    return localStorage.getItem('theme') || 'light';
}

// Set the background image of the body to a random screenshot based on the current theme
const cTheme = getCurrentTheme();
const screenshots = cTheme === 'light' ? dayScreenshots : nightScreenshots;
document.body.style.backgroundImage = `url(${selectRandomScreenshot(screenshots)})`;

// Change the window bar color based on the current theme
const titleBar = document.querySelector('.mac-window-titlebar');
const closeButton = document.querySelector('.mac-window-button-close');
const minimizeButton = document.querySelector('.mac-window-button-minimize');
const maximizeButton = document.querySelector('.mac-window-button-maximize');

if (cTheme === 'light') {
    titleBar.style.backgroundColor = '#ddd';
    closeButton.style.backgroundColor = '#ff5f57';
    minimizeButton.style.backgroundColor = '#ffbd2e';
    maximizeButton.style.backgroundColor = '#27c93f';
} else {
    titleBar.style.backgroundColor = '#333';
    closeButton.style.backgroundColor = '#ff5f57';
    minimizeButton.style.backgroundColor = '#ffbd2e';
    maximizeButton.style.backgroundColor = '#27c93f';
}
// Function to preload an image
function preloadImage(url) {
    return new Promise((resolve, reject) => {
        const img = new Image();
        img.onload = () => resolve(url);
        img.onerror = reject;
        img.src = url;
    });
}

// Function to change the background image
async function changeBackground() {
    const cTheme = getCurrentTheme();
    const screenshots = cTheme === 'light' ? dayScreenshots : nightScreenshots;
    const screenshot = selectRandomScreenshot(screenshots);
    try {
        const url = await preloadImage(screenshot);
        document.body.style.setProperty('--background-image', `url(${url})`);
    } catch (error) {
        console.error(`Failed to preload image: ${screenshot}`, error);
    }
}

// Change the background image immediately and then every minute
changeBackground();
setInterval(changeBackground, 10 * 1000);


</script>
<script type="module" src="{{ asset('js/xterm.js') }}"></script>
<script type="module" src="{{ mix('js/terminal.js') }}"></script>
<script>
    
    // Make the terminal window draggable

    $(function() {
    $("#draggable-terminal").draggable({bounds:$("#desktop")}).resizable({ animate: true,
            ghost: true,
            handles: 'n,s,e,w,ne,se,nw,sw',
            hide: true
            
        })
});


</script>

<script>
 

    // Get the window
    const macWindow = document.querySelector('.mac-window');
    // Define the behavior for each button
    closeButton.addEventListener('click', () => {
        macWindow.style.display = 'none'; // Hide the window
        footer.style.display = 'none'; // Hide the footer
    });

    minimizeButton.addEventListener('click', () => {
        macWindow.style.height = `0px`; // Minimize the window to the size of the bar
    });

    maximizeButton.addEventListener('click', () => {
        
        macWindow.style.width = '100%';
        $("#draggable-terminal").css({
        top: 0,
        left: 0
    });

    $("#draggable-terminal").css({
        top: -$("#draggable-terminal").offset().top+titleBar.offsetHeight,
        left: -$("#draggable-terminal").offset().left})
     // Maximize the window
        macWindow.style.height = '100vh';
    });
</script>
@endsection
