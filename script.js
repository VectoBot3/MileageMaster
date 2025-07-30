let currentCar = null;
let data = JSON.parse(localStorage.getItem("fuelTrackerData")) || {};
let charts = {};
let globalChartTextColor;
let globalChartBorderColor;
let allStatsData = {};
const STATS_THRESHOLD = 3;

let sortConfig = {
  key: "date",
  direction: "asc",
};

// Ensure DOM is fully loaded before initializing the app
window.addEventListener("DOMContentLoaded", () => {
  initAppSequence();
  initKeyboardNavigation(); // Initialize keyboard navigation
  initModalClosingBehavior(); // Initialize modal closing behavior once for all modals
});

/**
 * Initializes the main application sequence, handling theme, tutorial, and core app setup.
 */
function initAppSequence() {
  const seenTutorial = localStorage.getItem("seenTutorial");
  const savedTheme = localStorage.getItem("themePreference");
  const themeModal = document.getElementById("themeModal");
  const themeToggle = document.getElementById("themeToggle"); // Get once
  const themeLabel = document.getElementById("themeLabel"); // Get once

  // Apply saved theme or set defaults
  if (savedTheme) {
    setTheme(savedTheme, false, themeToggle, themeLabel); // Pass elements
  } else {
    globalChartTextColor = "#212529";
    globalChartBorderColor = "#dee2e6";
  }

  initTheme(themeToggle, themeLabel); // Pass elements
  initUnitSystem();
  initCarSelection();
  initForm();
  initTutorialButton();
  initChartControls();
  initAccordionControls();
  initEditLogControls();
  initLogTableSorting();
  initExportButtons(); // Initialize export buttons
  initImportButton(); // Initialize import button
  render();

  // Handle theme modal and tutorial display on first load
  if (!savedTheme) {
    themeModal.classList.remove("hidden");
    themeModal.classList.add("visible");
    document.getElementById("lightThemeBtn").addEventListener("click", () => {
      setTheme("light", true, themeToggle, themeLabel); // Pass elements
      closeModal(themeModal, () => {
        if (!seenTutorial) showTutorialModal();
      });
    });
    document.getElementById("darkThemeBtn").addEventListener("click", () => {
      setTheme("dark", true, themeToggle, themeLabel); // Pass elements
      closeModal(themeModal, () => {
        if (!seenTutorial) showTutorialModal();
      });
    });
  } else {
    if (!seenTutorial) {
      setTimeout(() => {
        showTutorialModal();
      }, 100);
    }
  }

  // Enable CSS transitions after initial load to prevent FOUC (Flash of Unstyled Content)
  setTimeout(() => {
    document.body.classList.add("transitions-enabled");
  }, 500);
}

/**
 * Displays the tutorial modal and marks it as seen.
 */
function showTutorialModal() {
  const tutorialModal = document.getElementById("tutorialModal");
  tutorialModal.classList.remove("hidden");
  tutorialModal.classList.add("visible");
  localStorage.setItem("seenTutorial", "true");
}

/**
 * Initializes theme toggle functionality.
 * @param {HTMLElement} themeToggle - The theme toggle input element.
 * @param {HTMLElement} themeLabel - The theme label span element.
 */
function initTheme(themeToggle, themeLabel) {
  // Set initial state of toggle based on current theme
  themeToggle.checked =
    document.documentElement.classList.contains("dark-theme");
  themeLabel.textContent = themeToggle.checked
    ? "🌙 Dark Mode"
    : "☀️ Light Mode";

  // Add event listener for theme changes
  themeToggle.addEventListener("change", () => {
    setTheme(
      themeToggle.checked ? "dark" : "light",
      true,
      themeToggle,
      themeLabel
    );
  });
}

/**
 * Sets the application theme (light/dark) and updates related UI elements.
 * @param {string} themeName - The name of the theme to apply ('light' or 'dark').
 * @param {boolean} save - Whether to save the theme preference to local storage.
 * @param {HTMLElement} themeToggle - The theme toggle input element.
 * @param {HTMLElement} themeLabel - The theme label span element.
 */
function setTheme(themeName, save = true, themeToggle, themeLabel) {
  if (themeName === "dark") {
    document.documentElement.classList.add("dark-theme");
    if (themeToggle) themeToggle.checked = true;
    if (themeLabel) themeLabel.textContent = "🌙 Dark Mode";
  } else {
    document.documentElement.classList.remove("dark-theme");
    if (themeToggle) themeToggle.checked = false;
    if (themeLabel) themeLabel.textContent = "☀️ Light Mode";
  }
  if (save) {
    localStorage.setItem("themePreference", themeName);
  }

  // Update chart colors based on theme
  globalChartTextColor = themeName === "dark" ? "#e0e0e0" : "#212529";
  globalChartBorderColor = themeName === "dark" ? "#393939" : "#dee2e6";

  // Re-render components that depend on theme colors
  const rawEntries =
    currentCar && data[currentCar] ? data[currentCar].entries : [];
  const processedEntries = processEntries(rawEntries);
  const validEntriesForStats = processedEntries.filter(
    (e) => e.distanceTraveled !== null && !e.isInvalid
  );

  renderLogTable(processedEntries);
  const totalFuelCost = renderStats(validEntriesForStats);
  renderOwnershipCost(totalFuelCost, validEntriesForStats);
  renderCharts(
    validEntriesForStats,
    globalChartTextColor,
    globalChartBorderColor
  );
}

/**
 * Initializes the unit system selection dropdown.
 */
function initUnitSystem() {
  const unitSelect = document.getElementById("unitSystem");
  const storedUnit = localStorage.getItem("unitSystem");

  // Set default unit based on browser language if not stored
  if (!storedUnit) {
    const defaultUnit = navigator.language.startsWith("en-US")
      ? "imperial"
      : "metric";
    localStorage.setItem("unitSystem", defaultUnit);
    unitSelect.value = defaultUnit;
  } else {
    unitSelect.value = storedUnit;
  }

  // Add event listener for unit system changes
  unitSelect.addEventListener("change", (event) => {
    const newUnit = event.target.value;
    const oldUnit = localStorage.getItem("unitSystem");
    if (newUnit !== oldUnit && currentCar && data[currentCar]) {
      convertUnits(oldUnit, newUnit);
    }
    localStorage.setItem("unitSystem", newUnit);
    render(); // Re-render the UI with new units
  });
}

/**
 * Converts fuel entry units between metric and imperial.
 * @param {string} oldUnit - The previous unit system ('metric' or 'imperial').
 * @param {string} newUnit - The new unit system ('metric' or 'imperial').
 */
function convertUnits(oldUnit, newUnit) {
  if (!currentCar || !data[currentCar]) return;

  data[currentCar].entries = data[currentCar].entries.map((entry) => {
    let convertedOdometer = entry.odometerReading;
    let convertedFuel = entry.fuel;
    let convertedPrice = entry.price;

    if (oldUnit === "metric" && newUnit === "imperial") {
      convertedOdometer *= 0.621371; // km to miles
      convertedFuel *= 0.264172; // liters to gallons
      convertedPrice /= 0.264172; // price per liter to price per gallon
    } else if (oldUnit === "imperial" && newUnit === "metric") {
      convertedOdometer /= 0.621371; // miles to km
      convertedFuel /= 0.264172; // gallons to liters
      convertedPrice *= 0.264172; // price per gallon to price per liter
    }
    return {
      ...entry,
      odometerReading: parseFloat(convertedOdometer.toFixed(2)),
      fuel: parseFloat(convertedFuel.toFixed(2)),
      price: parseFloat(convertedPrice.toFixed(3)),
    };
  });
  localStorage.setItem("fuelTrackerData", JSON.stringify(data));
}

/**
 * Renders the car selection and management controls.
 * Uses event delegation for dynamically created buttons.
 */
