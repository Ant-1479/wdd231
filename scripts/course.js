const courses = [
  {
    subject: 'CSE',
    number: 110,
    title: 'Introduction to Programming',
    credits: 2,
    certificate: 'Web and Computer Programming',
    description: 'This course will introduce students to programming...',
    technology: ['Python'],
    completed: true
  },
  {
    subject: 'WDD',
    number: 130,
    title: 'Web Fundamentals',
    credits: 2,
    certificate: 'Web and Computer Programming',
    description: 'This course introduces students to the World Wide Web...',
    technology: ['HTML', 'CSS'],
    completed: true
  },
  // ... (rest of your courses)
];

/* elements */
const container = document.getElementById('courses-container');
const totalCreditEl = document.getElementById('total-credits');

/* FILTER buttons */
document.getElementById('all').addEventListener('click', () =>
  displayCourses(courses)
);

document.getElementById('wdd').addEventListener('click', () =>
  displayCourses(courses.filter(c => c.subject === 'WDD'))
);

document.getElementById('cse').addEventListener('click', () =>
  displayCourses(courses.filter(c => c.subject === 'CSE'))
);

/* display courses Function */
function displayCourses(list) {
  container.innerHTML = "";

  list.forEach(course => {
    const card = document.createElement('div');
    card.classList.add("course-card");

    if (course.completed) {
      card.classList.add("completed");
    }

    card.innerHTML = `
      <h3>${course.subject} ${course.number}</h3>
      <p>${course.title}</p>
      <p>Credits: ${course.credits}</p>
    `;

    container.appendChild(card);
  });

  const total = list.reduce((sum, course) => sum + course.credits, 0);
  totalCreditEl.textContent = `Total Credits: ${total}`;
}

/* initial load */
displayCourses(courses);
