console.log('Loaded!');


//move the image
var img = document.getElementById("madi");
img.onclick = function(){
    var interval = setInterval(moveRight,100);
};