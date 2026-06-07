//  WEATHER//
const apiKey = "8cd0bd0a76967050e790ac524d6c7ca8";

async function getWeather() {
    const city = document.getElementById("cityInput").value;

    if (!city) {
        alert("Please enter a city name");
        return;
    }

    const url =
        `https://api.openweathermap.org/data/2.5/weather?q=${city}&appid=${apiKey}&units=metric`;

    try {
        const response = await fetch(url);
        const data = await response.json();

        document.getElementById("city").textContent =
            `${data.name}, ${data.sys.country}`;

        document.getElementById("temperature").textContent =
            `Temperature: ${data.main.temp}°C`;

        document.getElementById("description").textContent =
            data.weather[0].description;

        document.getElementById("icon").src =
            `https://openweathermap.org/img/wn/${data.weather[0].icon}@2x.png`;

    } catch (error) {
        alert("City not found!");
    }
}

//MEMBER SPOTLIGHT//

const url = ".data/members.json";
const membersContainer = document.querySelector("#members");
const spotlightContainer = document.querySelector("#spotlight-container");

async function getMembers() {
    const response = await fetch(url);
    const data = await response.json();

    displayMembers(data);
    displaySpotlights(data);
}

function displayMembers(members) {
    members.forEach(member => {
        const card = document.createElement("section");

        card.innerHTML = `
            <img src="images/${member.image}" alt="${member.name}">
            <h3>${member.name}</h3>
            <p>${member.address}</p>
            <p>${member.phone}</p>
            <p>${member.industry}</p>
            <a href="${member.website}" target="_blank">Visit Website</a>
            <p>${member.description}</p>
        `;

        membersContainer.appendChild(card);
    });
}

function displaySpotlights(members) {
    const qualified = members.filter(
        member => member.membership === 2 || member.membership === 3
    );

    const shuffled = qualified.sort(() => 0.5 - Math.random());

    const selected = shuffled.slice(0, 3);

    selected.forEach(member => {
        const card = document.createElement("div");

        card.classList.add("spotlight-card");

        card.innerHTML = `
            <img src="images/${member.image}" alt="${member.name}">
            <h3>${member.name}</h3>
            <p>${member.phone}</p>
            <p>${member.description}</p>
            <a href="${member.website}" target="_blank">Learn More</a>
        `;

        spotlightContainer.appendChild(card);
    });
}

document.querySelector("#gridBtn").addEventListener("click", () => {
    membersContainer.classList.add("grid");
    membersContainer.classList.remove("list");
});

document.querySelector("#listBtn").addEventListener("click", () => {
    membersContainer.classList.add("list");
    membersContainer.classList.remove("grid");
});

getMembers();

const timestamp = document.getElementById("timestamp");

if (timestamp) {
    timestamp.value = new Date().toISOString();
}