function initCarSelection() {
  // Migrate old data format if necessary (array of entries to object with price and entries)
  Object.keys(data).forEach((car) => {
    if (Array.isArray(data[car])) {
      data[car] = { price: null, entries: data[car] };
    }
  });
  localStorage.setItem("fuelTrackerData", JSON.stringify(data));

  const carSelectContainer = document.querySelector(".car-controls");
  carSelectContainer.innerHTML = ""; // Clear existing controls

  const carSelect = document.createElement("select");
  carSelect.id = "carSelect";
  carSelect.title = "Select an existing car";

  const addCarBtn = document.createElement("button");
  addCarBtn.id = "addCarBtn"; // Add ID for event delegation
  addCarBtn.textContent = "+ Add Car";
  addCarBtn.title = "Add a new car";

  const editCarBtn = document.createElement("button");
  editCarBtn.id = "editCarBtn"; // Add ID for event delegation
  editCarBtn.textContent = "Edit Car";
  editCarBtn.title = "Edit selected car details";

  const deleteCarBtn = document.createElement("button");
  deleteCarBtn.id = "deleteCarBtn"; // Add ID for event delegation
  deleteCarBtn.textContent = "Delete Car";
  deleteCarBtn.title = "Delete selected car";

  // Populate car selection dropdown
  Object.keys(data).forEach((car) => {
    const option = document.createElement("option");
    option.value = car;
    option.textContent = car;
    carSelect.appendChild(option);
  });

  carSelect.addEventListener("change", () => {
    currentCar = carSelect.value;
    render(); // Re-render UI for the newly selected car
  });

  carSelectContainer.append(carSelect, addCarBtn);
  // Only show edit/delete buttons if there are cars
  if (Object.keys(data).length > 0) {
    carSelectContainer.append(editCarBtn, deleteCarBtn);
  }

  const cars = Object.keys(data);
  if (cars.length > 0) {
    // Set currentCar to the first car if none is selected or the selected one was deleted
    if (!currentCar || !data[currentCar]) {
      currentCar = cars[0];
    }
    carSelect.value = currentCar; // Ensure dropdown reflects currentCar
  } else {
    currentCar = null;
    // Prompt to add first car if no cars exist and it's the first time
    if (!localStorage.getItem("addedFirstCar")) {
      addCarForm(); // Directly call the function to show the add car form
      localStorage.setItem("addedFirstCar", "true");
    }
  }

  // Event delegation for car control buttons
  carSelectContainer.addEventListener("click", (event) => {
    if (event.target.id === "addCarBtn") {
      addCarForm();
    } else if (event.target.id === "editCarBtn") {
      editCarDetails();
    } else if (event.target.id === "deleteCarBtn") {
      deleteCar();
    } else if (event.target.id === "saveNewCarBtn") {
      saveNewCar();
    } else if (event.target.id === "cancelAddCarBtn") {
      initCarSelection(); // Re-initialize controls
      render();
    } else if (event.target.id === "saveCarDetailsBtn") {
      saveCarDetails(carSelectContainer.dataset.originalCarName); // Pass original name
    } else if (event.target.id === "cancelEditCarBtn") {
      initCarSelection(); // Re-initialize controls
      render();
    }
  });
}

/**
 * Displays the form for adding a new car.
 */
function addCarForm() {
  const carSelectContainer = document.querySelector(".car-controls");
  carSelectContainer.innerHTML = ""; // Clear for input fields

  const carNameInput = document.createElement("input");
  carNameInput.type = "text";
  carNameInput.id = "newCarNameInput"; // Add ID for easy access
  carNameInput.placeholder = "Enter new car name";
  carNameInput.title = "Enter a unique name for your new car";

  const carPriceInput = document.createElement("input");
  carPriceInput.type = "number";
  carPriceInput.id = "newCarPriceInput"; // Add ID for easy access
  carPriceInput.placeholder = "Car Price (Optional)";
  carPriceInput.title =
    "Enter the purchase price of the car (optional, for ownership cost)";

  const saveNewCarBtn = document.createElement("button");
  saveNewCarBtn.id = "saveNewCarBtn";
  saveNewCarBtn.textContent = "Save";
  saveNewCarBtn.title = "Save the new car";

  const cancelBtn = document.createElement("button");
  cancelBtn.id = "cancelAddCarBtn";
  cancelBtn.textContent = "Cancel";
  cancelBtn.title = "Cancel adding a new car";

  carSelectContainer.append(
    carNameInput,
    carPriceInput,
    saveNewCarBtn,
    cancelBtn
  );
  carNameInput.focus(); // Focus on the new car name input
}

/**
 * Saves a new car from the add car form.
 */
function saveNewCar() {
  const carNameInput = document.getElementById("newCarNameInput");
  const carPriceInput = document.getElementById("newCarPriceInput");

  const newCar = carNameInput.value.trim();
  const newCarPrice = parseFloat(carPriceInput.value) || null;
  if (newCar && !data[newCar]) {
    data[newCar] = { price: newCarPrice, entries: [] };
    localStorage.setItem("fuelTrackerData", JSON.stringify(data));
    currentCar = newCar;
    initCarSelection(); // Re-initialize controls with new car
    render();
  } else if (newCar) {
    showMessageBox("Car name already exists!");
  } else {
    initCarSelection(); // Re-initialize controls if no name entered
    render();
  }
}

/**
 * Opens the interface to edit details of the currently selected car.
 */
function editCarDetails() {
  const carSelectContainer = document.querySelector(".car-controls");
  const currentName = currentCar;
  if (!currentName) {
    showMessageBox("No car selected to edit.");
    return;
  }
  const currentPrice = data[currentName].price || ""; // Get current price, default to empty string

  // Store original car name in a data attribute for saving
  carSelectContainer.dataset.originalCarName = currentName;

  const carNameInput = document.createElement("input");
  carNameInput.type = "text";
  carNameInput.id = "editCarNameInput";
  carNameInput.value = currentName;
  carNameInput.title = "Edit the car's name";

  const carPriceInput = document.createElement("input");
  carPriceInput.type = "number";
  carPriceInput.id = "editCarPriceInput";
  carPriceInput.value = currentPrice;
  carPriceInput.placeholder = "Car Price (Optional)";
  carPriceInput.title = "Edit the car's purchase price (optional)";

  const saveBtn = document.createElement("button");
  saveBtn.id = "saveCarDetailsBtn"; // Add ID for event delegation
  saveBtn.textContent = "Save";
  saveBtn.title = "Save changes to car details";

  const cancelBtn = document.createElement("button");
  cancelBtn.id = "cancelEditCarBtn"; // Add ID for event delegation
  cancelBtn.textContent = "Cancel";
  cancelBtn.title = "Cancel editing car details";

  carSelectContainer.innerHTML = ""; // Clear existing controls
  carSelectContainer.append(carNameInput, carPriceInput, saveBtn, cancelBtn);
  carNameInput.focus();
}

/**
 * Saves the edited car details (name and price).
 * @param {string} oldCarName - The original name of the car being edited.
 */
function saveCarDetails(oldCarName) {
  const newCarName = document.getElementById("editCarNameInput").value.trim();
  const newCarPrice =
    parseFloat(document.getElementById("editCarPriceInput").value) || null;

  if (!newCarName) {
    showMessageBox("Car name cannot be empty.");
    return;
  }
  // Check if new name already exists and is different from old name
  if (newCarName !== oldCarName && data[newCarName]) {
    showMessageBox("Car name already exists!");
    return;
  }

  if (newCarName === oldCarName) {
    // Only update price if name hasn't changed
    data[oldCarName].price = newCarPrice;
  } else {
    // Update name and price, then delete old entry
    data[newCarName] = data[oldCarName];
    data[newCarName].price = newCarPrice;
    delete data[oldCarName];
    currentCar = newCarName; // Update currentCar to the new name
  }
  localStorage.setItem("fuelTrackerData", JSON.stringify(data));
  initCarSelection(); // Re-initialize car selection UI
  render(); // Re-render the application
}

/**
 * Deletes the currently selected car and all its associated data.
 */
function deleteCar() {
  if (!currentCar) {
    showMessageBox("No car selected to delete.");
    return;
  }
  showConfirmBox(
    `Delete "${currentCar}" and all its data? This cannot be undone.`,
    () => {
      delete data[currentCar]; // Remove car data
      localStorage.setItem("fuelTrackerData", JSON.stringify(data));
      currentCar = null; // Clear current car
      initCarSelection(); // Re-initialize car selection UI
      render(); // Re-render the application
    }
  );
}

/**
 * Clears all fuel entries for the currently selected car.
 */
function clearSession() {
  if (!currentCar) {
    showMessageBox("No car selected to clear data for.");
    return;
  }
  showConfirmBox(
    `Clear all fuel entries for "${currentCar}"? This cannot be undone.`,
    () => {
      data[currentCar].entries = []; // Clear entries array
      localStorage.setItem("fuelTrackerData", JSON.stringify(data));
      render(); // Re-render the application
    }
  );
}

/**
 * Initializes the fuel entry form submission.
 */
