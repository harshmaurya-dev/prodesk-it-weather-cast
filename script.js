// sprint 3 weather project - harsh maurya
// openweathermap api use kiya h

const API_KEY = "121733be4984cbd7e64c73d17a536122";
const BASE_URL = "https://api.openweathermap.org/data/2.5/weather";
const CACHE_DURATION = 600000; // 10 mins in ms

// grabbing elements
const cityInput = document.getElementById("cityInput");
const searchBtn = document.getElementById("searchBtn");
const errorBox = document.getElementById("errorBox");
const loadingBox = document.getElementById("loadingBox");
const weatherCard = document.getElementById("weatherCard");

const cityNameEl = document.getElementById("cityName");
const dtEl = document.getElementById("dateTime");
const wIcon = document.getElementById("weatherIcon");
const tempEl = document.getElementById("temperature");
const condEl = document.getElementById("condition");
const humEl = document.getElementById("humidity");
const windEl = document.getElementById("windSpeed");
const feelsEl = document.getElementById("feelsLike");

// helpers
function showError(msg) {
  errorBox.textContent = msg;
  errorBox.style.display = "block";
  weatherCard.style.display = "none";
}

function hideError() {
  errorBox.style.display = "none";
}

function showLoading() {
  loadingBox.style.display = "flex";
  weatherCard.style.display = "none";
  hideError();
}

function hideLoading() {
  loadingBox.style.display = "none";
}

// background theme based on weather condition
function updateBg(conditionText) {
  const bod = document.body;
  bod.className = "";
  const lower = conditionText.toLowerCase();

  if (lower.includes("rain") || lower.includes("drizzle") || lower.includes("thunderstorm")) {
    bod.classList.add("rain-bg");
  } else if (lower.includes("clear")) {
    bod.classList.add("clear-bg");
  } else if (lower.includes("cloud")) {
    bod.classList.add("clouds-bg");
  } else if (lower.includes("snow")) {
    bod.classList.add("snow-bg");
  } else {
    bod.classList.add("default-bg");
  }
}

// localStorage caching
function getCached(city) {
  const key = "weather_" + city.toLowerCase();
  const saved = localStorage.getItem(key);
  if (!saved) return null;

  const obj = JSON.parse(saved);
  if (Date.now() - obj.timestamp < CACHE_DURATION) {
    console.log("using cache for:", city);
    return obj.data;
  }

  localStorage.removeItem(key);
  return null;
}

function setCache(city, data) {
  const key = "weather_" + city.toLowerCase();
  localStorage.setItem(key, JSON.stringify({
    timestamp: Date.now(),
    data: data
  }));
}

// current date and time string
function getDateTime() {
  const now = new Date();
  return now.toLocaleDateString("en-IN", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric"
  });
}

// main fetch function
async function getWeather(city) {
  showLoading();

  const cached = getCached(city);
  if (cached) {
    hideLoading();
    renderWeather(cached);
    return;
  }

  const url = `${BASE_URL}?q=${city}&appid=${API_KEY}&units=metric`;

  try {
    const res = await fetch(url);
    const data = await res.json();

    if (data.cod === "404" || data.cod === 404) {
      hideLoading();
      showError("City not found. Please try again.");
      return;
    }

    if (!res.ok) {
      hideLoading();
      showError("Something went wrong. Try again.");
      return;
    }

    hideLoading();
    setCache(city, data);
    renderWeather(data);

  } catch (err) {
    hideLoading();
    showError("Network error. Check your connection.");
    console.log("fetch error:", err);
  }
}

// render weather data to DOM
function renderWeather(data) {
  cityNameEl.textContent = data.name + ", " + data.sys.country;
  dtEl.textContent = getDateTime();
  tempEl.textContent = Math.round(data.main.temp) + "°C";
  condEl.textContent = data.weather[0].description;
  humEl.textContent = data.main.humidity + "%";
  windEl.textContent = data.wind.speed + " m/s";
  feelsEl.textContent = Math.round(data.main.feels_like) + "°C";

  const iconCode = data.weather[0].icon;
  wIcon.src = `https://openweathermap.org/img/wn/${iconCode}@2x.png`;
  wIcon.alt = data.weather[0].description;

  weatherCard.style.display = "block";
  updateBg(data.weather[0].main);
}

// search button click
searchBtn.addEventListener("click", function () {
  const city = cityInput.value.trim();
  if (city === "") {
    showError("Please enter a city name.");
    return;
  }
  getWeather(city);
});

// enter key support
cityInput.addEventListener("keydown", function (e) {
  if (e.key === "Enter") {
    searchBtn.click();
  }
});

// Phase 3 - geolocation on page load
function loadByLocation() {
  if (!navigator.geolocation) return;

  navigator.geolocation.getCurrentPosition(
    async function (pos) {
      const lat = pos.coords.latitude;
      const lon = pos.coords.longitude;
      showLoading();

      const url = `${BASE_URL}?lat=${lat}&lon=${lon}&appid=${API_KEY}&units=metric`;

      try {
        const res = await fetch(url);
        const data = await res.json();
        if (!res.ok) { hideLoading(); return; }
        hideLoading();
        renderWeather(data);
      } catch (err) {
        hideLoading();
        console.log("geo error:", err);
      }
    },
    function (err) {
      console.log("location denied:", err.message);
    }
  );
}

loadByLocation();