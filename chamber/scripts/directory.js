const membersContainer = document.querySelector("#members");

const gridButton = document.querySelector("#grid-view");
const listButton = document.querySelector("#list-view");

// Fetch and display members
async function getMembers() {
    try {
        const response = await fetch("data/members.json");

        if (!response.ok) {
            throw new Error("Failed to load member data");
        }

        const members = await response.json();

        displayMembers(members);

    } catch (error) {
        console.error("Error loading members:", error);
        membersContainer.innerHTML = "<p>Unable to load member information.</p>";
    }
}

// Display members on the page
function displayMembers(members) {
    membersContainer.innerHTML = "";

    members.forEach((member) => {
        const card = document.createElement("article");

        card.classList.add("member-card");

        let membershipLevel = "";

        if (member.membership === 1) {
            membershipLevel = "Member";
        } else if (member.membership === 2) {
            membershipLevel = "Silver Member";
        } else if (member.membership === 3) {
            membershipLevel = "Gold Member";
        }

        card.innerHTML = `
            <img src="images/${member.image}" alt="${member.name}" loading="lazy">

            <div class="member-info">
                <h2>${member.name}</h2>

                <p><strong>Address:</strong> ${member.address}</p>

                <p><strong>Phone:</strong> ${member.phone}</p>

                <p><strong>Membership:</strong> ${membershipLevel}</p>

                <p>${member.description}</p>

                <a href="${member.website}" target="_blank">
                    Visit Website
                </a>
            </div>
        `;

        membersContainer.appendChild(card);
    });
}

// Grid View
gridButton.addEventListener("click", () => {
    membersContainer.classList.add("grid");
    membersContainer.classList.remove("list");
});

// List View
listButton.addEventListener("click", () => {
    membersContainer.classList.add("list");
    membersContainer.classList.remove("grid");
});
getMembers();