import { cities } from "./data.js";

const dummyEvent = {
  deltaX: 0, // Simulate no horizontal scroll
  deltaY: 0, // Simulate no vertical scroll
};
let wheelPosition = 0;
let activeIndex = 0;
let loadedData;
let pos_max = 3000;
const POS_MIN = 0;

const forecastLengthButton = document.getElementById("forecast-length-button");
const hourlySpan = document.getElementById("hourly-span");
const dailySpan = document.getElementById("daily-span");
const boringButton = document.getElementById("boring-view-button");
const weatherContainer = document.getElementById("weather-container");
const weatherContainerDay = document.getElementById("weather-container-day");
const boringViewContainer = document.getElementById("boring-view-container");
const citiesDropdownContainer = document.getElementById(
  "cities-dropdown-container"
);
const citiesDropdownBackground = document.getElementById(
  "cities-dropdown-background"
);
const backgroundVideo = document.getElementById("backgroundVideo");
const boringviewGrid = document.getElementById("boring-view-grid");
const hour1 = document.getElementById("hour1");
const hour2 = document.getElementById("hour2");
const clockSelectedCity = document.getElementById("clock-selected-city");
const clockWeekday = document.getElementById("clock-weekday");
const clockDay = document.getElementById("clock-day");
const clockMonth = document.getElementById("clock-month");

// Fragments for daily- and hourly/6-hour mode
const fragmentHourly = document.createDocumentFragment();
const fragmentDaily = document.createDocumentFragment();
const fragmentBoringView = document.createDocumentFragment();

let symbAndTextWrappers;
let symbAndTextWrappersDay;
let firstHourOfDay;
let firstDay;
let date;

let rains = [];
let winds = [];
let temperatures = [];
let images = [];
const weekdays = [
  "mandag",
  "tirsdag",
  "onsdag",
  "torsdag",
  "fredag",
  "lørdag",
  "søndag",
];
const citiesDivArray = [];

window.addEventListener("wheel", (e) => positionWeatherSymbols(e, loadedData));
forecastLengthButton.addEventListener("click", changeWeatherContainer);
boringButton.addEventListener("click", showBoringView);
clockSelectedCity.addEventListener("click", showCitiesDropdown);

document.addEventListener("DOMContentLoaded", () => {
  fillCitiesDropdown(cities);
  changeCity("Bergen");
  console.log("sjdfdsfkj");
});

let showCities = false;
function showCitiesDropdown() {
  showCities = !showCities;
  if (showCities) {
    citiesDropdownContainer.style.display = "flex";
    citiesDropdownBackground.style.display = "flex";
    boringViewContainer.style.display = "none";
    showBoring = false;
    boringButton.classList.remove("active");
    clockSelectedCity.classList.add("active");
  } else {
    citiesDropdownContainer.style.display = "none";
    citiesDropdownBackground.style.display = "none";
    clockSelectedCity.classList.remove("active");
  }
}

async function fetchWeatherData(city) {
  try {
    const response = await fetch(
      `https://api.met.no/weatherapi/locationforecast/2.0/compact?lat=${city.coordinates.lat}&lon=${city.coordinates.lon}`
    );
    if (!response.ok) {
      throw new Error("Network response not ok " + response.statusText);
    }
    const data = await response.json();
    return data;
  } catch (error) {
    console.error("Error fetching data:", error);
  }
}

function fillCitiesDropdown(data) {
  data.forEach((element) => {
    const city = createElementWithClass("div", "city");
    if (element.name === "Bergen") {
      city.classList.add("active");
    }
    city.textContent = element.name;
    city.addEventListener("click", () => {
      changeCity(city.textContent);
    });
    citiesDropdownContainer.appendChild(city);
    citiesDivArray.push(city);
  });
}

let lastCity = "Oslo";
function changeCity(cityName) {
  if (lastCity !== cityName) {
    let lastCityDiv = citiesDivArray.find(
      (city) => city.textContent === lastCity
    );
    lastCityDiv.classList.remove("active");
    let newCityDiv = citiesDivArray.find(
      (city) => city.textContent === cityName
    );
    newCityDiv.classList.add("active");
    lastCity = newCityDiv.textContent;
  }
  fetchWeatherData(cities.find((city) => city.name === cityName))
    .then((data) => {
      fillNormalView(data);
      clockSelectedCity.textContent = cityName;
    })
    .catch((error) => {
      console.error("Error fetching data:", error);
    });
}

