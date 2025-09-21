const menuButton=document.querySelector('#menu');
const nav=document.querySelector("nav");
menuButton.addEventListener("click",()=>{
   nav.classList.toggle('open');
   menuButton.innerHTML=nav.classList.contains('open')?'&#10006;':'&#9776;';
});

    
