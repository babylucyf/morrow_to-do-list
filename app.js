const storeKey = "morrow-vanilla-tasks";

let tasks = JSON.parse(localStorage.getItem(storeKey) || "[]");
let currentList = "all";
let currentView = "list";
let editingId = null;
let calendarDate = new Date();

const $ = (id) => document.getElementById(id);

const today = () => new Date().toISOString().slice(0, 10);

const save = () => {
  localStorage.setItem(storeKey, JSON.stringify(tasks));
};

const esc = (value) =>
  String(value ?? "").replace(/[&<>'"]/g, (char) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    "'": "&#39;",
    '"': "&quot;"
  })[char]);


/* -----------------------------
   DATE HELPERS
----------------------------- */

function formatDate(dateString) {
  if (!dateString) return "";

  const date = new Date(`${dateString}T00:00:00`);

  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric"
  });
}

function dateToISO(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

function calendarMonthLabel() {
  return calendarDate.toLocaleDateString("en-US", {
    month: "long",
    year: "numeric"
  });
}


/* -----------------------------
   FILTERING
----------------------------- */

function filtered() {
  const search = $("search").value.toLowerCase();
  const status = $("status-filter").value;
  const priority = $("priority-filter").value;

  return tasks.filter((t) => {

    if (
      currentList === "today" &&
      t.due !== today()
    ) {
      return false;
    }

    if (
      currentList === "upcoming" &&
      (
        !t.due ||
        t.due <= today() ||
        t.status === "done"
      )
    ) {
      return false;
    }

    if (
      currentList === "overdue" &&
      (
        !t.due ||
        t.due >= today() ||
        t.status === "done"
      )
    ) {
      return false;
    }

    if (
      currentList === "completed" &&
      t.status !== "done"
    ) {
      return false;
    }

    if (
      status &&
      t.status !== status
    ) {
      return false;
    }

    if (
      priority &&
      t.priority !== priority
    ) {
      return false;
    }

    const searchableText = [
      t.title,
      t.description,
      ...(t.tags || [])
    ]
      .join(" ")
      .toLowerCase();

    if (
      search &&
      !searchableText.includes(search)
    ) {
      return false;
    }

    return true;
  });
}


/* -----------------------------
   TASK HTML
----------------------------- */

function taskHTML(t) {

  return `
    <article
      class="task ${t.status === "done" ? "done" : ""}"
      draggable="true"
      data-id="${t.id}"
    >

      <button
        class="check"
        data-complete="${t.id}"
        aria-label="Complete ${esc(t.title)}"
      >
        ${t.status === "done" ? "✓" : ""}
      </button>

      <button
        class="task-info"
        data-edit="${t.id}"
      >

        <span class="task-title">
          ${esc(t.title)}
        </span>

        <span class="meta">

          ${
            t.priority
              ? `<b class="${esc(t.priority)}">
                   ${esc(t.priority.toUpperCase())}
                 </b>`
              : ""
          }

          ${
            t.due
              ? `<span>◷ ${formatDate(t.due)}</span>`
              : ""
          }

          ${(t.tags || [])
            .map(
              (tag) =>
                `<span class="tag">#${esc(tag)}</span>`
            )
            .join("")}

        </span>

      </button>

    </article>
  `;
}


/* -----------------------------
   CALENDAR
----------------------------- */

function renderCalendar() {

  const year = calendarDate.getFullYear();
  const month = calendarDate.getMonth();

  const firstDay = new Date(year, month, 1);

  const startDay = firstDay.getDay();

  const daysInMonth =
    new Date(year, month + 1, 0).getDate();

  const previousMonthDays =
    new Date(year, month, 0).getDate();

  let html = `
    <section class="calendar">

      <header class="calendar-header">

        <div>
          <p>YOUR SCHEDULE</p>
          <h2>${calendarMonthLabel()}</h2>
        </div>

        <div class="calendar-actions">

          <button
            class="secondary"
            id="calendar-today"
          >
            Today
          </button>

          <button
            class="calendar-arrow"
            id="calendar-prev"
            aria-label="Previous month"
          >
            ‹
          </button>

          <button
            class="calendar-arrow"
            id="calendar-next"
            aria-label="Next month"
          >
            ›
          </button>

        </div>

      </header>

      <div class="calendar-weekdays">

        <span>Sun</span>
        <span>Mon</span>
        <span>Tue</span>
        <span>Wed</span>
        <span>Thu</span>
        <span>Fri</span>
        <span>Sat</span>

      </div>

      <div class="calendar-grid">
  `;


  const calendarTasks = tasks.filter(
    (task) => task.due
  );


  for (let cell = 0; cell < 42; cell++) {

    let dayNumber;
    let cellDate;
    let otherMonth = false;

    if (cell < startDay) {

      dayNumber =
        previousMonthDays -
        startDay +
        cell +
        1;

      cellDate =
        new Date(year, month - 1, dayNumber);

      otherMonth = true;

    } else if (
      cell >= startDay + daysInMonth
    ) {

      dayNumber =
        cell -
        (startDay + daysInMonth) +
        1;

      cellDate =
        new Date(year, month + 1, dayNumber);

      otherMonth = true;

    } else {

      dayNumber =
        cell -
        startDay +
        1;

      cellDate =
        new Date(year, month, dayNumber);
    }


    const isoDate = dateToISO(cellDate);

    const isToday =
      isoDate === today();

    const dayTasks =
      calendarTasks.filter(
        (task) => task.due === isoDate
      );


    html += `
      <div
        class="calendar-day
          ${otherMonth ? "other-month" : ""}
          ${isToday ? "calendar-today" : ""}"
        data-date="${isoDate}"
      >

        <div class="calendar-day-number">
          ${dayNumber}
        </div>

        <div class="calendar-tasks">

          ${dayTasks
            .slice(0, 3)
            .map(
              (task) => `
                <button
                  class="calendar-task ${
                    task.status === "done"
                      ? "calendar-task-done"
                      : ""
                  }"
                  data-edit="${task.id}"
                  title="${esc(task.title)}"
                >
                  ${esc(task.title)}
                </button>
              `
            )
            .join("")}

          ${
            dayTasks.length > 3
              ? `
                <button
                  class="calendar-more"
                  data-date="${isoDate}"
                >
                  +${dayTasks.length - 3} more
                </button>
              `
              : ""
          }

        </div>

      </div>
    `;
  }


  html += `
      </div>

    </section>
  `;


  $("task-area").className = "calendar-wrapper";
  $("task-area").innerHTML = html;


  $("calendar-prev").onclick = () => {

    calendarDate = new Date(
      year,
      month - 1,
      1
    );

    renderCalendar();
  };


  $("calendar-next").onclick = () => {

    calendarDate = new Date(
      year,
      month + 1,
      1
    );

    renderCalendar();
  };


  $("calendar-today").onclick = () => {

    calendarDate = new Date();

    renderCalendar();
  };
}


/* -----------------------------
   MAIN RENDER
----------------------------- */

function render() {

  const area = $("task-area");

  const visible = filtered();

  const completed =
    tasks.filter(
      (task) => task.status === "done"
    ).length;

  const openToday =
    tasks.filter(
      (task) =>
        task.due === today() &&
        task.status !== "done"
    ).length;


  $("all-count").textContent =
    tasks.length;

  $("focus-text").textContent =
    `${openToday} task${
      openToday === 1 ? "" : "s"
    } remain`;

  $("progress-text").textContent =
    `${completed} of ${tasks.length} completed`;

  $("progress-bar").style.width =
    `${tasks.length
      ? (completed / tasks.length) * 100
      : 0}%`;


  const titles = {
    all: "All tasks",
    today: "Today",
    calendar: "Calendar",
    upcoming: "Upcoming",
    overdue: "Overdue",
    completed: "Completed"
  };

  $("page-title").textContent =
    titles[currentList] || "All tasks";


  if (
    currentView === "calendar" ||
    currentList === "calendar"
  ) {

    renderCalendar();

    return;
  }


  if (currentView === "board") {

    area.className = "board";

    area.innerHTML = [
      "todo",
      "in_progress",
      "done"
    ]
      .map(
        (status) => `
          <section
            class="column"
            data-status="${status}"
          >

            <h2>
              ${
                {
                  todo: "TO DO",
                  in_progress: "IN PROGRESS",
                  done: "DONE"
                }[status]
              }
            </h2>

            ${visible
              .filter(
                (task) =>
                  task.status === status
              )
              .map(taskHTML)
              .join("")}

          </section>
        `
      )
      .join("");

    return;
  }


  area.className = "task-list";


  area.innerHTML = visible.length
    ? visible.map(taskHTML).join("")
    : `
      <div class="empty">

        <strong>
          ${
            $("search").value
              ? "No tasks match your search."
              : "Nothing here yet."
          }
        </strong>

        <span>
          ${
            $("search").value
              ? "Try another search."
              : "Add your first task above."
          }
        </span>

      </div>
    `;
}


/* -----------------------------
   ADD TASK
----------------------------- */

function add() {

  const title =
    $("task-input").value.trim();

  if (!title) {

    $("task-input").focus();

    return;
  }


  const task = {

    id: crypto.randomUUID(),

    title,

    description: "",

    status: "todo",

    priority:
      $("priority").value,

    due:
      $("due-date").value,

    tags:
      $("tags")
        .value
        .split(",")
        .map(
          (tag) =>
            tag.trim().toLowerCase()
        )
        .filter(Boolean),

    created: Date.now()
  };


  tasks.unshift(task);

  save();


  $("task-input").value = "";

  $("priority").value = "";

  $("due-date").value = "";

  $("tags").value = "";


  currentList = "all";
  currentView = "list";


  updateNavigation();

  updateViewButtons();

  render();
}


/* -----------------------------
   EDIT TASK
----------------------------- */

function openEdit(id) {

  const task =
    tasks.find(
      (item) => item.id === id
    );

  if (!task) return;


  editingId = id;


  $("edit-title").value =
    task.title;

  $("edit-description").value =
    task.description || "";

  $("edit-status").value =
    task.status;

  $("edit-priority").value =
    task.priority || "";

  $("edit-date").value =
    task.due || "";

  $("edit-tags").value =
    (task.tags || []).join(", ");


  $("task-dialog").showModal();
}


/* -----------------------------
   SAVE EDIT
----------------------------- */

$("edit-form").addEventListener(
  "submit",
  (event) => {

    event.preventDefault();


    const task =
      tasks.find(
        (item) =>
          item.id === editingId
      );

    if (!task) return;


    task.title =
      $("edit-title").value.trim();

    task.description =
      $("edit-description").value;

    task.status =
      $("edit-status").value;

    task.priority =
      $("edit-priority").value;

    task.due =
      $("edit-date").value;

    task.tags =
      $("edit-tags")
        .value
        .split(",")
        .map(
          (tag) =>
            tag.trim().toLowerCase()
        )
        .filter(Boolean);


    if (!task.title) {

      $("edit-title").focus();

      return;
    }


    save();

    $("task-dialog").close();

    render();
  }
);


/* -----------------------------
   DELETE TASK
----------------------------- */

$("delete-button").onclick = () => {

  if (
    !confirm(
      "Delete this task?"
    )
  ) {
    return;
  }


  tasks =
    tasks.filter(
      (task) =>
        task.id !== editingId
    );


  save();

  $("task-dialog").close();

  render();
};


/* -----------------------------
   ADD BUTTON
----------------------------- */

$("add-button").onclick = add;


$("task-input").onkeydown = (event) => {

  if (event.key === "Enter") {

    event.preventDefault();

    add();
  }
};


/* -----------------------------
   SEARCH + FILTERS
----------------------------- */

$("search").oninput = render;

$("status-filter").onchange = render;

$("priority-filter").onchange = render;


/* -----------------------------
   NAVIGATION
----------------------------- */

function updateNavigation() {

  document
    .querySelectorAll(
      "#smart-lists button"
    )
    .forEach((button) => {

      button.classList.toggle(
        "nav-active",
        button.dataset.list === currentList
      );

    });
}


document
  .querySelectorAll(
    "#smart-lists button"
  )
  .forEach((button) => {

    button.onclick = () => {

      currentList =
        button.dataset.list;


      if (
        currentList === "calendar"
      ) {

        currentView =
          "calendar";

      } else {

        currentView =
          "list";
      }


      updateNavigation();

      updateViewButtons();

      render();
    };
  });


/* -----------------------------
   LIST / BOARD / CALENDAR BUTTONS
----------------------------- */

function updateViewButtons() {

  document
    .querySelectorAll(
      ".view-tabs button"
    )
    .forEach((button) => {

      button.classList.toggle(
        "selected",
        button.dataset.view === currentView
      );

    });
}


document
  .querySelectorAll(
    ".view-tabs button"
  )
  .forEach((button) => {

    button.onclick = () => {

      currentView =
        button.dataset.view;


      if (
        currentView === "calendar"
      ) {

        currentList =
          "calendar";

      } else if (
        currentList === "calendar"
      ) {

        currentList =
          "all";
      }


      updateNavigation();

      updateViewButtons();

      render();
    };
  });


/* -----------------------------
   TASK CLICKING
----------------------------- */

$("task-area").onclick = (event) => {

  const target =
    event.target.closest(
      "[data-complete],[data-edit]"
    );


  if (!target) return;


  const id =
    target.dataset.complete ||
    target.dataset.edit;


  if (target.dataset.complete) {

    const task =
      tasks.find(
        (item) => item.id === id
      );

    if (!task) return;


    task.status =
      task.status === "done"
        ? "todo"
        : "done";


    save();

    render();

    return;
  }


  if (target.dataset.edit) {

    openEdit(id);

  }
};


/* -----------------------------
   DRAG & DROP BOARD
----------------------------- */

document.addEventListener(
  "dragstart",
  (event) => {

    const card =
      event.target.closest(
        ".task"
      );

    if (!card) return;


    event.dataTransfer.setData(
      "text/plain",
      card.dataset.id
    );
  }
);


document.addEventListener(
  "dragover",
  (event) => {

    if (
      event.target.closest(
        ".column"
      )
    ) {
      event.preventDefault();
    }
  }
);


document.addEventListener(
  "drop",
  (event) => {

    const column =
      event.target.closest(
        ".column"
      );

    if (!column) return;


    const id =
      event.dataTransfer.getData(
        "text/plain"
      );


    const task =
      tasks.find(
        (item) => item.id === id
      );

    if (!task) return;


    task.status =
      column.dataset.status;


    save();

    render();
  }
);


/* -----------------------------
   INITIAL LOAD
----------------------------- */

updateNavigation();

updateViewButtons();

render();