let showBoring = false;
function showBoringView() {
  showBoring = !showBoring;
  if (showBoring) {
    boringViewContainer.style.display = "block";
    citiesDropdownContainer.style.display = "none";
    citiesDropdownBackground.style.display = "none";
    boringButton.classList.add("active");
    clockSelectedCity.classList.remove("active");
    showCities = false;
  } else {
    boringViewContainer.style.display = "none";
    boringButton.classList.remove("active");
  }
}

function positionWeatherSymbols(e, container) {
  let windowWidth = window.innerWidth;
  let maxDelta = Math.abs(e.deltaX) > Math.abs(e.deltaY) ? e.deltaX : e.deltaY;
  wheelPosition += maxDelta;

  if (wheelPosition < POS_MIN) {
    wheelPosition = POS_MIN;
  } else if (wheelPosition > pos_max) {
    wheelPosition = pos_max;
  }

  const segmentSize = pos_max / container.length;

  // Calculate the index based on the current wheelPosition
  activeIndex = Math.floor(wheelPosition / segmentSize);

  // Ensure the index is within the bounds of the array
  activeIndex = Math.max(0, Math.min(activeIndex, container.length - 1));

  container.forEach((wrapper, index) => {
    let distance = Math.abs(index - activeIndex);
    let scaleValueX = Math.max(2 - distance * 0.1, 0.1);
    let scaleValueY = 1 - distance * 0.1;
    let baseTranslateX = (index - activeIndex) * 100;
    let baseTranslateY = distance * 30;
    let adjustedTranslateX = baseTranslateX * scaleValueX;
    let adjustedTranslateY = baseTranslateY * scaleValueY;

    wrapper.style.transform = ` translateX(${adjustedTranslateX}%) translateY(${adjustedTranslateY}%)  scale(${
      (scaleValueX * windowWidth) / 1300
    })`;
  });
}

// Fill boring view/hour-by-hour forecast
function fillBoringView() {
  boringviewGrid.replaceChildren();
  const blankCell = document.createElement("div");
  fragmentBoringView.appendChild(blankCell);
  for (let i = 0; i < 24; i++) {
    // 24 Hours
    const formatHour = i <= 9 ? `0${i}` : `${i}`;
    createElementAndAppend(
      "div",
      "grid-hours",
      fragmentBoringView
    ).textContent = formatHour;
  }
  const startIndex = weekdays.indexOf(firstDay);
  for (let i = 0; i < 12; i++) {
    // 12 Weekdays
    createElementAndAppend("div", "grid-days", fragmentBoringView, {
      id: `day${i + 1}`,
    }).textContent = weekdays[(startIndex + i) % 7].replace(/ø/g, "o");
  }
  // Remove final day, as its least useful, is often undefined, and could use the extra space
  fragmentBoringView.lastChild.remove();

  let blankCellCount = 0;
  while (blankCellCount < parseInt(firstHourOfDay)) {
    createElementAndAppend("div", "grid-cells", fragmentBoringView);
    blankCellCount++;
  }
  let count = 0;
  while (count < images.length) {
    const cellWrapper = createElementWithClass("div", "grid-cells");
    // To know when 6Hour forecast starts
    if (!temperatures[count].startsWith("six")) {
      // 1-Hour
      createElementAndAppend("img", "boringImg", cellWrapper, {
        src: images[count].src,
        alt: images[count].alt,
      });
      createElementAndAppend("div", "boringRain", cellWrapper).textContent =
        rains[count];
      createElementAndAppend("div", "boringWind", cellWrapper).textContent =
        winds[count];
      createElementAndAppend(
        "div",
        "boringTemperature",
        cellWrapper
      ).textContent = temperatures[count];
    } else {
      // 6-Hour
      cellWrapper.className = "grid-cells-6-hour";
      createElementAndAppend("img", "boringImg", cellWrapper, {
        src: images[count].src,
        alt: images[count].alt,
      });
      createElementAndAppend("div", "boringRain", cellWrapper).textContent =
        rains[count];
      createElementAndAppend("div", "boringWind", cellWrapper).textContent =
        winds[count];
      createElementAndAppend(
        "div",
        "boringTemperature",
        cellWrapper
      ).textContent = temperatures[count].substring(3);
    }
    fragmentBoringView.appendChild(cellWrapper);
    count++;
  }
  boringviewGrid.appendChild(fragmentBoringView);
}

