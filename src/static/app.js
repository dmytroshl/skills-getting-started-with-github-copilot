document.addEventListener("DOMContentLoaded", () => {
  const activitiesList = document.getElementById("activities-list");
  const activitySelect = document.getElementById("activity");
  const signupForm = document.getElementById("signup-form");
  const messageDiv = document.getElementById("message");

  // Helper to get initials from email (before @)
  function getBadgeInitials(email) {
    const namePart = (email || "").split("@")[0] || "";
    const parts = namePart.split(/[\.\-_]/).filter(Boolean);
    if (parts.length === 0) return (email[0] || "").toUpperCase();
    if (parts.length === 1) return (parts[0][0] || "").toUpperCase();
    return ((parts[0][0] || "") + (parts[1][0] || "")).toUpperCase();
  }

  // Function to fetch activities from API
  async function fetchActivities() {
    try {
      const response = await fetch("/activities");
      const activities = await response.json();

      // Clear loading message
      activitiesList.innerHTML = "";

      // Clear select options (keep placeholder)
      activitySelect.innerHTML = '<option value="">-- Select an activity --</option>';

      // Populate activities list
      Object.entries(activities).forEach(([name, details]) => {
        const activityCard = document.createElement("div");
        activityCard.className = "activity-card";

        const spotsLeft = details.max_participants - details.participants.length;

        activityCard.innerHTML = `
          <h4>${name}</h4>
          <p>${details.description}</p>
          <p><strong>Schedule:</strong> ${details.schedule}</p>
          <p><strong>Availability:</strong> ${spotsLeft} spots left</p>
        `;

        // Participants section
        const participants = details.participants || [];
        const participantsSection = document.createElement("div");
        participantsSection.className = "participants-section";

        const heading = document.createElement("h5");
        heading.textContent = "Participants";
        participantsSection.appendChild(heading);

        if (participants.length === 0) {
          const noP = document.createElement("p");
          noP.className = "info";
          noP.textContent = "No participants yet";
          participantsSection.appendChild(noP);
        } else {
          const ul = document.createElement("ul");
          ul.className = "participants-list";

          participants.forEach((email) => {
            const li = document.createElement("li");

            const badge = document.createElement("span");
            badge.className = "participant-badge";
            badge.textContent = getBadgeInitials(email);

            const emailSpan = document.createElement("span");
            emailSpan.className = "participant-email";
            emailSpan.textContent = email;

            li.appendChild(badge);
            li.appendChild(emailSpan);
            ul.appendChild(li);
          });

          participantsSection.appendChild(ul);
        }

        activityCard.appendChild(participantsSection);
        activitiesList.appendChild(activityCard);

        // Add option to select dropdown
        const option = document.createElement("option");
        option.value = name;
        option.textContent = name;
        activitySelect.appendChild(option);
      });
    } catch (error) {
      activitiesList.innerHTML = "<p>Failed to load activities. Please try again later.</p>";
      console.error("Error fetching activities:", error);
    }
  }

  // Handle form submission
  signupForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    const email = document.getElementById("email").value;
    const activity = document.getElementById("activity").value;

    try {
      const response = await fetch(
        `/activities/${encodeURIComponent(activity)}/signup?email=${encodeURIComponent(email)}`,
        {
          method: "POST",
        }
      );

      const result = await response.json();

      if (response.ok) {
        messageDiv.textContent = result.message;
        messageDiv.className = "success";
        signupForm.reset();
      } else {
        messageDiv.textContent = result.detail || "An error occurred";
        messageDiv.className = "error";
      }

      messageDiv.classList.remove("hidden");

      // Hide message after 5 seconds
      setTimeout(() => {
        messageDiv.classList.add("hidden");
      }, 5000);
    } catch (error) {
      messageDiv.textContent = "Failed to sign up. Please try again.";
      messageDiv.className = "error";
      messageDiv.classList.remove("hidden");
      console.error("Error signing up:", error);
    }
  });

  // Initialize app
  fetchActivities();
});
