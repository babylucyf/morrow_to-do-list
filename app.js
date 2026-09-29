const storeKey = "morrow-vanilla-tasks";

let tasks = JSON.parse(localStorage.getItem(storeKey) || "[]");
let currentList = "all";
let currentView = "list";
let editingId = null;
let calendarDate = new Date();

const $ = (id) => document.getElementById(id);

const today = () => new Date().toISOString().slice(0, 10);

const save = () =>
  localStorage.setItem(storeKey, JSON.stringify(tasks));

const esc = (value) =>
  String(value).replace(
    /[&<>'"]/g,
    (char) =>
      ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        "'": "&#39;",
        '"': "&quot;"
      })[char]
  );

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

function calendarMonthLabel(date) {
  return date.toLocaleDateString("en-US", {
    month: "long",
    year: "numeric"
  });
}

function filtered() {
  const search = $("search").value.toLowerCase();
  const status = $("status-filter").value;
  const priority = $("priority-filter").value;

  return tasks.filter((task) => {
    if (
      currentList === "today" &&
      task.due !== today()
    ) {
      return false;
    }

    if (
      currentList === "upcoming" &&
      (!task.due ||
        task.due <= today() ||
        task.status === "done")
    ) {
      return false;
    }

    if (
      currentList === "overdue" &&
      (!task.due ||
        task.due >= today() ||
        task.status === "done")
    ) {
      return false;
    }

    if (
      currentList === "completed" &&
      task.status !== "done"
    ) {
      return false;
    }

    if (
      status &&
      task.status !== status
    ) {
      return false;
    }

    if (
      priority &&
      task.priority !== priority
    ) {
      return false;
    }

    return (
      !search ||
      [
        task.title,
        task.description,
        ...task.tags
      ]
        .join(" ")
        .toLowerCase()
        .includes(search)
    );
  });
}

function taskHTML(task) {
  return `
    <article
      class="task ${task.status === "done" ? "done" : ""}"
      draggable="true"
      data-id="${task.id}"
    >
      <button
        class="check"
        data-complete="${task.id}"
        aria-label="Complete ${esc(task.title)}"
      >
        ${task.status === "done" ? "✓" : ""}
      </button>

      <button
        class="task-info"
        data-edit="${task.id}"
      >
        <span class="task-title">
          ${esc(task.title)}
        </span>

        <span class="meta">
          ${
            task.priority
              ? `<b class="${task.priority}">
                  ${task.priority.toUpperCase()}
                </b>`
              : ""
          }

          ${
            task.due
              ? `<span>◷ ${formatDate(task.due)}</span>`
              : ""
          }

          ${task.tags
            .map(
              (tag) =>
                `<span class="tag">
                  #${esc(tag)}
                </span>`
            )
            .join("")}
        </span>
      </button>
    </article>
  `;
}