// Show local time on clock relative to time in the video, video starts at T-11H
function setClock() {
  const date = new Date();
  let localTimeHours = date.getHours();
  let lastSecond = -1;
  backgroundVideo.addEventListener("timeupdate", () => {
    const videoCurrentTime = Math.floor(backgroundVideo.currentTime);
    let adjustedTimeDate = date.getTime() - videoCurrentTime * 3600000;
    let adjustedDate = new Date(adjustedTimeDate);
    if (videoCurrentTime !== lastSecond) {
      let adjustedTime = (24 + (localTimeHours - (11 - videoCurrentTime))) % 24;
      if (adjustedTime <= 9) {
        hour1.textContent = "0";
        hour2.textContent = adjustedTime;
      } else {
        hour1.textContent = Math.floor(adjustedTime / 10);
        hour2.textContent = adjustedTime % 10;
      }
      lastSecond = adjustedTime;
    }
    let correctedWeekday = adjustedDate.toLocaleDateString("nb-NO", {
      weekday: "long",
    });
    if (correctedWeekday === "torsdag" || correctedWeekday === "tirsdag") {
      clockWeekday.textContent = correctedWeekday
        .slice(0, 4)
        .replace(/ø/g, "o");
    } else {
      clockWeekday.textContent = correctedWeekday
        .slice(0, 3)
        .replace(/ø/g, "o");
    }
    clockDay.textContent = adjustedDate.getDate();
    clockMonth.textContent = adjustedDate.toLocaleDateString("nb-NO", {
      month: "short",
    });
  });
}

