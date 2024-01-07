import 'bootstrap/dist/css/bootstrap.css'
import '../css/app.css';



window.addEventListener('scroll', function() {
    document.querySelectorAll('.roadmap-point').forEach(function(point) {
        var rect = point.getBoundingClientRect();
        if (rect.top < window.innerHeight && rect.bottom > 0) {
            point.setAttribute('data-anim', 'show');
        } else {
            point.setAttribute('data-anim', 'hide');
        }
    });
});
