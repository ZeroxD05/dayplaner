// static/js/script.js
document.addEventListener("DOMContentLoaded", () => {
  const prevMonthBtn = document.getElementById("prev-month");
  const nextMonthBtn = document.getElementById("next-month");
  const calendarTitle = document.getElementById("calendar-title");
  const calendarDays = document.getElementById("calendar-days");
  const currentDateDisplay = document.getElementById("current-date");
  const taskForm = document.getElementById("task-form");

  let currentDate = new Date();
  let today = new Date().toISOString().split("T")[0];

  // Initialer Kalender-Render
  renderCalendar(currentDate.getFullYear(), currentDate.getMonth() + 1);

  // Event Listener für Monatsnavigation
  prevMonthBtn.addEventListener("click", () => {
    currentDate.setMonth(currentDate.getMonth() - 1);
    renderCalendar(currentDate.getFullYear(), currentDate.getMonth() + 1);
  });

  nextMonthBtn.addEventListener("click", () => {
    currentDate.setMonth(currentDate.getMonth() + 1);
    renderCalendar(currentDate.getFullYear(), currentDate.getMonth() + 1);
  });

  // Kalender rendern
  function renderCalendar(year, month) {
    fetch(`/calendar/${year}/${month}`)
      .then((response) => response.json())
      .then((data) => {
        calendarTitle.textContent = `${data.month_name} ${data.year}`;
        calendarDays.innerHTML = "";

        data.calendar_days.forEach((day) => {
          const dayDiv = document.createElement("div");
          dayDiv.className = "day";
          if (!day.day) {
            dayDiv.className += " empty";
          } else {
            dayDiv.textContent = day.day;
            if (day.date === today) {
              dayDiv.className += " today";
            }
            if (data.task_counts[day.date] > 0) {
              dayDiv.className += " has-tasks";
            }
            dayDiv.dataset.date = day.date;
            dayDiv.addEventListener("click", () => selectDate(day.date));
          }
          calendarDays.appendChild(dayDiv);
        });
      });
  }

  // Datum auswählen und Anzeige aktualisieren
  function selectDate(date) {
    currentDateDisplay.textContent = date;
    document.getElementById("date").value = date;
    fetchTasks(date);
  }

  // Aufgaben für ein bestimmtes Datum abrufen (für Vorschau)
  function fetchTasks(date) {
    fetch(`/api/tasks?date=${date}`)
      .then((response) => response.json())
      .then((tasks) => {
        const previewTasks = document.querySelector(".preview-tasks");
        previewTasks.innerHTML = "";
        tasks.slice(0, 3).forEach((task) => {
          const taskDiv = document.createElement("div");
          taskDiv.className = "preview-task";
          taskDiv.innerHTML = `
                      <h4>${task.title}</h4>
                      <span class="preview-time">${task.time}</span>
                      <span class="priority-badge ${task.priority}">${task.priority}</span>
                  `;
          previewTasks.appendChild(taskDiv);
        });
      });
  }

  // Formular-Validierung vor dem Absenden
  taskForm.addEventListener("submit", (e) => {
    const title = document.getElementById("title").value.trim();
    const date = document.getElementById("date").value;
    const time = document.getElementById("time").value;

    if (!title || !date || !time) {
      e.preventDefault();
      alert("Bitte fülle alle Pflichtfelder aus.");
    }
  });
});
