const clock =
  document.getElementById("clock");

const dayBar =
  document.getElementById("dayBar");

const currentActivity =
  document.getElementById("currentActivity");

const activityBar =
  document.getElementById("activityBar");

const activityStart =
  document.getElementById("activityStart");

const activityEnd =
  document.getElementById("activityEnd");

const scheduleList =
  document.getElementById("scheduleList");



/*
 * ================================
 * TIME UTILITIES
 * ================================
 */

function timeToMinutes(time) {
  const [hour, minute] =
    time.split(":").map(Number);

  return hour * 60 + minute;
}


function getWIBTime() {

  const now = new Date();

  const parts =
    new Intl.DateTimeFormat("en-US", {
      timeZone: "Asia/Jakarta",

      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",

      hour12: false
    }).formatToParts(now);


  const values = {};

  parts.forEach(part => {

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

  const now = getWIBTime();

  return [
    String(now.hour).padStart(2, "0"),
    String(now.minute).padStart(2, "0"),
    String(now.second).padStart(2, "0")
  ].join(":");
}



/*
 * ================================
 * RENDER SCHEDULE
 * ================================
 */

function renderSchedule() {

  scheduleList.innerHTML = "";


  schedule.forEach((item, index) => {

    const element =
      document.createElement("div");


    element.className = "item";

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


    scheduleList.appendChild(element);

  });

}



/*
 * ================================
 * FIND CURRENT ACTIVITY
 * ================================
 */

function getCurrentActivity(currentMinutes) {

  for (
    let i = 0;
    i < schedule.length;
    i++
  ) {

    const item = schedule[i];

    const start =
      timeToMinutes(item.start);

    const end =
      timeToMinutes(item.end);


    /*
     * Normal activity
     *
     * contoh:
     * 08:00 → 10:00
     */

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

    }


    /*
     * Overnight activity
     *
     * contoh:
     * 23:00 → 06:00
     */

    else {

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

  }


  return null;
}



/*
 * ================================
 * UPDATE ACTIVITY STATES
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


      element.classList.remove(
        "active"
      );

      element.classList.remove(
        "done"
      );


      if (index === currentIndex) {

        element.classList.add(
          "active"
        );

        return;
      }


      const end =
        timeToMinutes(item.end);


      if (
        end <= currentMinutes &&
        timeToMinutes(item.start) <= end
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

  let start =
    timeToMinutes(item.start);

  let end =
    timeToMinutes(item.end);


  /*
   * Overnight
   */

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


  /*
   * Normal
   */

  const duration =
    end - start;

  const elapsed =
    currentMinutes - start;


  return (
    elapsed / duration
  ) * 100;

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
   * Clock
   */

  clock.textContent =
    formatClock();


  /*
   * 24 hour progress
   */

  const dayProgress =
    (
      currentMinutes / 1440
    ) * 100;


  dayBar.style.width =
    `${dayProgress}%`;


  /*
   * Current activity
   */

  const current =
    getCurrentActivity(
      currentMinutes
    );


  /*
   * Tidak ada aktivitas
   */

  if (!current) {

    currentActivity.textContent =
      "Tidak ada aktivitas";

    activityBar.style.width =
      "0%";

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
   * Ada aktivitas
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


  activityBar.style.width =
    `${Math.min(
      Math.max(progress, 0),
      100
    )}%`;


  updateScheduleStates(
    currentMinutes,
    current.index
  );

}



/*
 * ================================
 * START APP
 * ================================
 */

renderSchedule();

update();


setInterval(
  update,
  1000
);
