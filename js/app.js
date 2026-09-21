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
 * CONSTANT
 * ================================
 */

const WIB_OFFSET_MS =
  7 * 60 * 60 * 1000;

const DAY_MS =
  24 * 60 * 60 * 1000;



/*
 * ================================
 * STATE
 * ================================
 */

let lastSecond = -1;

let lastActivityIndex = -1;

let lastDayPercent = -1;

let lastActivityPercent = -1;

let displayedDayProgress = 0;

let displayedActivityProgress = 0;

let targetDayProgress = 0;

let targetActivityProgress = 0;



/*
 * ================================
 * TIME UTILITIES
 * ================================
 */


/*
 * "09:30" -> 570
 */

function timeToMinutes(time) {

  const [
    hour,
    minute
  ] = time
    .split(":")
    .map(Number);

  return (
    hour * 60 +
    minute
  );
}



/*
 * Get current WIB time
 *
 * Menggunakan timestamp langsung
 * supaya animation frame tidak perlu
 * menjalankan Intl setiap frame.
 */

function getWIBSecondsOfDay() {

  const now =
    Date.now();

  const wibMs =
    now + WIB_OFFSET_MS;

  const dayMs =
    (
      (
        wibMs % DAY_MS
      ) +
      DAY_MS
    ) % DAY_MS;

  return dayMs / 1000;
}



/*
 * Get WIB hour/minute/second
 */

function getWIBTime() {

  const totalSeconds =
    Math.floor(
      getWIBSecondsOfDay()
    );


  const hour =
    Math.floor(
      totalSeconds / 3600
    );


  const minute =
    Math.floor(
      (
        totalSeconds % 3600
      ) / 60
    );


  const second =
    totalSeconds % 60;


  return {
    hour,
    minute,
    second
  };
}



/*
 * Get current WIB time
 * dalam menit dengan desimal.
 *
 * Contoh:
 *
 * 09:30:00 = 570
 * 09:30:30 = 570.5
 * 09:30:45 = 570.75
 */

function getCurrentMinutes() {

  return (
    getWIBSecondsOfDay() / 60
  );
}



/*
 * Format clock
 */

function formatClock() {

  const now =
    getWIBTime();


  return [
    String(now.hour)
      .padStart(2, "0"),

    String(now.minute)
      .padStart(2, "0"),

    String(now.second)
      .padStart(2, "0")
  ].join(":");
}



/*
 * Clamp value
 */

