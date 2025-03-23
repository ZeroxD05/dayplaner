// static/js/tasks.js
document.addEventListener("DOMContentLoaded", () => {
  const filterDate = document.getElementById("filter-date");
  const filterPriority = document.getElementById("filter-priority");
  const filterCompletedBtn = document.getElementById("filter-completed");
  const tasksContainer = document.getElementById("tasks-container");
  const editModal = document.getElementById("edit-modal");
  const closeModal = document.querySelector(".close-modal");
  const editForm = document.getElementById("edit-form");
  let showCompleted = false;

  // Initiale Filterung
  filterTasks();

  // Event Listener für Filter
  filterDate.addEventListener("change", filterTasks);
  filterPriority.addEventListener("change", filterTasks);
  filterCompletedBtn.addEventListener("click", () => {
    showCompleted = !showCompleted;
    filterCompletedBtn.textContent = showCompleted
      ? "Offene anzeigen"
      : "Erledigt anzeigen";
    filterTasks();
  });

  // Filterfunktion
  function filterTasks() {
    const dateFilter = filterDate.value;
    const priorityFilter = filterPriority.value;

    fetch(
      `/api/tasks?filter=${dateFilter}&priority=${priorityFilter}&completed=${showCompleted}`
    )
      .then((response) => response.json())
      .then((tasks) => {
        tasksContainer.innerHTML = "";
        tasks.forEach((task) => {
          const taskCard = document.createElement("div");
          taskCard.className = `task-card ${task.completed ? "completed" : ""}`;
          taskCard.dataset.id = task.id;
          taskCard.innerHTML = `
                          <div class="task-header ${
                            task.completed ? "completed" : ""
                          }">
                              <h3 class="editable" data-field="title">${
                                task.title
                              }</h3>
                              <span class="priority-badge ${task.priority}">${
            task.priority
          }</span>
                          </div>
                          <div class="task-body">
                              <p class="editable" data-field="description">${
                                task.description || ""
                              }</p>
                              <div class="task-meta">
                                  <div class="task-date-info">
                                      <div class="task-date">${task.date}</div>
                                      <div class="task-time editable" data-field="time">${
                                        task.time
                                      }</div>
                                  </div>
                                  <div class="task-edit-controls">
                                      <button class="edit-task-btn" data-id="${
                                        task.id
                                      }">Bearbeiten</button>
                                  </div>
                              </div>
                          </div>
                          <div class="task-actions">
                              <form action="/complete_task/${
                                task.id
                              }" method="post" class="inline-form">
                                  <button type="submit" class="btn complete-btn">
                                      ${
                                        task.completed
                                          ? "Rückgängig"
                                          : "Erledigt"
                                      }
                                  </button>
                              </form>
                              <form action="/delete_task/${
                                task.id
                              }" method="post" class="inline-form">
                                  <button type="submit" class="btn delete-btn">Löschen</button>
                              </form>
                          </div>
                      `;
          tasksContainer.appendChild(taskCard);
        });
        addEditableListeners();
        addEditButtonListeners();
      });
  }

  // Listener für editierbare Felder
  function addEditableListeners() {
    document.querySelectorAll(".editable").forEach((element) => {
      element.addEventListener("click", (e) => {
        const taskId = e.target.closest(".task-card").dataset.id;
        const field = e.target.dataset.field;
        const currentValue = e.target.textContent.trim();

        openEditModal(taskId, field, currentValue);
      });
    });
  }

  // Listener für Bearbeiten-Buttons
  function addEditButtonListeners() {
    document.querySelectorAll(".edit-task-btn").forEach((button) => {
      button.addEventListener("click", (e) => {
        const taskId = e.target.dataset.id;
        fetch(`/api/tasks?date=&filter=all&priority=all&completed=true`)
          .then((response) => response.json())
          .then((tasks) => {
            const task = tasks.find((t) => t.id == taskId);
            if (task) {
              document.getElementById("edit-task-id").value = task.id;
              document.getElementById("edit-title").value = task.title;
              document.getElementById("edit-description").value =
                task.description || "";
              document.getElementById("edit-time").value = task.time;
              document.getElementById("edit-priority").value = task.priority;
              editModal.style.display = "block";
            }
          });
      });
    });
  }

  // Modal öffnen
  function openEditModal(taskId, field, currentValue) {
    // Hier wird das Modal für die Inline-Bearbeitung angepasst, falls nötig
    // Für diesen Fall nutzen wir das bestehende Modal
  }

  // Modal schließen
  closeModal.addEventListener("click", () => {
    editModal.style.display = "none";
  });

  // Formular speichern
  editForm.addEventListener("submit", (e) => {
    e.preventDefault();
    const taskId = document.getElementById("edit-task-id").value;
    const updatedTask = {
      title: document.getElementById("edit-title").value,
      description: document.getElementById("edit-description").value,
      time: document.getElementById("edit-time").value,
      priority: document.getElementById("edit-priority").value,
    };

    fetch(`/update_task/${taskId}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(updatedTask),
    })
      .then((response) => response.json())
      .then((data) => {
        if (data.success) {
          editModal.style.display = "none";
          filterTasks();
        }
      });
  });

  // Klick außerhalb des Modals schließt es
  window.addEventListener("click", (e) => {
    if (e.target === editModal) {
      editModal.style.display = "none";
    }
  });
});