function renderCalendar() {
  const area = $("task-area");

  const year = calendarDate.getFullYear();
  const month = calendarDate.getMonth();

  const firstDay = new Date(year, month, 1);
  const startDay = firstDay.getDay();

  const daysInMonth = new Date(
    year,
    month + 1,
    0
  ).getDate();

  const previousMonthDays = new Date(
    year,
    month,
    0
  ).getDate();

  const cells = [];

  for (let i = 0; i < 42; i++) {
    const dayNumber =
      i - startDay + 1;

    let cellDate;
    let isCurrentMonth = true;

    if (dayNumber < 1) {
      cellDate = new Date(
        year,
        month - 1,
        previousMonthDays + dayNumber
      );

      isCurrentMonth = false;
    } else if (dayNumber > daysInMonth) {
      cellDate = new Date(
        year,
        month + 1,
        dayNumber - daysInMonth
      );

      isCurrentMonth = false;
    } else {
      cellDate = new Date(
        year,
        month,
        dayNumber
      );
    }

    const isoDate = dateToISO(cellDate);
    const isToday = isoDate === today();

    const dayTasks = tasks.filter(
      (task) =>
        task.due === isoDate
    );

    cells.push(`
      <div
        class="calendar-day
          ${isCurrentMonth ? "" : "muted"}
          ${isToday ? "today" : ""}"
      >
        <span class="calendar-number">
          ${cellDate.getDate()}
        </span>

        <div class="calendar-tasks">
          ${dayTasks
            .slice(0, 3)
            .map(
              (task) => `
                <button
                  class="calendar-task
                    ${task.status === "done" ? "done" : ""}"
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
              ? `<span class="calendar-more">
                  +${dayTasks.length - 3} more
                </span>`
              : ""
          }
        </div>
      </div>
    `);
  }

  area.className = "calendar";

  area.innerHTML = `
    <div class="calendar-header">
      <button
        type="button"
        id="calendar-prev"
        class="secondary"
      >
        ‹
      </button>

      <strong>
        ${calendarMonthLabel(calendarDate)}
      </strong>

      <div class="calendar-actions">
        <button
          type="button"
          id="calendar-today"
          class="secondary"
        >
          Today
        </button>

        <button
          type="button"
          id="calendar-next"
          class="secondary"
        >
          ›
        </button>
      </div>
    </div>

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
      ${cells.join("")}
    </div>
  `;

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

function render() {
  const visible = filtered();
  const area = $("task-area");

  $("all-count").textContent =
    tasks.length;

  /*
    TOP SUMMARY
    -------------------------
    1. If there are tasks today:
       Focus for today
       3 tasks remain

    2. If today is empty but there
       are future tasks:
       Up next
       Finish portfolio
       Due Sep 30

    3. If there are no future tasks:
       You're all caught up
       No upcoming tasks
  */

  const todayTasks = tasks.filter(
    (task) =>
      task.due === today() &&
      task.status !== "done"
  );

  const upcomingTasks = tasks
    .filter(
      (task) =>
        task.due &&
        task.due > today() &&
        task.status !== "done"
    )
    .sort(
      (a, b) =>
        a.due.localeCompare(b.due)
    );

  const focusLabel =
    $("focus-label");

  const focusText =
    $("focus-text");

  const focusDue =
    $("focus-due");

  if (todayTasks.length > 0) {
    focusLabel.textContent =
      "Focus for today";

    focusText.textContent =
      `${todayTasks.length} task${
        todayTasks.length === 1
          ? ""
          : "s"
      } remain`;

    focusDue.textContent = "";

  } else if (
    upcomingTasks.length > 0
  ) {
    const nextTask =
      upcomingTasks[0];

    focusLabel.textContent =
      "Up next";

    focusText.textContent =
      nextTask.title;

    const nextDate =
      new Date(
        `${nextTask.due}T00:00:00`
      );

    focusDue.textContent =
      `Due ${nextDate.toLocaleDateString(
        "en-US",
        {
          month: "short",
          day: "numeric"
        }
      )}`;

  } else {
    focusLabel.textContent =
      "You're all caught up";

    focusText.textContent =
      "No upcoming tasks";

    focusDue.textContent = "";
  }

  const completed =
    tasks.filter(
      (task) =>
        task.status === "done"
    ).length;

  $("progress-text").textContent =
    `${completed} of ${tasks.length} completed`;

  $("progress-bar").style.width =
    `${
      tasks.length
        ? (completed / tasks.length) * 100
        : 0
    }%`;

  $("page-title").textContent = {
    all: "All tasks",
    today: "Today",
    upcoming: "Upcoming",
    overdue: "Overdue",
    completed: "Completed"
  }[currentList];

  if (currentView === "calendar") {
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
                  in_progress:
                    "IN PROGRESS",
                  done: "DONE"
                }[status]
              }
            </h2>

            ${visible
              .filter(
                (task) =>
                  task.status ===
                  status
              )
              .map(taskHTML)
              .join("")}
          </section>
        `
      )
      .join("");

  } else {
    area.className = "task-list";

    area.innerHTML =
      visible.length
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
              Add your first task above.
            </span>
          </div>
        `;
  }
}

function add() {
  const title =
    $("task-input").value.trim();

  if (!title) {
    $("task-input").focus();
    return;
  }

  tasks.unshift({
    id: crypto.randomUUID(),
    title,
    description: "",
    status: "todo",
    priority: $("priority").value,
    due: $("due-date").value,
    tags: $("tags")
      .value
      .split(",")
      .map((tag) =>
        tag.trim().toLowerCase()
      )
      .filter(Boolean),
    created: Date.now()
  });

  save();

  $("task-input").value = "";
  $("priority").value = "";
  $("due-date").value = "";
  $("tags").value = "";

  render();
}

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
    task.description;

  $("edit-status").value =
    task.status;

  $("edit-priority").value =
    task.priority;

  $("edit-date").value =
    task.due;

  $("edit-tags").value =
    task.tags.join(", ");

  $("task-dialog").showModal();
}

$("add-button").onclick = add;

$("task-input").onkeydown = (event) => {
  if (event.key === "Enter") {
    add();
  }
};

$("details-toggle")?.addEventListener(
  "click",
  () => {}
);

$("search").oninput = render;

$("status-filter").onchange =
  render;

$("priority-filter").onchange =
  render;

document
  .querySelectorAll(
    "#smart-lists button"
  )
  .forEach((button) => {
    button.onclick = () => {
      currentList =
        button.dataset.list;

      document
        .querySelectorAll(
          "#smart-lists button"
        )
        .forEach((item) =>
          item.classList.toggle(
            "nav-active",
            item === button
          )
        );

      render();
    };
  });

document
  .querySelectorAll(
    ".view-tabs button"
  )
  .forEach((button) => {
    button.onclick = () => {
      currentView =
        button.dataset.view;

      document
        .querySelectorAll(
          ".view-tabs button"
        )
        .forEach((item) =>
          item.classList.toggle(
            "selected",
            item === button
          )
        );

      render();
    };
  });

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

  } else {
    openEdit(id);
  }
};

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

    Object.assign(task, {
      title:
        $("edit-title").value.trim(),

      description:
        $("edit-description").value,

      status:
        $("edit-status").value,

      priority:
        $("edit-priority").value,

      due:
        $("edit-date").value,

      tags: $("edit-tags")
        .value
        .split(",")
        .map((tag) =>
          tag.trim().toLowerCase()
        )
        .filter(Boolean)
    });

    save();

    $("task-dialog").close();

    render();
  }
);

$("delete-button").onclick = () => {
  if (
    confirm(
      "Delete this task?"
    )
  ) {
    tasks =
      tasks.filter(
        (task) =>
          task.id !== editingId
      );

    save();

    $("task-dialog").close();

    render();
  }
};

document.addEventListener(
  "dragstart",
  (event) => {
    const card =
      event.target.closest(
        ".task"
      );

    if (card) {
      event.dataTransfer.setData(
        "text/plain",
        card.dataset.id
      );
    }
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

    if (task) {
      task.status =
        column.dataset.status;

      save();
      render();
    }
  }
);

render();
