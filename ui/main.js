console.log('Loaded!');


//move the image
var img = document.getElementById("madi");
img.onclick = function(){
    var interval = setInterval(moveLeft,100);
    img.style.marginLeft = '100px';
};