let datapointCounter = 0;
function fillNormalView(data) {
  // Clear containers when city is changed
  weatherContainer.innerHTML = "";
  weatherContainerDay.innerHTML = "";

  rains = [];
  winds = [];
  temperatures = [];
  images = [];

  let previousDayDaily = "";
  let previousDayHourly = "";
  let prevDayEndDaily = "";

  let dailyTempMin = 999;
  let dailyTempMax = -999;
  let dailyRainMin = 999;
  let dailyRainMax = -999;
  let dailyWindMin = 999;
  let dailyWindMax = -999;

  data.properties.timeseries.forEach((forecast) => {
    let hourOfDay = forecast.time.substring(11, 13);
    let dayOfMonth = forecast.time.substring(8, 10);
    date = new Date(forecast.time);

    // This "if" will execute only once, on the first element/forecast
    if (prevDayEndDaily == "") {
      prevDayEndDaily = dayOfMonth;
      firstHourOfDay = hourOfDay;
      firstDay = date.toLocaleDateString("nb-NO", { weekday: "long" });
    }

    // Forecast lengths
    const image1Hour = forecast.data.next_1_hours?.summary.symbol_code;
    const image6Hour = forecast.data.next_6_hours?.summary.symbol_code;
    const imageHourly = image1Hour ?? image6Hour;

    const temp1Else6Hour = forecast.data.instant.details.air_temperature;
    const temp6HMin = forecast.data.next_6_hours?.details.air_temperature_min;
    const temp6HMax = forecast.data.next_6_hours?.details.air_temperature_max;

    const rain1Hour = forecast.data.next_1_hours?.details.precipitation_amount;
    const rain6Hour = forecast.data.next_6_hours?.details.precipitation_amount;

    const rain1HourMin =
      forecast.data.next_1_hours?.details.precipitation_amount_min;
    const rain1HourMax =
      forecast.data.next_1_hours?.details.precipitation_amount_max;
    const rain6HourMin =
      forecast.data.next_6_hours?.details.precipitation_amount_min;
    const rain6HourMax =
      forecast.data.next_6_hours?.details.precipitation_amount_max;
    const rainIntervalMin =
      rain1HourMin ?? rain1Hour ?? rain6HourMin ?? rain6Hour;
    const rainIntervalMax =
      rain1HourMax ?? rain1Hour ?? rain6HourMax ?? rain6Hour;

    const wind1Else6Hour = forecast.data.instant?.details.wind_speed;

    // Wrapper/container for texts and image
    const wrapperHourly = createElementWithClass("div", "wrapper");
    createElementAndAppend("div", "symbol-text", wrapperHourly).textContent =
      date.toLocaleTimeString("nb-NO", { hour: "2-digit", minute: "2-digit" });
    wrapperHourly.style.zIndex = 1000 - datapointCounter;
    const temperature = createElementAndAppend(
      "div",
      "temperature",
      wrapperHourly
    );
    temperature.textContent =
      formatRange(temp6HMin, temp6HMax, "°") ?? `${temp1Else6Hour}°`;
    const rain = createElementAndAppend("div", "rain", wrapperHourly);
    rain.textContent = formatRange(rainIntervalMin, rainIntervalMax, " mm");
    const wind = createElementAndAppend("div", "wind", wrapperHourly);
    wind.textContent = `${wind1Else6Hour} m/s`;

    forecast.data.next_1_hours !== undefined
      ? temperatures.push(temperature.textContent)
      : temperatures.push("six" + temperature.textContent);
    rains.push(rain.textContent);
    winds.push(wind.textContent);

    // Shows weekday on first and every subsequent new day, in hourly view
    if (dayOfMonth != previousDayHourly) {
      previousDayHourly = dayOfMonth;

      const weekdayCarrier = document.createElement("div");
      weekdayCarrier.className = "weekday-carrier";
      weekdayCarrier.textContent = date
        .toLocaleDateString("nb-NO", { weekday: "long" })
        .replace(/ø/g, "o");
      wrapperHourly.appendChild(weekdayCarrier);
    }

    const img = createElementAndAppend("img", "image", wrapperHourly, {
      src: `./assets/images/weather-icons/darkmode/${convertSymbolKeyToId(
        imageHourly
      )}.svg`,
      alt: imageHourly,
    });
    fragmentHourly.appendChild(wrapperHourly);
    images.push({ src: img.src, alt: img.alt });

    // Calculations for daily average ranges
    dailyTempMin = Math.min(dailyTempMin, parseFloat(temp1Else6Hour));
    dailyTempMax = Math.max(dailyTempMax, parseFloat(temp1Else6Hour));
    dailyRainMin = Math.min(dailyRainMin, parseFloat(rainIntervalMin));
    dailyRainMax = Math.max(dailyRainMax, parseFloat(rainIntervalMax));
    dailyWindMin = Math.min(dailyWindMin, parseFloat(wind1Else6Hour));
    dailyWindMax = Math.max(dailyWindMax, parseFloat(wind1Else6Hour));
    // Logic for daily
    if (previousDayDaily != dayOfMonth || prevDayEndDaily != dayOfMonth) {
      // Choose fitting forcast length for FIRST day and add image
      if (previousDayDaily == "") {
        previousDayDaily = dayOfMonth;
        const image12Hour = forecast.data.next_12_hours?.summary.symbol_code;
        const wrapperDaily = createElementWithClass("div", "wrapper");
        wrapperHourly.style.zIndex = 1000 - datapointCounter;
        let image;
        let alt;
        if (parseInt(hourOfDay) <= 16) {
          image = `./assets/images/weather-icons/darkmode/${convertSymbolKeyToId(
            image12Hour
          )}.svg`;
          alt = image12Hour;
        } else if (parseInt(hourOfDay) <= 22) {
          image = `./assets/images/weather-icons/darkmode/${convertSymbolKeyToId(
            image6Hour
          )}.svg`;
          alt = image6Hour;
        } else {
          image = `./assets/images/weather-icons/darkmode/${convertSymbolKeyToId(
            image1Hour
          )}.svg`;
          alt = image1Hour;
        }
        createElementAndAppend("img", "image", wrapperDaily, {
          src: image,
          alt: alt,
        });
        const weekday = (createElementAndAppend(
          "div",
          "symbol-text",
          wrapperDaily
        ).textContent = date
          .toLocaleDateString("nb-NO", { weekday: "long" })
          .replace(/ø/g, "o"));
        fragmentDaily.appendChild(wrapperDaily);
      }
      // Chose 06:00 as forecast start with 12-hour forcast length for daily weather image
      else if (hourOfDay == "06") {
        previousDayDaily = dayOfMonth;
        const image12Hour = forecast.data.next_12_hours?.summary.symbol_code;
        const imageDaily = image12Hour ?? image6Hour ?? image1Hour;
        if (imageDaily !== undefined) {
          // Last datapoint lacks forecast summary
          const image = `./assets/images/weather-icons/darkmode/${convertSymbolKeyToId(
            imageDaily
          )}.svg`;
          const wrapperDaily = createElementWithClass("div", "wrapper");
          createElementAndAppend(
            "div",
            "symbol-text",
            wrapperDaily
          ).textContent = date
            .toLocaleDateString("nb-NO", { weekday: "long" })
            .replace(/ø/g, "o");
          createElementAndAppend("img", "image", wrapperDaily, {
            src: image,
            alt: image12Hour ?? image6Hour ?? image1Hour,
          });
          wrapperDaily.style.zIndex = 1000 - datapointCounter;

          fragmentDaily.appendChild(wrapperDaily);
        }
      }
      // Calculate averages at the END of day for daily forecasts
      else if (hourOfDay == "00") {
        prevDayEndDaily = dayOfMonth;
        createElementAndAppend(
          "div",
          "temperature",
          fragmentDaily.lastChild
        ).textContent = formatRange(dailyTempMin, dailyTempMax, "°");
        createElementAndAppend(
          "div",
          "rain",
          fragmentDaily.lastChild
        ).textContent = formatRange(dailyRainMin, dailyRainMax, " mm");
        createElementAndAppend(
          "div",
          "wind",
          fragmentDaily.lastChild
        ).textContent = formatRange(dailyWindMin, dailyWindMax, " m/s");
        dailyTempMin = 999.0;
        dailyTempMax = -999.0;
        dailyRainMin = 999.0;
        dailyRainMax = -999;
        dailyWindMin = 999;
        dailyWindMax = -999;
      }
    }
    // Calculate averages at the LAST day for daily forecasts, -2 and not -1 because last datapoint is buggy
    if (data.properties.timeseries.length - 2 == datapointCounter) {
      createElementAndAppend(
        "div",
        "temperature",
        fragmentDaily.lastChild
      ).textContent = formatRange(dailyTempMin, dailyTempMax, "°");
      createElementAndAppend(
        "div",
        "rain",
        fragmentDaily.lastChild
      ).textContent = formatRange(dailyRainMin, dailyRainMax, " mm");
      createElementAndAppend(
        "div",
        "wind",
        fragmentDaily.lastChild
      ).textContent = formatRange(dailyWindMin, dailyWindMax, " m/s");
    }
    datapointCounter++;
  });
  // Remove buggy last data point from hourly
  fragmentHourly.lastChild.remove(fragmentHourly.length);

  // Remove last day if rain and wind is missing,
  if (
    fragmentDaily.lastChild.querySelector(".rain") == null ||
    fragmentDaily.lastChild.querySelector(".wind") == null ||
    fragmentDaily.lastChild.querySelector(".temperature") == null
  ) {
    fragmentDaily.lastChild.remove(fragmentDaily.length - 1);
  }

  weatherContainer.appendChild(fragmentHourly);
  weatherContainerDay.appendChild(fragmentDaily);
  symbAndTextWrappers = weatherContainer.querySelectorAll(".wrapper");
  symbAndTextWrappersDay = weatherContainerDay.querySelectorAll(".wrapper");
  fillBoringView();
  setClock();

  showDaymode
    ? (loadedData = symbAndTextWrappersDay)
    : (loadedData = symbAndTextWrappers);
  positionWeatherSymbols(dummyEvent, loadedData);
}

