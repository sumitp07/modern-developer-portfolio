const projects = [
  {
    title: "Weather App",
    description: "Real-time weather app using OpenWeather API.",
    tech: ["HTML", "CSS", "JavaScript"]
  },
  {
    title: "Task Manager",
    description: "Todo app with local storage support.",
    tech: ["JavaScript", "LocalStorage"]
  },
  {
    title: "Portfolio v1",
    description: "First responsive developer portfolio.",
    tech: ["HTML", "CSS"]
  }
];



const faders = document.querySelectorAll(".fade");

const observer = new IntersectionObserver(
  (entries, observer) => {
    entries.forEach((entry, index) => {
      if (!entry.isIntersecting) return;

      setTimeout(() => {
        entry.target.classList.add("show");
      }, index * 150);

      observer.unobserve(entry.target);
    });
  },
  {
    threshold: 0.2
  }
);

faders.forEach(section => {
  observer.observe(section);
});

const projectContainer = document.getElementById("project-list");

projects.forEach(project => {
  const card = document.createElement("div");
  card.className = "project-card";

  card.innerHTML = `
    <h4>${project.title}</h4>
    <p>${project.description}</p>
    <small>${project.tech.join(" • ")}</small>
  `;

  projectContainer.appendChild(card);
});