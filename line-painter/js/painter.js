$(document).ready(function(){
    $('#canvas').lazylinepainter({
        "svgData": path05,
        "strokeWidth": 2,
        "strokeColor": "#FFF",
        "strokeCap": "round",
        "strokeJoin": "round",
        "onComplete": drawingComplete,
        "drawSequential": false,
        "speedMultiplier": 10,
        "overrideKey": "05"
    }).lazylinepainter('paint');

    function drawingComplete(){

    }

    setTimeout(function(){
        $('.center-image').addClass('active');
    },5500);

});