function clamp(
  value,
  min = 0,
  max = 100
) {

  return Math.min(
    Math.max(
      value,
      min
    ),
    max
  );
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
        document.createElement(
          "div"
        );


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


    /*
     * Normal activity
     */

    if (
      start <= end
    ) {

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



    /*
     * Overnight activity
     */

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


  /*
   * Overnight activity
   */

  if (
    end < start
  ) {

    const duration =
      (
        1440 - start
      ) + end;


    let elapsed;


    if (
      currentMinutes >= start
    ) {

      elapsed =
        currentMinutes - start;

    } else {

      elapsed =
        (
          1440 - start
        ) + currentMinutes;
    }


    return clamp(
      (
        elapsed / duration
      ) * 100
    );
  }



  /*
   * Normal activity
   */

  const duration =
    end - start;


  if (
    duration <= 0
  ) {

    return 100;
  }


  const elapsed =
    currentMinutes - start;


  return clamp(
    (
      elapsed / duration
    ) * 100
  );
}



/*
 * ================================
 * PROGRESS BAR
 * ================================
 */

function setProgress(
  element,
  percent
) {

  const value =
    clamp(percent);


  element.style.width =
    `${value}%`;


  const progressBar =
    element.parentElement;


  if (
    progressBar &&
    progressBar.getAttribute(
      "role"
    ) === "progressbar"
  ) {

    progressBar.setAttribute(
      "aria-valuenow",
      value.toFixed(2)
    );
  }
}



/*
 * ================================
 * PERCENT TEXT
 * ================================
 */

function updatePercentText(
  element,
  value
) {

  const formatted =
    clamp(value)
      .toFixed(2);


  const text =
    `${formatted}%`;


  /*
   * Jangan update DOM kalau
   * nilainya memang belum berubah.
   */

  if (
    element.textContent === text
  ) {

    return;
  }


  element.textContent =
    text;
}



/*
 * ================================
 * SCHEDULE STATE
 * ================================
 */

function updateScheduleStates(
  currentMinutes,
  currentIndex
) {

  /*
   * Kalau activity belum berubah,
   * tidak perlu render ulang.
   */

  if (
    currentIndex ===
    lastActivityIndex
  ) {

    return;
  }


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


      /*
       * Active
       */

      if (
        index === currentIndex
      ) {

        element.classList.add(
          "active"
        );

        return;
      }


      /*
       * Done
       */

      const start =
        timeToMinutes(
          item.start
        );


      const end =
        timeToMinutes(
          item.end
        );


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


  lastActivityIndex =
    currentIndex;
}



/*
 * ================================
 * CURRENT ACTIVITY
 * ================================
 */

function updateCurrentActivity(
  current,
  currentMinutes
) {

  const currentIndex =
    current
      ? current.index
      : -1;


  /*
   * Tidak ada perubahan activity.
   */

  if (
    currentIndex ===
    lastActivityIndex
  ) {

    return;
  }



  /*
   * Tidak ada aktivitas
   */

  if (!current) {

    currentActivity.textContent =
      "Tidak ada aktivitas";


    activityStart.textContent =
      "--:--";


    activityEnd.textContent =
      "--:--";


    setProgress(
      activityBar,
      0
    );


    updatePercentText(
      activityPercent,
      0
    );


    updateScheduleStates(
      currentMinutes,
      -1
    );


    lastActivityPercent =
      0;


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


  updateScheduleStates(
    currentMinutes,
    currentIndex
  );
}



/*
 * ================================
 * SMOOTH PROGRESS
 * ================================
 *
 * Fungsi ini berjalan setiap
 * animation frame.
 *
 * Progress dihitung berdasarkan
 * waktu sebenarnya, bukan berdasarkan
 * jumlah frame.
 */

function updateSmoothProgress() {

  const currentMinutes =
    getCurrentMinutes();



  /*
   * ================================
   * DAY PROGRESS
   * ================================
   */

  targetDayProgress =
    (
      currentMinutes / 1440
    ) * 100;



  /*
   * ================================
   * CURRENT ACTIVITY
   * ================================
   */

  const current =
    getCurrentActivity(
      currentMinutes
    );



  /*
   * ================================
   * ACTIVITY PROGRESS
   * ================================
   */

  if (current) {

    targetActivityProgress =
      calculateActivityProgress(
        current.item,
        currentMinutes
      );

  } else {

    targetActivityProgress =
      0;
  }



  /*
   * ================================
   * DISPLAY PROGRESS
   * ================================
   *
   * Tidak lagi pakai interpolation
   * yang bisa terasa berhenti.
   *
   * Nilai bar mengikuti waktu
   * secara langsung.
   */

  displayedDayProgress =
    targetDayProgress;


  displayedActivityProgress =
    targetActivityProgress;



  /*
   * ================================
   * DRAW DAY BAR
   * ================================
   */

  setProgress(
    dayBar,
    displayedDayProgress
  );


  updatePercentText(
    dayPercent,
    displayedDayProgress
  );



  /*
   * ================================
   * DRAW ACTIVITY BAR
   * ================================
   */

  setProgress(
    activityBar,
    displayedActivityProgress
  );


  updatePercentText(
    activityPercent,
    displayedActivityProgress
  );
}



/*
 * ================================
 * LIGHT UI UPDATE
 * ================================
 *
 * Jalan setiap 250ms.
 *
 * Digunakan untuk:
 *
 * - clock
 * - current activity
 * - schedule state
 */

function updateUI() {

  const now =
    getWIBTime();


  /*
   * ================================
   * CLOCK
   * ================================
   */

  if (
    now.second !==
    lastSecond
  ) {

    clock.textContent =
      formatClock();


    lastSecond =
      now.second;
  }



  /*
   * ================================
   * CURRENT MINUTES
   * ================================
   */

  const currentMinutes =
    (
      now.hour * 60
    ) +
    now.minute +
    (
      now.second / 60
    );



  /*
   * ================================
   * CURRENT ACTIVITY
   * ================================
   */

  const current =
    getCurrentActivity(
      currentMinutes
    );


  const currentIndex =
    current
      ? current.index
      : -1;


  /*
   * Activity berubah
   */

  if (
    currentIndex !==
    lastActivityIndex
  ) {

    updateCurrentActivity(
      current,
      currentMinutes
    );
  }



  /*
   * ================================
   * SCHEDULE STATE
   * ================================
   */

  updateScheduleStates(
    currentMinutes,
    currentIndex
  );
}



/*
 * ================================
 * ANIMATION LOOP
 * ================================
 */

function animationLoop() {

  updateSmoothProgress();


  requestAnimationFrame(
    animationLoop
  );
}



/*
 * ================================
 * START APPLICATION
 * ================================
 */

renderSchedule();

updateUI();

animationLoop();



/*
 * ================================
 * UI UPDATE TIMER
 * ================================
 *
 * Clock dan schedule tidak perlu
 * di-update setiap frame.
 */

setInterval(
  updateUI,
  250
);