function initForm() {
  document.getElementById("fuelForm").addEventListener("submit", (e) => {
    e.preventDefault(); // Prevent default form submission

    const odometerReading = parseFloat(
      document.getElementById("odometerReading").value
    );
    const fuel = parseFloat(document.getElementById("fuel").value);
    const price = parseFloat(document.getElementById("price").value);
    const date = document.getElementById("date").value;

    if (!currentCar) {
      showMessageBox("Please select or add a car before adding entries.");
      return;
    }
    // Validate inputs
    if (!isNaN(odometerReading) && !isNaN(fuel) && !isNaN(price) && date) {
      data[currentCar].entries.push({ odometerReading, fuel, price, date }); // Add new entry
      localStorage.setItem("fuelTrackerData", JSON.stringify(data));
      render(); // Re-render the UI
      e.target.reset(); // Clear form fields
      document.getElementById("date").value = ""; // Clear date field specifically
    } else {
      showMessageBox("Please fill all fields correctly for the fuel entry.");
    }
  });
}

/**
 * Initializes the tutorial button and its closing mechanism.
 */
function initTutorialButton() {
  document
    .getElementById("helpBtn")
    .addEventListener("click", showTutorialModal);
  document.getElementById("closeTutorialBtn").addEventListener("click", () => {
    closeModal(document.getElementById("tutorialModal"));
  });
}

/**
 * Initializes controls for opening enlarged charts.
 */
function initChartControls() {
  document
    .getElementById("chartsContent")
    .addEventListener("click", (event) => {
      const canvas = event.target.closest("canvas");
      if (canvas && canvas.id) {
        const chartId = canvas.id.replace("Chart", ""); // Extract chart name from ID
        openChartModal(chartId);
      }
    });
  document
    .getElementById("closeChartModalBtn")
    .addEventListener("click", () => {
      closeModal(document.getElementById("chartModal"));
    });
}

/**
 * Initializes controls for opening and closing all accordion details.
 */
function initAccordionControls() {
  document.getElementById("openAllAccordions").addEventListener("click", () => {
    document
      .querySelectorAll("#statsAccordionContainer details")
      .forEach((detail) => {
        detail.open = true;
      });
  });

  document
    .getElementById("closeAllAccordions")
    .addEventListener("click", () => {
      document
        .querySelectorAll("#statsAccordionContainer details")
        .forEach((detail) => {
          detail.open = false;
        });
    });
}

/**
 * Initializes controls for editing and saving fuel log entries.
 */
function initEditLogControls() {
  document
    .getElementById("editLogBtn")
    .addEventListener("click", openEditLogModal);
  document
    .getElementById("saveLogChangesBtn")
    .addEventListener("click", saveLogChanges);
  document
    .getElementById("cancelEditLogModalBtn")
    .addEventListener("click", () => {
      closeModal(document.getElementById("editLogModal"));
    });
}

/**
 * Initializes sorting functionality for the fuel log table headers.
 */
function initLogTableSorting() {
  document.querySelectorAll("#logTable .sortable-header").forEach((header) => {
    header.addEventListener("click", () => {
      const sortKey = header.dataset.sortBy; // Get the data attribute for sorting
      if (sortConfig.key === sortKey) {
        // Toggle sort direction if same column clicked
        sortConfig.direction = sortConfig.direction === "asc" ? "desc" : "asc";
      } else {
        // Set new column and default to ascending
        sortConfig.key = sortKey;
        sortConfig.direction = "asc";
      }
      renderLogTable(processEntries(data[currentCar]?.entries || [])); // Re-render with new sort order
    });
  });
}

/**
 * Initializes behavior for closing modals when clicking outside or pressing Escape.
 */
function initModalClosingBehavior() {
  const modals = document.querySelectorAll(".modal");
  modals.forEach((modal) => {
    // Click outside to close
    modal.addEventListener("click", function (event) {
      if (event.target === this) {
        // Check if click was directly on the modal overlay
        closeModal(modal);
      }
    });
  });

  // Escape key to close the topmost visible modal
  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") {
      const visibleModals = Array.from(
        document.querySelectorAll(".modal.visible")
      ).reverse();
      if (visibleModals.length > 0) {
        closeModal(visibleModals[0]);
      }
    }
  });
}

/**
 * Generic function to close a modal with a transition.
 * @param {HTMLElement} modalElement - The modal HTML element to close.
 * @param {Function} [callback] - An optional callback function to run after the modal is hidden.
 */
function closeModal(modalElement, callback = () => {}) {
  modalElement.classList.remove("visible");
  setTimeout(() => {
    modalElement.classList.add("hidden");
    callback(); // Execute callback after transition
  }, 300); // Match CSS transition duration
}

/**
 * Opens the enlarged chart modal for a specific chart.
 * @param {string} chartName - The name of the chart (e.g., 'efficiency', 'cost').
 */
