const params = new URLSearchParams(window.location.search);

const fields = [
  ['First name', 'fname'],
  ['Last name', 'lname'],
  ['Email', 'email'],
  ['Mobile phone', 'phone'],
  ['Business / organization', 'orgname'],
  ['Submitted on', 'timestamp'],
];

const summary = document.querySelector('#summary');

fields.forEach(([label, key]) => {
  let value = params.get(key) || 'Not provided';
  if (key === 'timestamp' && params.get(key)) {
    const date = new Date(value);
    if (!isNaN(date)) value = date.toLocaleString();
  }
  const dt = document.createElement('dt');
  const dd = document.createElement('dd');
  dt.textContent = label;
  dd.textContent = value; // textContent keeps user input from being run as HTML
  summary.append(dt, dd);
});

document.querySelector('#year').textContent = new Date().getFullYear();
document.querySelector('#lastModified').textContent = document.lastModified;