function formatRange(min, max, suffix = "") {
  if (min === undefined || max === undefined) {
    return undefined;
  }
  return min === max ? `${min}${suffix}` : `${min} - ${max}${suffix}`;
}

function createElementWithClass(elementType, className) {
  const element = document.createElement(elementType);
  element.className = className;
  return element;
}

function createElementAndAppend(
  elementType,
  className,
  parent,
  attributes = {}
) {
  const element = createElementWithClass(elementType, className);
  for (const key in attributes) {
    element.setAttribute(key, attributes[key]);
  }
  parent.appendChild(element);
  return element;
}

let showDaymode = true;
function changeWeatherContainer() {
  showDaymode = !showDaymode;
  if (showDaymode) {
    // Day-by-day-mode
    loadedData = symbAndTextWrappersDay;
    // Scroll speed
    pos_max = 3000;
    weatherContainer.style.display = "none";
    weatherContainerDay.style.display = "block";
    hourlySpan.classList.remove("active");
    dailySpan.classList.add("active");
  } else {
    // Hourly-mode
    loadedData = symbAndTextWrappers;
    pos_max = 35000;
    weatherContainer.style.display = "block";
    weatherContainerDay.style.display = "none";
    hourlySpan.classList.add("active");
    dailySpan.classList.remove("active");
  }
  // Reset wheel position, so it starts at beginning again
  wheelPosition = 0;
  positionWeatherSymbols(dummyEvent, loadedData);
}