function openChartModal(chartName) {
  const modal = document.getElementById("chartModal");
  const modalImage = document.getElementById("modalChartImage");
  const downloadChartBtn = document.getElementById("downloadChartBtn");

  const chartInstance = charts[chartName];
  if (chartInstance) {
    modalImage.src = chartInstance.toBase64Image(); // Set image source from chart
    modalImage.alt = chartInstance.data.datasets[0].label; // Set alt text

    // Set download button functionality
    downloadChartBtn.onclick = () => {
      const link = document.createElement("a");
      link.href = chartInstance.toBase64Image();
      link.download = `${currentCar}_${chartName}_chart.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    };

    modal.classList.remove("hidden");
    modal.classList.add("visible");
  }
}

/**
 * Processes raw fuel entries to calculate derived data like distance traveled and total spend,
 * and identifies invalid entries.
 * @param {Array<Object>} rawEntries - An array of raw fuel entry objects.
 * @returns {Array<Object>} An array of processed fuel entry objects.
 */
function processEntries(rawEntries) {
  if (!rawEntries || rawEntries.length === 0) {
    return [];
  }
  // Sort entries by date to ensure correct distance calculation
  const sortedEntries = [...rawEntries].sort(
    (a, b) => new Date(a.date) - new Date(b.date)
  );

  let hasInvalidEntries = false;
  const processed = sortedEntries.map((entry, index) => {
    const prevEntry = index > 0 ? sortedEntries[index - 1] : null;
    let distanceTraveled = null;
    let isInvalid = false;

    const currentOdo = parseFloat(entry.odometerReading);
    const fuel = parseFloat(entry.fuel);
    const price = parseFloat(entry.price);

    // Basic validation for missing or non-numeric data
    if (isNaN(currentOdo) || isNaN(fuel) || isNaN(price) || !entry.date) {
      isInvalid = true;
      hasInvalidEntries = true;
    }

    if (prevEntry) {
      const prevOdo = parseFloat(prevEntry.odometerReading);
      if (!isNaN(currentOdo) && !isNaN(prevOdo) && currentOdo > prevOdo) {
        distanceTraveled = currentOdo - prevOdo;
      } else if (
        !isNaN(currentOdo) &&
        !isNaN(prevOdo) &&
        currentOdo <= prevOdo
      ) {
        // Odometer did not increase, mark as invalid
        isInvalid = true;
        hasInvalidEntries = true;
      }
    }

    return {
      ...entry,
      odometerReading: isNaN(currentOdo) ? null : currentOdo,
      fuel: isNaN(fuel) ? null : fuel,
      price: isNaN(price) ? null : price,
      distanceTraveled: distanceTraveled,
      totalSpend: fuel && price ? fuel * price : null,
      isFirst: index === 0, // Mark the very first entry
      isInvalid: isInvalid,
    };
  });

  // Store whether the current car has any invalid entries
  if (currentCar) {
    data[currentCar].hasInvalidEntries = hasInvalidEntries;
  }
  return processed;
}

/**
 * Renders all main sections of the application (log table, stats, ownership cost, charts).
 */
function render() {
  const rawEntries =
    currentCar && data[currentCar] ? data[currentCar].entries : [];
  const processedEntries = processEntries(rawEntries);
  // Filter for entries that are valid for statistical calculations
  const validEntriesForStats = processedEntries.filter(
    (e) => e.distanceTraveled !== null && !e.isInvalid
  );

  renderLogTable(processedEntries);
  const totalFuelCost = renderStats(validEntriesForStats);
  renderOwnershipCost(totalFuelCost, validEntriesForStats);

  renderCharts(
    validEntriesForStats,
    globalChartTextColor,
    globalChartBorderColor
  );
}

/**
 * Renders the fuel log table with processed entries, including sorting and notices.
 * Uses string concatenation for better DOM performance.
 * @param {Array<Object>} processedEntries - An array of processed fuel entry objects.
 */
function renderLogTable(processedEntries) {
  const tableBody = document.getElementById("logBody");
  const logNoticesContainer = document.getElementById("logNoticesContainer");
  logNoticesContainer.innerHTML = ""; // Clear previous notices
  logNoticesContainer.classList.add("hidden"); // Hide by default

  let tableRowsHtml = ""; // Use a string to build HTML
  const unit = localStorage.getItem("unitSystem") || "metric";

  // Sort entries based on current sort configuration
  const entriesToRender = [...processedEntries].sort((a, b) => {
    const valA = a[sortConfig.key];
    const valB = b[sortConfig.key];
    let comparison = 0;
    if (sortConfig.key === "date") {
      comparison = new Date(valA) - new Date(b.date);
    } else {
      const numA = parseFloat(valA);
      const numB = parseFloat(valB);
      if (isNaN(numA) && isNaN(numB)) comparison = 0;
      else if (isNaN(numA)) comparison = 1; // NaN comes after numbers
      else if (isNaN(numB)) comparison = -1; // Numbers come before NaN
      else comparison = numA - numB;
    }
    return sortConfig.direction === "asc" ? comparison : comparison * -1;
  });

  if (entriesToRender.length > 0) {
    let hasDataErrors = false;
    entriesToRender.forEach((entry, displayIndex) => {
      // Find the original index to allow deletion of the correct entry
      // This is crucial because `entriesToRender` is sorted, but `data[currentCar].entries` is not.
      const originalIndex = data[currentCar].entries.findIndex(
        (e) =>
          e.date === entry.date &&
          e.odometerReading === entry.odometerReading &&
          e.fuel === entry.fuel &&
          e.price === entry.price
      );

      const distUnit = unit === "imperial" ? "miles" : "km";
      const fuelUnit = unit === "imperial" ? "gal" : "L";
      const rowClasses = [];
      if (entry.isFirst) {
        rowClasses.push("first-entry");
      }
      if (entry.isInvalid) {
        rowClasses.push("invalid-entry");
        hasDataErrors = true;
      }
      tableRowsHtml += `
        <tr class="${rowClasses.join(" ")}">
            <td>${entry.date || "N/A"}</td>
            <td>${
              entry.odometerReading !== null
                ? `${entry.odometerReading.toFixed(2)} ${distUnit}`
                : "N/A"
            }</td>
            <td>${
              entry.distanceTraveled !== null
                ? `${entry.distanceTraveled.toFixed(2)} ${distUnit}`
                : "N/A"
            }</td>
            <td>${
              entry.fuel !== null
                ? `${entry.fuel.toFixed(2)} ${fuelUnit}`
                : "N/A"
            }</td>
            <td>${
              entry.price !== null
                ? `$${entry.price.toFixed(3)}/${fuelUnit}`
                : "N/A"
            }</td>
            <td>${
              entry.totalSpend !== null
                ? `$${entry.totalSpend.toFixed(2)}`
                : "N/A"
            }</td>
            <td>
                <button class="delete-btn" data-original-index="${originalIndex}" title="Delete this entry">❌</button>
            </td>
        </tr>`;
    });
    tableBody.innerHTML = tableRowsHtml; // Set innerHTML once

    const totalEntriesNeeded = STATS_THRESHOLD + 1; // First entry + STATS_THRESHOLD
    let logMessageText = "";
    let errorMessageText = "";

    // Display error notice if invalid entries exist
    if (hasDataErrors) {
      errorMessageText = `<strong>Data Entry Issue:</strong> Some entries (highlighted in red) appear to have invalid data (e.g., odometer not increasing, missing values). These entries are excluded from statistics. Please edit or delete them for accurate calculations.`;
      const errorDiv = document.createElement("div");
      errorDiv.classList.add("stats-notice", "error-notice");
      errorDiv.innerHTML = errorMessageText;
      logNoticesContainer.appendChild(errorDiv);
    }

    // Display general log notices
    if (
      processedEntries.length > 0 &&
      processedEntries.length < totalEntriesNeeded
    ) {
      logMessageText = `<strong>Note:</strong> The first entry (highlighted) establishes your starting odometer reading. For accuracy, at least <strong>${totalEntriesNeeded} total entries</strong> are needed to generate stats and charts.`;
    } else if (processedEntries.length >= totalEntriesNeeded) {
      logMessageText = `<strong>Note:</strong> The first entry is always highlighted as your baseline reading and is excluded from statistics.`;
    }

    if (logMessageText) {
      const logDiv = document.createElement("div");
      logDiv.classList.add("stats-notice");
      logDiv.innerHTML = logMessageText;
      logNoticesContainer.appendChild(logDiv);
    }
  } else {
    // Message when no entries exist
    tableBody.innerHTML = `<tr><td colspan="7">${
      currentCar ? "No fuel entries yet." : "Please add or select a car."
    }</td></tr>`;
  }

  // Show the notices container if it has content
  if (logNoticesContainer.children.length > 0) {
    logNoticesContainer.classList.remove("hidden");
  }

  // Update sort icons on table headers
  document.querySelectorAll("#logTable .sortable-header").forEach((header) => {
    header.classList.remove("sort-asc", "sort-desc");
    if (header.dataset.sortBy === sortConfig.key) {
      header.classList.add(`sort-${sortConfig.direction}`);
    }
  });

  // Event delegation for delete buttons in the log table
  tableBody.addEventListener("click", (event) => {
    if (event.target.classList.contains("delete-btn")) {
      const originalIndex = parseInt(event.target.dataset.originalIndex, 10);
      deleteEntry(originalIndex);
    }
  });
}

/**
 * Deletes a specific fuel entry from the current car's log.
 * @param {number} index - The index of the entry to delete in the original data array.
 */
function deleteEntry(index) {
  showConfirmBox("Delete this entry?", () => {
    if (index > -1) {
      data[currentCar].entries.splice(index, 1); // Remove entry by index
      localStorage.setItem("fuelTrackerData", JSON.stringify(data));
      render(); // Re-render the UI
    }
  });
}

/**
 * Renders the statistics section based on valid fuel log entries.
 * @param {Array<Object>} logs - An array of valid fuel log entries for statistics.
 * @returns {number} The total fuel cost calculated from the logs.
 */
function renderStats(logs) {
  const statsContent = document.getElementById("statsContent");
  const accordionContainer = document.getElementById("statsAccordionContainer");
  const noticeDiv = document.getElementById("statsNotice");
  const statsControlsContainer = document.getElementById(
    "statsControlsContainer"
  );
  const unit = localStorage.getItem("unitSystem") || "metric";

  // Clear and hide sections by default
  statsContent.innerHTML = "";
  accordionContainer.innerHTML = "";
  accordionContainer.classList.add("hidden");
  statsControlsContainer.classList.add("hidden");
  noticeDiv.classList.add("hidden");

  if (!currentCar) {
    noticeDiv.innerHTML = `Please select or add a car to view detailed statistics.`;
    noticeDiv.classList.remove("hidden");
    return 0; // Return 0 cost if no car selected
  }

  // Display notice if not enough valid entries for statistics
  if (logs.length < STATS_THRESHOLD) {
    const needed = STATS_THRESHOLD - logs.length;
    noticeDiv.innerHTML = `Please add <strong>${needed}</strong> more valid fuel entr${
      needed > 1 ? "ies" : "y"
    } to view detailed statistics. (Requires at least ${STATS_THRESHOLD} entries with a calculated distance traveled and no data errors)`;
    noticeDiv.classList.remove("hidden");
    // Still calculate total fuel cost even if not enough for full stats
    return logs.reduce((sum, l) => sum + l.totalSpend, 0);
  }

  // Show sections once enough data is available
  accordionContainer.classList.remove("hidden");
  statsControlsContainer.classList.remove("hidden");

  // Define units for display
  const distUnit = unit === "imperial" ? "mi" : "km";
  const fuelUnit = unit === "imperial" ? "gal" : "L";
  const effUnit = unit === "imperial" ? "MPG" : "L/100km";
  const perDistUnit = `per ${distUnit}`;

  // Extract data for calculations
  const efficiencies = logs.map((l) =>
    unit === "imperial"
      ? l.distanceTraveled / l.fuel
      : (l.fuel / l.distanceTraveled) * 100
  );
  const distances = logs.map((l) => l.distanceTraveled);
  const fuelVolumes = logs.map((l) => l.fuel);
  const prices = logs.map((l) => l.price);
  const costs = logs.map((l) => l.totalSpend);
  const dates = logs.map((l) => new Date(l.date));

  // Calculate primary statistics
  const totalDist = distances.reduce((s, a) => s + a, 0);
  const totalFuel = fuelVolumes.reduce((s, a) => s + a, 0);
  const totalCost = costs.reduce((s, a) => s + a, 0);
  const avgEff =
    totalFuel > 0
      ? unit === "imperial"
        ? totalDist / totalFuel
        : (totalFuel / totalDist) * 100
      : 0;

  /**
   * Calculates the standard deviation of an array of numbers.
   * @param {Array<number>} arr - The array of numbers.
   * @returns {number} The standard deviation.
   */
  const getStdDev = (arr) => {
    if (arr.length < 2) return 0;
    const mean = arr.reduce((s, a) => s + a, 0) / arr.length;
    return Math.sqrt(
      arr.map((x) => Math.pow(x - mean, 2)).reduce((s, a) => s + a, 0) /
        (arr.length - 1)
    );
  };

  /**
   * Calculates the rolling average of an array of numbers.
   * @param {Array<number>} arr - The array of numbers.
   * @param {number} window - The size of the rolling window.
   * @returns {number|string} The rolling average or "N/A" if not enough data.
   */
  const getRollingAvg = (arr, window) => {
    if (arr.length < window) return "N/A";
    const lastItems = arr.slice(-window);
    return lastItems.reduce((s, a) => s + a, 0) / window;
  };

  /**
   * Calculates the median of an array of numbers.
   * @param {Array<number>} arr - The array of numbers.
   * @returns {number} The median.
   */
  const getMedian = (arr) => {
    const sorted = [...arr].sort((a, b) => a - b);
    const mid = Math.floor(sorted.length / 2);
    return sorted.length % 2 !== 0
      ? sorted[mid]
      : (sorted[mid - 1] + sorted[mid]) / 2;
  };

  // Time-based calculations
  const firstDate = dates.length > 0 ? dates[0] : null;
  const lastDate = dates.length > 0 ? dates[dates.length - 1] : null;
  const totalDays =
    firstDate && lastDate
      ? Math.max(1, (lastDate - firstDate) / (1000 * 3600 * 24)) // Ensure at least 1 day to avoid division by zero
      : 0;

  const dateGaps = dates
    .slice(1)
    .map((date, i) => (date - dates[i]) / (1000 * 3600 * 24));
  const avgDaysBetweenEntries =
    dateGaps.length > 0
      ? dateGaps.reduce((s, a) => s + a, 0) / dateGaps.length
      : 0;
  const longestGapBetweenEntries =
    dateGaps.length > 0 ? Math.max(...dateGaps) : 0;

  // Structure all statistics data
  allStatsData = {
    Primary: {
      "Total Distance": `${totalDist.toFixed(2)} ${distUnit}`,
      "Total Fuel": `${totalFuel.toFixed(2)} ${fuelUnit}`,
      "Total Cost": `$${totalCost.toFixed(2)}`,
      "Average Efficiency": `${avgEff.toFixed(2)} ${effUnit}`,
    },
    "Time-Based": {
      "Total Days Tracked": `${Math.round(totalDays)} days`,
      "Average Days Between Entries": `${avgDaysBetweenEntries.toFixed(
        1
      )} days`,
      "Distance per Day": `${(totalDist / totalDays).toFixed(2)} ${distUnit}`,
      "Fuel Cost per Day": `$${(totalCost / totalDays).toFixed(2)}`,
      "Longest Gap Between Entries": `${longestGapBetweenEntries.toFixed(
        0
      )} days`,
    },
    Distance: {
      "Average Distance per Entry": `${(totalDist / logs.length).toFixed(
        2
      )} ${distUnit}`,
      "Longest Distance on One Entry": `${Math.max(...distances).toFixed(
        2
      )} ${distUnit}`,
      "Shortest Distance on One Entry": `${Math.min(...distances).toFixed(
        2
      )} ${distUnit}`,
      "Std. Dev. of Distance": `${getStdDev(distances).toFixed(2)} ${distUnit}`,
    },
    "Fuel & Cost": {
      "Average Price per Unit": `$${(totalFuel > 0
        ? totalCost / totalFuel
        : 0
      ).toFixed(3)}/${fuelUnit}`,
      "Average Cost per Entry": `$${(totalCost / logs.length).toFixed(2)}`,
      "Most Expensive Entry": `$${Math.max(...costs).toFixed(2)}`,
      "Cheapest Entry": `$${Math.min(...costs).toFixed(2)}`,
      "Cost per Distance": `$${(totalDist > 0
        ? totalCost / totalDist
        : 0
      ).toFixed(3)} ${perDistUnit}`,
      "Distance per Dollar": `${(totalCost > 0
        ? totalDist / totalCost
        : 0
      ).toFixed(2)} ${distUnit}/$`,
    },
    Efficiency: {
      "Best Efficiency": `${(unit === "imperial"
        ? Math.max(...efficiencies)
        : Math.min(...efficiencies)
      ).toFixed(2)} ${effUnit}`,
      "Worst Efficiency": `${(unit === "imperial"
        ? Math.min(...efficiencies)
        : Math.max(...efficiencies)
      ).toFixed(2)} ${effUnit}`,
      "Median Efficiency": `${getMedian(efficiencies).toFixed(2)} ${effUnit}`,
      "Std. Dev. of Efficiency": `${getStdDev(efficiencies).toFixed(
        2
      )} ${effUnit}`,
      "3-Entry Rolling Avg": `${
        getRollingAvg(efficiencies, 3) !== "N/A"
          ? getRollingAvg(efficiencies, 3).toFixed(2)
          : "N/A"
      } ${effUnit}`,
      "5-Entry Rolling Avg": `${
        getRollingAvg(efficiencies, 5) !== "N/A"
          ? getRollingAvg(efficiencies, 5).toFixed(2)
          : "N/A"
      } ${effUnit}`,
    },
    Volatility: {
      "Std. Dev. of Fuel Price": `$${getStdDev(prices).toFixed(3)}`,
      "Std. Dev. of Entry Cost": `$${getStdDev(costs).toFixed(2)}`,
    },
  };

  // Render primary stats cards
  statsContent.innerHTML = Object.entries(allStatsData.Primary)
    .map(
      ([key, val]) =>
        `<div class="stat-card"><p><strong>${key}</strong><br>${val}</p></div>`
    )
    .join("");

  // Tooltips for accordion categories
  const tooltips = {
    "Time-Based": "Statistics related to the passage of time between entries.",
    Distance: "Analysis of the distance traveled between each refuel.",
    "Fuel & Cost":
      "Metrics about fuel volume, unit price, and total expenditure.",
    Efficiency: "In-depth analysis of your vehicle's fuel efficiency trends.",
    Volatility:
      "Measures the consistency of prices and costs over time. Higher numbers mean more fluctuation.",
  };

  // Render detailed stats in accordions
  accordionContainer.innerHTML = Object.entries(allStatsData)
    .slice(1) // Skip 'Primary' category
    .map(
      ([category, stats]) => `
    <details>
      <summary>${category}<span class="tooltip-icon">?<span class="tooltip-text">${
        tooltips[category]
      }</span></span></summary>
      <div class="accordion-content"><div class="stats-grid-container">
        ${Object.entries(stats)
          .map(
            ([key, val]) =>
              `<div class="stat-card"><p><strong>${key}</strong><br>${val}</p></div>`
          )
          .join("")}
      </div></div>
    </details>`
    )
    .join("");

  return totalCost; // Return total fuel cost for ownership cost calculation
}

/**
 * Renders the total cost of ownership section.
 * @param {number} totalFuelCost - The total fuel cost calculated from valid entries.
 * @param {Array<Object>} logs - An array of valid fuel log entries.
 */
function renderOwnershipCost(totalFuelCost, logs) {
  const ownershipContent = document.getElementById("ownershipCostContent");
  const ownershipNotice = document.getElementById("ownershipCostNotice");
  const carPrice = data[currentCar]?.price;

  ownershipContent.innerHTML = ""; // Clear previous content
  ownershipNotice.classList.add("hidden"); // Hide notice by default

  if (!currentCar) {
    ownershipNotice.innerHTML = `Please select or add a car to view Total Cost of Ownership.`;
    ownershipNotice.classList.remove("hidden");
    return;
  }

  // Display notice if car price is not set
  if (typeof carPrice !== "number" || carPrice <= 0) {
    ownershipNotice.innerHTML = `To see Total Cost of Ownership, please <a href="#" onclick="editCarDetails(); return false;">edit your car</a> and add its purchase price.`;
    ownershipNotice.classList.remove("hidden");
    return;
  }

  // Display notice if not enough valid entries for calculation
  if (logs.length < STATS_THRESHOLD) {
    const needed = STATS_THRESHOLD - logs.length;
    ownershipNotice.innerHTML = `Please add <strong>${needed}</strong> more valid fuel entr${
      needed > 1 ? "ies" : "y"
    } to calculate Total Cost of Ownership.`;
    ownershipNotice.classList.remove("hidden");
    return;
  }

  // Calculate ownership cost metrics
  const totalOwnershipCost = carPrice + totalFuelCost;
  const firstDate = new Date(logs[0].date);
  const lastDate = new Date(logs[logs.length - 1].date);
  const daysDiff = Math.max(
    1,
    (lastDate.getTime() - firstDate.getTime()) / (1000 * 3600 * 24)
  ); // Ensure at least 1 day

  const costPerDay = totalOwnershipCost / daysDiff;

  // Render ownership cost cards
  ownershipContent.innerHTML = `
        <div class="stat-card"><p><strong>Car Purchase Price</strong><br>$${carPrice.toFixed(
          2
        )}</p></div>
        <div class="stat-card"><p><strong>Total Fuel Cost</strong><br>$${totalFuelCost.toFixed(
          2
        )}</p></div>
        <div class="stat-card"><p><strong>Total Ownership Cost</strong><br>$${totalOwnershipCost.toFixed(
          2
        )}</p></div>
        <div class="stat-card"><p><strong>Cost per Year</strong><br>$${(
          costPerDay * 365.25
        ).toFixed(2)}</p></div>
        <div class="stat-card"><p><strong>Cost per Month</strong><br>$${(
          costPerDay * 30.44
        ).toFixed(2)}</p></div>
        <div class="stat-card"><p><strong>Cost per Week</strong><br>$${(
          costPerDay * 7
        ).toFixed(2)}</p></div>
        <div class="stat-card"><p><strong>Cost per Day</strong><br>$${costPerDay.toFixed(
          2
        )}</p></div>`;
}

/**
 * Renders the charts section based on valid fuel log entries.
 * @param {Array<Object>} logs - An array of valid fuel log entries for charts.
 * @param {string} chartTextColor - Color for chart text.
 * @param {string} chartBorderColor - Color for chart borders/grids.
 */
function renderCharts(logs, chartTextColor, chartBorderColor) {
  // Destroy existing chart instances to prevent memory leaks and re-render issues
  Object.values(charts).forEach((chart) => chart.destroy());
  charts = {}; // Reset charts object

  const chartsContent = document.getElementById("chartsContent");
  const chartsDisplayArea = chartsContent.querySelector(".chart-display-area");
  const chartsNotice = document.getElementById("chartsNotice");
  const exportButtons = document.querySelector(".charts-export-buttons");
  const unit = localStorage.getItem("unitSystem") || "metric";

  // Clear and hide sections by default
  chartsDisplayArea.innerHTML = "";
  exportButtons.classList.add("hidden");
  chartsNotice.classList.add("hidden");
  chartsContent.classList.add("hidden");

  if (!currentCar) {
    chartsNotice.innerHTML = `Please select or add a car to view charts.`;
    chartsNotice.classList.remove("hidden");
    return;
  }

  // Display notice if not enough valid entries for charts
  if (logs.length < STATS_THRESHOLD) {
    const needed = STATS_THRESHOLD - logs.length;
    chartsNotice.innerHTML = `Please add <strong>${needed}</strong> more valid fuel entr${
      needed > 1 ? "ies" : "y"
    } to display charts.`;
    chartsNotice.classList.remove("hidden");
    return;
  }

  // Show charts content and prepare canvas elements
  chartsContent.classList.remove("hidden");
  chartsDisplayArea.innerHTML = `
    <div id="efficiencyChartContainer" class="chart-container"><canvas id="efficiencyChart"></canvas></div>
    <div id="costChartContainer" class="chart-container"><canvas id="costChart"></canvas></div>
    <div id="costPerDistanceChartContainer" class="chart-container"><canvas id="costPerDistanceChart"></canvas></div>
    <div id="fuelPriceChartContainer" class="chart-container"><canvas id="fuelPriceChart"></canvas></div>
    <div id="fuelVolumeChartContainer" class="chart-container"><canvas id="fuelVolumeChart"></canvas></div>
    <div id="cumulativeDistanceChartContainer" class="chart-container"><canvas id="cumulativeDistanceChart"></canvas></div>`;

  exportButtons.classList.remove("hidden");

  // Prepare data for charts
  const labels = logs.map((e) => e.date);
  const efficiencyData = logs.map((e) =>
    unit === "imperial"
      ? e.distanceTraveled / e.fuel
      : (e.fuel / e.distanceTraveled) * 100
  );
  const costData = logs.map((e) => e.totalSpend);
  const costPerDistanceData = logs.map(
    (e) => e.totalSpend / e.distanceTraveled
  );
  const fuelPriceData = logs.map((e) => e.price);
  const fuelVolumeData = logs.map((e) => e.fuel);
  const cumulativeDistanceData = logs.reduce(
    (acc, e) => [
      ...acc,
      (acc.length > 0 ? acc[acc.length - 1] : 0) + e.distanceTraveled,
    ],
    []
  );

  // Common Chart.js options for consistency
  const commonOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        labels: {
          color: chartTextColor,
        },
      },
      title: {
        display: true,
        color: chartTextColor,
        font: {
          size: 16,
        },
        padding: {
          top: 15,
          bottom: 15,
        },
      },
    },
    scales: {
      x: {
        ticks: { color: chartTextColor },
        grid: { color: chartBorderColor },
        title: {
          display: false, // X-axis title often not needed with clear chart titles
          color: chartTextColor,
        },
      },
      y: {
        beginAtZero: true,
        ticks: { color: chartTextColor },
        grid: { color: chartBorderColor },
        title: {
          display: false, // Y-axis title often not needed with clear chart titles
          color: chartTextColor,
        },
      },
    },
  };

  // Create and store chart instances
  charts.efficiency = new Chart(document.getElementById("efficiencyChart"), {
    type: "line",
    data: {
      labels,
      datasets: [
        {
          label: unit === "imperial" ? "MPG" : "L/100km",
          data: efficiencyData,
          borderColor: "#00cec9",
          tension: 0.1,
        },
      ],
    },
    options: {
      ...commonOptions,
      plugins: {
        ...commonOptions.plugins,
        title: {
          ...commonOptions.plugins.title,
          text: `Fuel Efficiency (${unit === "imperial" ? "MPG" : "L/100km"})`,
        },
      },
      scales: {
        ...commonOptions.scales,
        y: { ...commonOptions.scales.y, reverse: unit === "metric" }, // Reverse Y-axis for L/100km
      },
    },
  });
  charts.cost = new Chart(document.getElementById("costChart"), {
    type: "bar",
    data: {
      labels,
      datasets: [
        {
          label: "Cost per Entry ($)",
          data: costData,
          backgroundColor: "#0984e3",
        },
      ],
    },
    options: {
      ...commonOptions,
      plugins: {
        ...commonOptions.plugins,
        title: { ...commonOptions.plugins.title, text: "Cost per Entry ($)" },
      },
      scales: {
        ...commonOptions.scales,
        x: { ...commonOptions.scales.x, offset: true }, // Offset bars from grid lines
      },
    },
  });
  charts.costPerDistance = new Chart(
    document.getElementById("costPerDistanceChart"),
    {
      type: "line",
      data: {
        labels,
        datasets: [
          {
            label: `Cost per ${unit === "imperial" ? "Mile" : "KM"} ($)`,
            data: costPerDistanceData,
            borderColor: "#fdcb6e",
            tension: 0.1,
          },
        ],
      },
      options: {
        ...commonOptions,
        plugins: {
          ...commonOptions.plugins,
          title: {
            ...commonOptions.plugins.title,
            text: `Cost per ${unit === "imperial" ? "Mile" : "KM"} ($)`,
          },
        },
      },
    }
  );
  charts.fuelPrice = new Chart(document.getElementById("fuelPriceChart"), {
    type: "line",
    data: {
      labels,
      datasets: [
        {
          label: `Price per ${unit === "imperial" ? "Gallon" : "Liter"} ($)`,
          data: fuelPriceData,
          borderColor: "#e17055",
          tension: 0.1,
        },
      ],
    },
    options: {
      ...commonOptions,
      plugins: {
        ...commonOptions.plugins,
        title: {
          ...commonOptions.plugins.title,
          text: `Price per ${unit === "imperial" ? "Gallon" : "Liter"} ($)`,
        },
      },
    },
  });
  charts.fuelVolume = new Chart(document.getElementById("fuelVolumeChart"), {
    type: "bar",
    data: {
      labels,
      datasets: [
        {
          label: `Fuel Volume (${unit === "imperial" ? "Gallons" : "Liters"})`,
          data: fuelVolumeData,
          backgroundColor: "#55efc4",
        },
      ],
    },
    options: {
      ...commonOptions,
      plugins: {
        ...commonOptions.plugins,
        title: {
          ...commonOptions.plugins.title,
          text: `Fuel Volume (${unit === "imperial" ? "Gallons" : "Liters"})`,
        },
      },
      scales: {
        ...commonOptions.scales,
        x: { ...commonOptions.scales.x, offset: true },
      },
    },
  });
  charts.cumulativeDistance = new Chart(
    document.getElementById("cumulativeDistanceChart"),
    {
      type: "line",
      data: {
        labels,
        datasets: [
          {
            label: `Cumulative Distance (${
              unit === "imperial" ? "miles" : "km"
            })`,
            data: cumulativeDistanceData,
            borderColor: "#a29bfe",
            backgroundColor: "rgba(162, 155, 254, 0.2)",
            fill: true,
            tension: 0.1,
          },
        ],
      },
      options: {
        ...commonOptions,
        plugins: {
          ...commonOptions.plugins,
          title: {
            ...commonOptions.plugins.title,
            text: `Cumulative Distance (${
              unit === "imperial" ? "miles" : "km"
            })`,
          },
        },
      },
    }
  );
}

/**
 * Initializes listeners for export buttons.
 */
function initExportButtons() {
  document
    .getElementById("exportLogCsvBtn")
    .addEventListener("click", () => exportLog("csv"));
  document
    .getElementById("exportLogJsonBtn")
    .addEventListener("click", () => exportLog("json"));
  document
    .getElementById("exportStatsCsvBtn")
    .addEventListener("click", () => exportStats("csv"));
  document
    .getElementById("exportStatsJsonBtn")
    .addEventListener("click", () => exportStats("json"));
  document
    .getElementById("exportAllChartsPngBtn")
    .addEventListener("click", () => exportAllCharts("png"));
  document
    .getElementById("clearCurrentCarDataBtn")
    .addEventListener("click", clearSession);
}

/**
 * Exports the current car's fuel log data in JSON or CSV format.
 * @param {string} format - The desired export format ('json' or 'csv').
 */
function exportLog(format) {
  const rawEntries = data[currentCar]?.entries;
  if (!rawEntries || rawEntries.length === 0) {
    showMessageBox("No log data to export.");
    return;
  }

  if (format === "json") {
    const blob = new Blob([JSON.stringify(rawEntries, null, 2)], {
      type: "application/json",
    });
    saveAs(blob, `${currentCar}_log.json`);
  } else if (format === "csv") {
    const processedEntries = processEntries(rawEntries); // Use processed entries for CSV
    const csvHeader =
      "Date,OdometerReading,DistanceTraveled,Fuel,PricePerUnit,TotalSpend\n";
    const csvRows = processedEntries
      .map(
        (e) =>
          `${e.date},${
            e.odometerReading !== null ? e.odometerReading.toFixed(2) : "N/A"
          },${
            e.distanceTraveled !== null ? e.distanceTraveled.toFixed(2) : "N/A"
          },${e.fuel !== null ? e.fuel.toFixed(2) : "N/A"},${
            e.price !== null ? e.price.toFixed(3) : "N/A"
          },${e.totalSpend !== null ? e.totalSpend.toFixed(2) : "N/A"}`
      )
      .join("\n");
    const blob = new Blob([csvHeader + csvRows], {
      type: "text/csv;charset=utf-8;",
    });
    saveAs(blob, `${currentCar}_log.csv`);
  }
}

/**
 * Exports the calculated statistics data in JSON or CSV format.
 * @param {string} format - The desired export format ('json' or 'csv').
 */
function exportStats(format) {
  if (Object.keys(allStatsData).length === 0) {
    showMessageBox("No statistics to export. Add more data.");
    return;
  }
  if (format === "json") {
    const blob = new Blob([JSON.stringify(allStatsData, null, 2)], {
      type: "application/json",
    });
    saveAs(blob, `${currentCar}_stats.json`);
  } else if (format === "csv") {
    let csvContent = "Category,Statistic,Value\n";
    for (const category in allStatsData) {
      for (const statistic in allStatsData[category]) {
        // Enclose values in quotes to handle commas within strings
        csvContent += `"${category}","${statistic}","${allStatsData[category][statistic]}"\n`;
      }
      csvContent += "\n"; // Add a blank line between categories for readability
    }
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    saveAs(blob, `${currentCar}_stats.csv`);
  }
}

/**
 * Exports all generated charts as PNG images within a ZIP file.
 * @param {string} format - The image format (e.g., 'png').
 */
function exportAllCharts(format) {
  if (Object.keys(charts).length === 0) {
    showMessageBox("No charts to export. Add more data.");
    return;
  }
  const zip = new JSZip();
  Object.entries(charts).forEach(([name, chart]) => {
    const image = chart.toBase64Image();
    const base64Data = image.split(",")[1]; // Extract base64 part
    zip.file(`${name}_chart.${format}`, base64Data, { base64: true });
  });

  zip.generateAsync({ type: "blob" }).then((content) => {
    saveAs(content, `${currentCar}_charts.zip`);
  });
}

/**
 * Initializes the import button and its change listener.
 */
function initImportButton() {
  document.getElementById("importDataBtn").addEventListener("click", () => {
    document.getElementById("importFileInput").click();
  });
  document
    .getElementById("importFileInput")
    .addEventListener("change", importData);
}

/**
 * Imports fuel log data from a JSON or CSV file, replacing existing entries.
 */
function importData() {
  const fileInput = document.getElementById("importFileInput");
  const file = fileInput.files[0];
  if (!file) {
    showMessageBox("Please select a file to import.");
    return;
  }
  if (!currentCar) {
    showMessageBox("Please select or add a car first before importing data.");
    fileInput.value = ""; // Clear file input
    return;
  }

  const reader = new FileReader();
  reader.onload = (event) => {
    showConfirmBox(
      `This will replace all existing entries for "${currentCar}". Are you sure you want to continue?`,
      () => {
        const content = event.target.result;
        try {
          let importedData = [];
          if (file.name.endsWith(".json")) {
            const parsed = JSON.parse(content);
            // Validate JSON structure
            if (
              Array.isArray(parsed) &&
              parsed.every(
                (e) =>
                  "odometerReading" in e &&
                  "fuel" in e &&
                  "price" in e &&
                  "date" in e
              )
            ) {
              importedData = parsed;
            } else {
              showMessageBox(
                "Invalid JSON format. Expected an array of entry objects with odometerReading, fuel, price, and date."
              );
              return;
            }
          } else if (file.name.endsWith(".csv")) {
            const lines = content.split(/\r?\n/).filter((line) => line.trim());
            if (lines.length < 2) {
              showMessageBox(
                "CSV file needs a header row and at least one data row."
              );
              return;
            }
            const headers = lines[0]
              .toLowerCase()
              .split(",")
              .map((h) => h.trim().replace(/"/g, ""));

            // Map headers to expected indices
            const headerMap = {
              date: headers.indexOf("date"),
              odometerReading: headers.indexOf("odometerreading"),
              fuel: headers.indexOf("fuel"),
              price:
                headers.indexOf("price") !== -1
                  ? headers.indexOf("price")
                  : headers.indexOf("priceperunit"),
            };

            // Check if all required headers are present
            if (Object.values(headerMap).some((index) => index === -1)) {
              showMessageBox(
                `CSV must contain headers: 'date', 'odometerreading', 'fuel', and 'price' (or 'priceperunit').`
              );
              return;
            }

            importedData = lines
              .slice(1)
              .map((line) => {
                const values = line.split(",");
                return {
                  date: values[headerMap.date]?.trim(),
                  odometerReading: parseFloat(
                    values[headerMap.odometerReading]
                  ),
                  fuel: parseFloat(values[headerMap.fuel]),
                  price: parseFloat(values[headerMap.price]),
                };
              })
              // Filter out entries with invalid parsed data
              .filter(
                (e) =>
                  e.date &&
                  !isNaN(e.odometerReading) &&
                  !isNaN(e.fuel) &&
                  !isNaN(e.price)
              );
          } else {
            showMessageBox(
              "Unsupported file type. Please use .json or .csv files."
            );
            return;
          }

          data[currentCar].entries = importedData; // Update entries with edited data
          localStorage.setItem("fuelTrackerData", JSON.stringify(data));
          render(); // Re-render the UI
          showMessageBox(
            `Successfully replaced log with ${importedData.length} imported entries!`
          );
        } catch (e) {
          console.error("Import error:", e);
          showMessageBox(
            "Error processing file. Please ensure it's a valid JSON or CSV format."
          );
        } finally {
          fileInput.value = ""; // Always clear file input
        }
      },
      () => {
        fileInput.value = ""; // Clear file input if cancelled
      }
    );
  };
  reader.readAsText(file); // Read file content as text
}

/**
 * Opens the modal for editing fuel log entries.
 * Uses string concatenation for better DOM performance.
 */
function openEditLogModal() {
  const modal = document.getElementById("editLogModal");
  const tableBody = document.getElementById("editLogBody");
  tableBody.innerHTML = ""; // Clear previous content

  if (
    !currentCar ||
    !data[currentCar] ||
    data[currentCar].entries.length === 0
  ) {
    showMessageBox("No entries to edit for the current car.");
    return;
  }

  // Sort entries by date for consistent editing order
  const sortedEntries = [...data[currentCar].entries].sort(
    (a, b) => new Date(a.date) - new Date(b.date)
  );

  let tableRowsHtml = "";
  sortedEntries.forEach((entry, index) => {
    const rowClass = index === 0 ? "first-entry" : "";
    tableRowsHtml += `
      <tr class="${rowClass}">
          <td><input type="date" value="${entry.date}" class="edit-input" title="Edit date"/></td>
          <td><input type="number" step="0.01" value="${entry.odometerReading}" class="edit-input" title="Edit odometer reading"/></td>
          <td><input type="number" step="0.01" value="${entry.fuel}" class="edit-input" title="Edit fuel amount"/></td>
          <td><input type="number" step="0.001" value="${entry.price}" class="edit-input" title="Edit price per unit"/></td>
      </tr>`;
  });
  tableBody.innerHTML = tableRowsHtml; // Set innerHTML once

  modal.classList.remove("hidden");
  modal.classList.add("visible");
}

/**
 * Saves changes made in the edit fuel log modal.
 */
function saveLogChanges() {
  const tableBody = document.getElementById("editLogBody");
  const rows = tableBody.querySelectorAll("tr");
  const newEntries = [];
  let isValid = true;

  rows.forEach((row) => {
    const inputs = row.querySelectorAll("input");
    const date = inputs[0].value;
    const odometerReading = parseFloat(inputs[1].value);
    const fuel = parseFloat(inputs[2].value);
    const price = parseFloat(inputs[3].value);

    // Validate inputs from the edit modal
    if (!date || isNaN(odometerReading) || isNaN(fuel) || isNaN(price)) {
      isValid = false;
    }
    newEntries.push({ date, odometerReading, fuel, price });
  });

  if (!isValid) {
    showMessageBox(
      "Please ensure all fields in the edit log are filled correctly."
    );
    return;
  }

  data[currentCar].entries = newEntries; // Update entries with edited data
  localStorage.setItem("fuelTrackerData", JSON.stringify(data));
  closeModal(document.getElementById("editLogModal")); // Close modal using generic function
  render(); // Re-render the UI
}

/**
 * Displays a custom message box.
 * @param {string} message - The message to display.
 */
function showMessageBox(message) {
  let msgModal = document.getElementById("messageBoxModal");
  if (!msgModal) {
    // Create modal if it doesn't exist
    msgModal = document.createElement("div");
    msgModal.id = "messageBoxModal";
    msgModal.classList.add("modal", "hidden");
    msgModal.innerHTML = `
            <div class="modal-content">
                <p id="messageBoxText"></p>
                <div class="modal-actions">
                    <button id="messageBoxOkBtn" class="btn-modal-full">OK</button>
                </div>
            </div>
        `;
    document.body.appendChild(msgModal);
    // Set up OK button to close the message box
    document.getElementById("messageBoxOkBtn").addEventListener("click", () => {
      closeModal(msgModal);
    });
    // Add click outside listener for message box
    msgModal.addEventListener("click", function (event) {
      if (event.target === this) {
        closeModal(msgModal);
      }
    });
  }
  document.getElementById("messageBoxText").textContent = message; // Set message text
  msgModal.classList.remove("hidden");
  msgModal.classList.add("visible");
}

/**
 * Displays a custom confirmation box.
 * @param {string} message - The confirmation message.
 * @param {Function} onConfirm - Callback function to execute if 'OK' is clicked.
 * @param {Function} [onCancel] - Optional callback function to execute if 'Cancel' is clicked.
 */
function showConfirmBox(message, onConfirm, onCancel = () => {}) {
  let confirmModal = document.getElementById("confirmBoxModal");
  if (!confirmModal) {
    // Create modal if it doesn't exist
    confirmModal = document.createElement("div");
    confirmModal.id = "confirmBoxModal";
    confirmModal.classList.add("modal", "hidden");
    confirmModal.innerHTML = `
            <div class="modal-content">
                <p id="confirmBoxText"></p>
                <div class="modal-actions">
                    <button id="confirmBoxOkBtn" class="btn-modal-full">OK</button>
                    <button id="confirmBoxCancelBtn" class="btn-modal-full">Cancel</button>
                </div>
            </div>
        `;
    document.body.appendChild(confirmModal);

    // Add click outside listener for confirm box
    confirmModal.addEventListener("click", function (event) {
      if (event.target === this) {
        closeModal(confirmModal, onCancel); // If cancelled by clicking outside, trigger onCancel
      }
    });
  }

  document.getElementById("confirmBoxText").textContent = message; // Set message text

  const okBtn = document.getElementById("confirmBoxOkBtn");
  const cancelBtn = document.getElementById("confirmBoxCancelBtn");

  // Clear previous event listeners to prevent multiple calls
  okBtn.removeEventListener("click", okBtn.currentListener);
  cancelBtn.removeEventListener("click", cancelBtn.currentListener);

  // Define new listeners
  okBtn.currentListener = () => {
    closeModal(confirmModal, onConfirm); // Close modal then execute onConfirm
  };
  cancelBtn.currentListener = () => {
    closeModal(confirmModal, onCancel); // Close modal then execute onCancel
  };

  // Set new event listeners
  okBtn.addEventListener("click", okBtn.currentListener);
  cancelBtn.addEventListener("click", cancelBtn.currentListener);

  confirmModal.classList.remove("hidden");
  confirmModal.classList.add("visible");
}

/**
 * Initializes global keyboard navigation for form inputs.
 * Pressing Enter will move focus to the next input or submit the form.
 */
function initKeyboardNavigation() {
  document.addEventListener("keydown", (event) => {
    if (event.key === "Enter") {
      const activeElement = document.activeElement;

      // Handle main fuel entry form
      if (activeElement.closest("#fuelForm")) {
        const formInputs = Array.from(
          document.querySelectorAll(
            '#fuelForm input, #fuelForm button[type="submit"]'
          )
        );
        const currentIndex = formInputs.indexOf(activeElement);

        if (currentIndex !== -1) {
          event.preventDefault(); // Prevent default Enter behavior (e.g., newline in textareas)
          if (currentIndex < formInputs.length - 1) {
            formInputs[currentIndex + 1].focus(); // Move to next input
          } else {
            // If last input, trigger form submission
            document.getElementById("fuelForm").requestSubmit();
          }
        }
      }

      // Handle Add Car / Edit Car inputs
      const carControls = document.querySelector(".car-controls");
      if (
        carControls &&
        (activeElement === document.getElementById("newCarNameInput") ||
          activeElement === document.getElementById("newCarPriceInput") ||
          activeElement === document.getElementById("editCarNameInput") ||
          activeElement === document.getElementById("editCarPriceInput"))
      ) {
        const currentInputs = Array.from(
          carControls.querySelectorAll(
            'input[type="text"], input[type="number"]'
          )
        );
        const saveButton =
          document.getElementById("saveNewCarBtn") ||
          document.getElementById("saveCarDetailsBtn");

        const allCarFormElements = [...currentInputs];
        if (saveButton) allCarFormElements.push(saveButton);

        const currentIndex = allCarFormElements.indexOf(activeElement);

        if (currentIndex !== -1) {
          event.preventDefault();
          if (currentIndex < allCarFormElements.length - 1) {
            allCarFormElements[currentIndex + 1].focus();
          } else if (activeElement.tagName === "INPUT") {
            // If on the last input, trigger the save button's click
            if (saveButton && saveButton.offsetParent !== null) {
              // Check if visible
              saveButton.click();
            }
          }
        }
      }
    }
  });
}
