const clock =
  document.getElementById("clock");

const dayBar =
  document.getElementById("dayBar");

const dayPercent =
  document.getElementById("dayPercent");

const currentActivity =
  document.getElementById("currentActivity");

const activityBar =
  document.getElementById("activityBar");

const activityPercent =
  document.getElementById("activityPercent");

const activityStart =
  document.getElementById("activityStart");

const activityEnd =
  document.getElementById("activityEnd");

const scheduleList =
  document.getElementById("scheduleList");

const scheduleCount =
  document.getElementById("scheduleCount");


/*
 * ================================
 * TIME UTILITIES
 * ================================
 */

function timeToMinutes(time) {
  const [hour, minute] =
    time.split(":").map(Number);

  return (
    hour * 60 +
    minute
  );
}


function getWIBTime() {
  const now = new Date();

  const parts =
    new Intl.DateTimeFormat("en-US", {
      timeZone: "Asia/Jakarta",

      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",

      hourCycle: "h23"
    }).formatToParts(now);

  const values = {};

  parts.forEach((part) => {
    if (part.type !== "literal") {
      values[part.type] =
        Number(part.value);
    }
  });

  return {
    hour: values.hour,
    minute: values.minute,
    second: values.second
  };
}


function formatClock() {
  const now =
    getWIBTime();

  return [
    String(now.hour).padStart(2, "0"),
    String(now.minute).padStart(2, "0"),
    String(now.second).padStart(2, "0")
  ].join(":");
}


function clamp(
  value,
  min = 0,
  max = 100
) {
  return Math.min(
    Math.max(value, min),
    max
  );
}


function formatPercent(value) {
  return `${Math.round(clamp(value))}%`;
}



/*
 * ================================
 * RENDER SCHEDULE
 * ================================
 */

function renderSchedule() {
  scheduleList.innerHTML = "";

  scheduleCount.textContent =
    `${schedule.length} aktivitas`;

  schedule.forEach(
    (item, index) => {

      const element =
        document.createElement("div");

      element.className =
        "item";

      element.id =
        `schedule-${index}`;

      element.innerHTML = `
        <div class="item-time">
          ${item.start}
        </div>

        <div class="item-name">
          ${item.name}
        </div>
      `;

      scheduleList.appendChild(
        element
      );
    }
  );
}



/*
 * ================================
 * FIND CURRENT ACTIVITY
 * ================================
 */

function getCurrentActivity(
  currentMinutes
) {

  for (
    let i = 0;
    i < schedule.length;
    i++
  ) {

    const item =
      schedule[i];

    const start =
      timeToMinutes(
        item.start
      );

    const end =
      timeToMinutes(
        item.end
      );


    // Normal activity
    if (start <= end) {

      if (
        currentMinutes >= start &&
        currentMinutes < end
      ) {
        return {
          item,
          index: i
        };
      }

      continue;
    }


    // Overnight activity
    if (
      currentMinutes >= start ||
      currentMinutes < end
    ) {

      return {
        item,
        index: i
      };
    }
  }

  return null;
}



/*
 * ================================
 * UPDATE SCHEDULE STATES
 * ================================
 */

function updateScheduleStates(
  currentMinutes,
  currentIndex
) {

  schedule.forEach(
    (item, index) => {

      const element =
        document.getElementById(
          `schedule-${index}`
        );

      if (!element) {
        return;
      }

      element.classList.remove(
        "active",
        "done"
      );


      // Current
      if (
        index === currentIndex
      ) {

        element.classList.add(
          "active"
        );

        return;
      }


      const start =
        timeToMinutes(
          item.start
        );

      const end =
        timeToMinutes(
          item.end
        );


      // Normal finished activity
      if (
        start <= end &&
        currentMinutes >= end
      ) {

        element.classList.add(
          "done"
        );
      }
    }
  );
}



/*
 * ================================
 * ACTIVITY PROGRESS
 * ================================
 */

function calculateActivityProgress(
  item,
  currentMinutes
) {

  const start =
    timeToMinutes(
      item.start
    );

  const end =
    timeToMinutes(
      item.end
    );


  // Overnight
  if (end < start) {

    const duration =
      (1440 - start) + end;

    let elapsed;

    if (
      currentMinutes >= start
    ) {

      elapsed =
        currentMinutes - start;

    } else {

      elapsed =
        (1440 - start) +
        currentMinutes;
    }

    return (
      elapsed / duration
    ) * 100;
  }


  // Normal
  const duration =
    end - start;

  if (duration <= 0) {
    return 100;
  }

  const elapsed =
    currentMinutes - start;

  return (
    elapsed / duration
  ) * 100;
}



/*
 * ================================
 * ANIMATE NUMBER
 * ================================
 */

function updatePercentText(
  element,
  value
) {

  const nextValue =
    Math.round(
      clamp(value)
    );

  const currentValue =
    Number(
      element.dataset.value || 0
    );

  if (
    nextValue === currentValue
  ) {
    element.textContent =
      `${nextValue}%`;

    return;
  }

  element.dataset.value =
    String(nextValue);

  element.animate(
    [
      {
        transform:
          "translateY(3px)",
        opacity: 0.55
      },
      {
        transform:
          "translateY(0)",
        opacity: 1
      }
    ],
    {
      duration: 180,
      easing:
        "cubic-bezier(.22,1,.36,1)"
    }
  );

  element.textContent =
    `${nextValue}%`;
}



/*
 * ================================
 * SET PROGRESS
 * ================================
 */

function setProgress(
  element,
  percent
) {

  const safePercent =
    clamp(percent);

  element.style.width =
    `${safePercent}%`;

  const progressBar =
    element.parentElement;

  if (
    progressBar &&
    progressBar.getAttribute("role") ===
      "progressbar"
  ) {

    progressBar.setAttribute(
      "aria-valuenow",
      String(
        Math.round(
          safePercent
        )
      )
    );
  }
}



/*
 * ================================
 * MAIN UPDATE
 * ================================
 */

function update() {

  const now =
    getWIBTime();


  const currentMinutes =
    now.hour * 60 +
    now.minute +
    now.second / 60;


  /*
   * CLOCK
   */

  clock.textContent =
    formatClock();


  /*
   * DAY PROGRESS
   */

  const dayProgress =
    (
      currentMinutes / 1440
    ) * 100;

  setProgress(
    dayBar,
    dayProgress
  );

  updatePercentText(
    dayPercent,
    dayProgress
  );


  /*
   * CURRENT ACTIVITY
   */

  const current =
    getCurrentActivity(
      currentMinutes
    );


  /*
   * NO ACTIVITY
   */

  if (!current) {

    currentActivity.textContent =
      "Tidak ada aktivitas";

    setProgress(
      activityBar,
      0
    );

    updatePercentText(
      activityPercent,
      0
    );

    activityStart.textContent =
      "--:--";

    activityEnd.textContent =
      "--:--";

    updateScheduleStates(
      currentMinutes,
      -1
    );

    return;
  }


  /*
   * ACTIVE ACTIVITY
   */

  const item =
    current.item;


  currentActivity.textContent =
    item.name;

  activityStart.textContent =
    item.start;

  activityEnd.textContent =
    item.end;


  const progress =
    calculateActivityProgress(
      item,
      currentMinutes
    );


  setProgress(
    activityBar,
    progress
  );

  updatePercentText(
    activityPercent,
    progress
  );


  updateScheduleStates(
    currentMinutes,
    current.index
  );
}



/*
 * ================================
 * START
 * ================================
 */

renderSchedule();

update();


setInterval(
  update,
  1000
);