const weatherSymbolKeys = {
  clearsky_day: "01d",
  clearsky_night: "01n",
  clearsky_polartwilight: "01m",
  fair_day: "02d",
  fair_night: "02n",
  fair_polartwilight: "02m",
  partlycloudy_day: "03d",
  partlycloudy_night: "03n",
  partlycloudy_polartwilight: "03m",
  cloudy: "04",
  rainshowers_day: "05d",
  rainshowers_night: "05n",
  rainshowers_polartwilight: "05m",
  rainshowersandthunder_day: "06d",
  rainshowersandthunder_night: "06n",
  rainshowersandthunder_polartwilight: "06m",
  sleetshowers_day: "07d",
  sleetshowers_night: "07n",
  sleetshowers_polartwilight: "07m",
  snowshowers_day: "08d",
  snowshowers_night: "08n",
  snowshowers_polartwilight: "08m",
  rain: "09",
  heavyrain: "10",
  heavyrainandthunder: "11",
  sleet: "12",
  snow: "13",
  snowandthunder: "14",
  fog: "15",
  sleetshowersandthunder_day: "20d",
  sleetshowersandthunder_night: "20n",
  sleetshowersandthunder_polartwilight: "20m",
  snowshowersandthunder_day: "21d",
  snowshowersandthunder_night: "21n",
  snowshowersandthunder_polartwilight: "21m",
  rainandthunder: "22",
  sleetandthunder: "23",
  lightrainshowersandthunder_day: "24d",
  lightrainshowersandthunder_night: "24n",
  lightrainshowersandthunder_polartwilight: "24m",
  heavyrainshowersandthunder_day: "25d",
  heavyrainshowersandthunder_night: "25n",
  heavyrainshowersandthunder_polartwilight: "25m",
  lightssleetshowersandthunder_day: "26d",
  lightssleetshowersandthunder_night: "26n",
  lightssleetshowersandthunder_polartwilight: "26m",
  heavysleetshowersandthunder_day: "27d",
  heavysleetshowersandthunder_night: "27n",
  heavysleetshowersandthunder_polartwilight: "27m",
  lightssnowshowersandthunder_day: "28d",
  lightssnowshowersandthunder_night: "28n",
  lightssnowshowersandthunder_polartwilight: "28m",
  heavysnowshowersandthunder_day: "29d",
  heavysnowshowersandthunder_night: "29n",
  heavysnowshowersandthunder_polartwilight: "29m",
  lightrainandthunder: "30",
  lightsleetandthunder: "31",
  heavysleetandthunder: "32",
  lightsnowandthunder: "33",
  heavysnowandthunder: "34",
  lightrainshowers_day: "40d",
  lightrainshowers_night: "40n",
  lightrainshowers_polartwilight: "40m",
  heavyrainshowers_day: "41d",
  heavyrainshowers_night: "41n",
  heavyrainshowers_polartwilight: "41m",
  lightsleetshowers_day: "42d",
  lightsleetshowers_night: "42n",
  lightsleetshowers_polartwilight: "42m",
  heavysleetshowers_day: "43d",
  heavysleetshowers_night: "43n",
  heavysleetshowers_polartwilight: "43m",
  lightsnowshowers_day: "44d",
  lightsnowshowers_night: "44n",
  lightsnowshowers_polartwilight: "44m",
  heavysnowshowers_day: "45d",
  heavysnowshowers_night: "45n",
  heavysnowshowers_polartwilight: "45m",
  lightrain: "46",
  lightsleet: "47",
  heavysleet: "48",
  lightsnow: "49",
  heavysnow: "50",
};

function convertSymbolKeyToId(key) {
  return weatherSymbolKeys[key] ?? undefined;
}
