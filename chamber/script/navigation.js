/** Navigation */
const navbutton= document.querySelector('#ham-btn');

const navlinks= document.querySelector('#nav-btn');

navbutton.addEventListener('click', () => {
  navbutton.classList.toggle('show');
  navlinks.classList.toggle('show');});