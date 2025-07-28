// Core logic for Fuel Economy Tracker with charts and export
let currentCar = null;
let data = JSON.parse(localStorage.getItem('fuelTrackerData')) || {};
let charts = {};
let allStatsData = {}; // To store calculated stats for export
const STATS_THRESHOLD = 3; // Minimum valid entries to show detailed stats, charts, ownership cost

// New state variable for sorting the log table
let sortConfig = {
    key: 'date',
    direction: 'asc'
};

window.onload = () => {
  initAppSequence();
};

/**
 * Initializes the application, checking for theme and tutorial preferences first.
 */
function initAppSequence() {
  const seenTutorial = localStorage.getItem('seenTutorial');
  const savedTheme = localStorage.getItem('themePreference');
  const themeModal = document.getElementById('themeModal');

  if (!savedTheme) {
    themeModal.classList.remove('hidden');
    themeModal.classList.add('visible');
    document.getElementById('lightThemeBtn').onclick = () => {
      setTheme('light');
      themeModal.classList.remove('visible');
      setTimeout(() => {
        themeModal.classList.add('hidden');
        if (!seenTutorial) showTutorialModal();
        initCoreApp();
      }, 300);
    };
    document.getElementById('darkThemeBtn').onclick = () => {
      setTheme('dark');
      themeModal.classList.remove('visible');
      setTimeout(() => {
        themeModal.classList.add('hidden');
        if (!seenTutorial) showTutorialModal();
        initCoreApp();
      }, 300);
    };
  } else {
    setTheme(savedTheme, false);
    if (!seenTutorial) {
      setTimeout(() => {
        showTutorialModal();
        initCoreApp();
      }, 100);
    } else {
      initCoreApp();
    }
  }
}

/**
 * Shows the tutorial modal.
 */
function showTutorialModal() {
  const tutorialModal = document.getElementById('tutorialModal');
  tutorialModal.classList.remove('hidden');
  tutorialModal.classList.add('visible');
  localStorage.setItem('seenTutorial', 'true');
}

/**
 * Initializes the core application components and event listeners.
 */
function initCoreApp() {
  initTheme();
  initUnitSystem();
  initCarSelection();
  initForm();
  initTutorialButton();
  initChartControls();
  initAccordionControls();
  initEditLogControls();
  initLogTableSorting(); // Initialize sorting controls
  render();
}

/**
 * Sets up the theme toggle switch.
 */
function initTheme() {
  const themeToggle = document.getElementById('themeToggle');
  const themeLabel = document.getElementById('themeLabel');
  themeToggle.checked = document.body.classList.contains('dark-theme');
  themeLabel.textContent = themeToggle.checked ? '🌙 Dark Mode' : '☀️ Light Mode';
  themeToggle.addEventListener('change', () => {
    setTheme(themeToggle.checked ? 'dark' : 'light');
  });
}

/**
 * Sets the color theme for the application.
 * @param {string} themeName - The name of the theme ('light' or 'dark').
 * @param {boolean} save - Whether to save the preference to localStorage.
 */
function setTheme(themeName, save = true) {
  const themeToggle = document.getElementById('themeToggle');
  const themeLabel = document.getElementById('themeLabel');
  if (themeName === 'dark') {
    document.body.classList.add('dark-theme');
    themeToggle.checked = true;
    themeLabel.textContent = '🌙 Dark Mode';
  } else {
    document.body.classList.remove('dark-theme');
    themeToggle.checked = false;
    themeLabel.textContent = '☀️ Light Mode';
  }
  if (save) {
    localStorage.setItem('themePreference', themeName);
  }
  if (currentCar && data[currentCar]) {
    render(); // Re-render to update chart colors
  }
}

/**
 * Initializes the unit system selector and handles unit conversions.
 */
function initUnitSystem() {
  const unitSelect = document.getElementById('unitSystem');
  const storedUnit = localStorage.getItem('unitSystem');
  if (!storedUnit) {
    const defaultUnit = (navigator.language.startsWith('en-US')) ? 'imperial' : 'metric';
    localStorage.setItem('unitSystem', defaultUnit);
    unitSelect.value = defaultUnit;
  } else {
    unitSelect.value = storedUnit;
  }
  unitSelect.addEventListener('change', (event) => {
    const newUnit = event.target.value;
    const oldUnit = localStorage.getItem('unitSystem');
    if (newUnit !== oldUnit && currentCar && data[currentCar]) {
      convertUnits(oldUnit, newUnit);
    }
    localStorage.setItem('unitSystem', newUnit);
    render();
  });
}

/**
 * Converts all entry data for the current car between metric and imperial units.
 * @param {string} oldUnit - The original unit system.
 * @param {string} newUnit - The target unit system.
 */
function convertUnits(oldUnit, newUnit) {
  if (!currentCar || !data[currentCar]) return;
  data[currentCar].entries = data[currentCar].entries.map(entry => {
    let convertedOdometer = entry.odometerReading;
    let convertedFuel = entry.fuel;
    let convertedPrice = entry.price;
    if (oldUnit === 'metric' && newUnit === 'imperial') {
      convertedOdometer *= 0.621371;
      convertedFuel *= 0.264172;
      convertedPrice *= 3.78541;
    } else if (oldUnit === 'imperial' && newUnit === 'metric') {
      convertedOdometer /= 0.621371;
      convertedFuel /= 0.264172;
      convertedPrice /= 3.78541;
    }
    return { ...entry, odometerReading: parseFloat(convertedOdometer.toFixed(2)), fuel: parseFloat(convertedFuel.toFixed(2)), price: parseFloat(convertedPrice.toFixed(3)) };
  });
  localStorage.setItem('fuelTrackerData', JSON.stringify(data));
}

/**
 * Populates the car selection UI and handles car management actions.
 */
function initCarSelection() {
  Object.keys(data).forEach(car => {
    if (Array.isArray(data[car])) {
      data[car] = { price: null, entries: data[car] };
    }
  });
  localStorage.setItem('fuelTrackerData', JSON.stringify(data));

  const carSelectContainer = document.querySelector('.car-controls');
  carSelectContainer.innerHTML = '';

  const carSelect = document.createElement('select');
  carSelect.id = 'carSelect';
  carSelect.title = 'Select an existing car';

  const addCarBtn = document.createElement('button');
  addCarBtn.textContent = '+ Add Car';
  addCarBtn.title = 'Add a new car';
  addCarBtn.onclick = () => {
    carSelectContainer.innerHTML = '';
    const carNameInput = document.createElement('input');
    carNameInput.type = 'text';
    carNameInput.placeholder = 'Enter new car name';
    const carPriceInput = document.createElement('input');
    carPriceInput.type = 'number';
    carPriceInput.placeholder = 'Car Price (Optional)';
    const saveNewCarBtn = document.createElement('button');
    saveNewCarBtn.textContent = 'Save';
    saveNewCarBtn.onclick = () => {
      const newCar = carNameInput.value.trim();
      const newCarPrice = parseFloat(carPriceInput.value) || null;
      if (newCar && !data[newCar]) {
        data[newCar] = { price: newCarPrice, entries: [] };
        localStorage.setItem('fuelTrackerData', JSON.stringify(data));
        currentCar = newCar;
        initCarSelection();
        render();
      } else if (newCar) {
        // Replaced alert with a custom message box or modal
        showMessageBox('Car name already exists!');
      }
      else { initCarSelection(); render(); }
    };
    const cancelBtn = document.createElement('button');
    cancelBtn.textContent = 'Cancel';
    cancelBtn.onclick = () => { initCarSelection(); render(); };
    carSelectContainer.append(carNameInput, carPriceInput, saveNewCarBtn, cancelBtn);
    carNameInput.focus();
  };

  const editCarBtn = document.createElement('button');
  editCarBtn.textContent = 'Edit Car';
  editCarBtn.title = 'Edit selected car details';
  editCarBtn.onclick = editCarDetails;

  const deleteCarBtn = document.createElement('button');
  deleteCarBtn.textContent = 'Delete Car';
  deleteCarBtn.title = 'Delete selected car';
  deleteCarBtn.onclick = deleteCar;

  Object.keys(data).forEach(car => {
    const option = document.createElement('option');
    option.value = car;
    option.textContent = car;
    carSelect.appendChild(option);
  });

  carSelect.addEventListener('change', () => {
    currentCar = carSelect.value;
    render();
  });

  carSelectContainer.append(carSelect, addCarBtn);
  if (Object.keys(data).length > 0) {
    carSelectContainer.append(editCarBtn, deleteCarBtn);
  }

  const cars = Object.keys(data);
  if (cars.length > 0) {
    if (!currentCar || !data[currentCar]) {
      currentCar = cars[0];
    }
    carSelect.value = currentCar;
  } else {
    currentCar = null;
    if (!localStorage.getItem('addedFirstCar')) {
      addCarBtn.click();
      localStorage.setItem('addedFirstCar', 'true');
    }
  }
}

/**
 * Displays UI for editing the current car's name and price.
 */
function editCarDetails() {
  const carSelectContainer = document.querySelector('.car-controls');
  const currentName = currentCar;
  if (!currentName) {
    showMessageBox('No car selected.');
    return;
  }
  const currentPrice = data[currentName].price || '';

  const carNameInput = document.createElement('input');
  carNameInput.type = 'text';
  carNameInput.id = 'editCarNameInput';
  carNameInput.value = currentName;
  const carPriceInput = document.createElement('input');
  carPriceInput.type = 'number';
  carPriceInput.id = 'editCarPriceInput';
  carPriceInput.value = currentPrice;
  carPriceInput.placeholder = 'Car Price (Optional)';
  const saveBtn = document.createElement('button');
  saveBtn.textContent = 'Save';
  saveBtn.onclick = () => saveCarDetails(currentName);
  const cancelBtn = document.createElement('button');
  cancelBtn.textContent = 'Cancel';
  cancelBtn.onclick = cancelCarNameEdit;

  carSelectContainer.innerHTML = '';
  carSelectContainer.append(carNameInput, carPriceInput, saveBtn, cancelBtn);
  carNameInput.focus();
}

/**
 * Saves the updated car details.
 * @param {string} oldCarName - The original name of the car being edited.
 */
function saveCarDetails(oldCarName) {
  const newCarName = document.getElementById('editCarNameInput').value.trim();
  const newCarPrice = parseFloat(document.getElementById('editCarPriceInput').value) || null;
  if (!newCarName) {
    showMessageBox('Car name cannot be empty.');
    return;
  }
  if (newCarName !== oldCarName && data[newCarName]) {
    showMessageBox('Car name already exists!');
    return;
  }
  if (newCarName === oldCarName) {
    data[oldCarName].price = newCarPrice;
  } else {
    data[newCarName] = data[oldCarName];
    data[newCarName].price = newCarPrice;
    delete data[oldCarName];
    currentCar = newCarName;
  }
  localStorage.setItem('fuelTrackerData', JSON.stringify(data));
  initCarSelection();
  render();
}

/**
 * Cancels the car editing process and restores the selection UI.
 */
function cancelCarNameEdit() {
  initCarSelection();
  render();
}

/**
 * Deletes the currently selected car and all its data.
 */
function deleteCar() {
  if (!currentCar) {
    showMessageBox('No car selected.');
    return;
  }
  showConfirmBox(`Delete "${currentCar}" and all its data? This cannot be undone.`, () => {
    delete data[currentCar];
    localStorage.setItem('fuelTrackerData', JSON.stringify(data));
    currentCar = null;
    initCarSelection();
    render();
  });
}

/**
 * Clears all fuel entries for the currently selected car.
 */
function clearSession() {
  if (!currentCar) {
    showMessageBox('No car selected.');
    return;
  }
  showConfirmBox(`Clear all fuel entries for "${currentCar}"? This cannot be undone.`, () => {
    data[currentCar].entries = [];
    localStorage.setItem('fuelTrackerData', JSON.stringify(data));
    render();
  });
}

/**
 * Initializes the fuel entry form.
 */
function initForm() {
  document.getElementById('fuelForm').addEventListener('submit', e => {
    e.preventDefault();
    const odometerReading = parseFloat(document.getElementById('odometerReading').value);
    const fuel = parseFloat(document.getElementById('fuel').value);
    const price = parseFloat(document.getElementById('price').value);
    const date = document.getElementById('date').value;
    if (!currentCar) {
      showMessageBox('Please select or add a car.');
      return;
    }
    if (!isNaN(odometerReading) && !isNaN(fuel) && !isNaN(price) && date) {
      data[currentCar].entries.push({ odometerReading, fuel, price, date });
      localStorage.setItem('fuelTrackerData', JSON.stringify(data));
      render();
      e.target.reset();
      document.getElementById('date').value = '';
    } else {
      showMessageBox('Please fill all fields correctly.');
    }
  });
}

/**
 * Initializes the help/tutorial button and modal close function.
 */
function initTutorialButton() {
  document.getElementById('helpBtn').onclick = showTutorialModal;
  window.closeTutorial = () => {
    const tutorialModal = document.getElementById('tutorialModal');
    tutorialModal.classList.remove('visible');
    setTimeout(() => tutorialModal.classList.add('hidden'), 300);
  };
}

/**
 * Initializes click handlers for chart containers to open them in a modal.
 */
function initChartControls() {
  // Use event delegation on the parent container
  document.getElementById('chartsContent').addEventListener('click', (event) => {
      const canvas = event.target.closest('canvas');
      if (canvas && canvas.id) {
          const chartId = canvas.id.replace('Chart', '');
          openChartModal(chartId);
      }
  });
}

/**
 * Initializes the "Open All" and "Close All" buttons for the statistics accordion.
 */
function initAccordionControls() {
    document.getElementById('openAllAccordions').addEventListener('click', () => {
        document.querySelectorAll('#statsAccordionContainer details').forEach(detail => {
            detail.open = true;
        });
    });

    document.getElementById('closeAllAccordions').addEventListener('click', () => {
        document.querySelectorAll('#statsAccordionContainer details').forEach(detail => {
            detail.open = false;
        });
    });
}

/**
 * Initializes the controls for the edit log modal.
 */
function initEditLogControls() {
    document.getElementById('editLogBtn').onclick = openEditLogModal;
    document.getElementById('saveLogChangesBtn').onclick = saveLogChanges;
}

/**
 * Initializes the click handlers for the sortable table headers.
 */
function initLogTableSorting() {
    document.querySelectorAll('#logTable .sortable-header').forEach(header => {
        header.addEventListener('click', () => {
            const sortKey = header.dataset.sortBy;
            if (sortConfig.key === sortKey) {
                // Flip direction
                sortConfig.direction = sortConfig.direction === 'asc' ? 'desc' : 'asc';
            } else {
                // Set new key, default to ascending
                sortConfig.key = sortKey;
                sortConfig.direction = 'asc';
            }
            renderLogTable(processEntries(data[currentCar]?.entries || []));
        });
    });
}

/**
 * Opens a chart in a larger modal view.
 * @param {string} chartName - The name of the chart to open.
 */
function openChartModal(chartName) {
  const modal = document.getElementById('chartModal');
  const modalImage = document.getElementById('modalChartImage');
  const downloadChartBtn = document.getElementById('downloadChartBtn');
  const chartTitle = document.getElementById('modalChartTitle');

  const chartInstance = charts[chartName];
  if (chartInstance) {
    modalImage.src = chartInstance.toBase64Image();
    modalImage.alt = chartInstance.data.datasets[0].label;
    chartTitle.textContent = chartInstance.data.datasets[0].label;

    downloadChartBtn.onclick = () => {
      const link = document.createElement('a');
      link.href = chartInstance.toBase64Image();
      link.download = `${currentCar}_${chartName}_chart.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    };

    modal.classList.remove('hidden');
    modal.classList.add('visible');
  }
}

/**
 * Closes the enlarged chart modal.
 */
function closeChartModal() {
  const modal = document.getElementById('chartModal');
  modal.classList.remove('visible');
  setTimeout(() => modal.classList.add('hidden'), 300);
}

/**
 * Takes raw entries, sorts them by date, and calculates distance and total spend for each.
 * Also identifies potentially invalid entries.
 * @param {Array} rawEntries - The array of raw entry objects.
 * @returns {Array} A new array of processed entry objects with calculated fields and error flags.
 */
function processEntries(rawEntries) {
    if (!rawEntries || rawEntries.length === 0) {
        return [];
    }
    // Always sort by date first to ensure correct distance calculation
    const sortedEntries = [...rawEntries].sort((a, b) => new Date(a.date) - new Date(b.date));

    let hasInvalidEntries = false; // Flag to track if any invalid entry exists
    const processed = sortedEntries.map((entry, index) => {
        const prevEntry = index > 0 ? sortedEntries[index - 1] : null;
        let distanceTraveled = null;
        let isInvalid = false; // Flag for invalid entry for this specific row

        const currentOdo = parseFloat(entry.odometerReading);
        const fuel = parseFloat(entry.fuel);
        const price = parseFloat(entry.price);

        // Basic validation for numbers and date
        if (isNaN(currentOdo) || isNaN(fuel) || isNaN(price) || !entry.date) {
            isInvalid = true;
            hasInvalidEntries = true;
        }

        if (prevEntry) {
            const prevOdo = parseFloat(prevEntry.odometerReading);
            // Odometer must increase to have a valid distance
            if (!isNaN(currentOdo) && !isNaN(prevOdo) && currentOdo > prevOdo) {
                distanceTraveled = currentOdo - prevOdo;
            } else if (!isNaN(currentOdo) && !isNaN(prevOdo) && currentOdo <= prevOdo) {
                isInvalid = true; // Mark as invalid if odometer doesn't increase
                hasInvalidEntries = true;
            }
        }
        
        return {
            ...entry,
            odometerReading: isNaN(currentOdo) ? null : currentOdo,
            fuel: isNaN(fuel) ? null : fuel,
            price: isNaN(price) ? null : price,
            distanceTraveled: distanceTraveled,
            totalSpend: (fuel && price) ? (fuel * price) : null,
            isFirst: index === 0, // Mark the first entry
            isInvalid: isInvalid // Add an invalid flag
        };
    });

    // Store the global invalid entries flag
    if (currentCar) {
        data[currentCar].hasInvalidEntries = hasInvalidEntries;
    }
    return processed;
}

/**
 * The main rendering function. It orchestrates the display of all data.
 */
function render() {
  const rawEntries = (currentCar && data[currentCar]) ? data[currentCar].entries : [];
  const processedEntries = processEntries(rawEntries);
  // Filter out the first entry and any explicitly invalid entries for statistical calculations
  const validEntriesForStats = processedEntries.filter(e => e.distanceTraveled !== null && !e.isInvalid);
  
  renderLogTable(processedEntries);
  
  const totalFuelCost = renderStats(validEntriesForStats);
  renderOwnershipCost(totalFuelCost, validEntriesForStats);
  renderCharts(validEntriesForStats);
}

/**
 * Renders the main fuel log table, sorting it according to the global sortConfig.
 * @param {Array} processedEntries - The array of processed entries to display.
 */
function renderLogTable(processedEntries) {
    const tableBody = document.getElementById('logBody');
    const logNoticesContainer = document.getElementById('logNoticesContainer');
    logNoticesContainer.innerHTML = ''; // Clear existing notices

    tableBody.innerHTML = '';

    const unit = localStorage.getItem('unitSystem') || 'metric';

    const entriesToRender = [...processedEntries].sort((a, b) => {
        const valA = a[sortConfig.key];
        const valB = b[sortConfig.key];
        let comparison = 0;
        if (sortConfig.key === 'date') {
            comparison = new Date(valA) - new Date(valB);
        } else {
            // Handle null/NaN values for numerical sorting
            const numA = parseFloat(valA);
            const numB = parseFloat(valB);
            if (isNaN(numA) && isNaN(numB)) comparison = 0;
            else if (isNaN(numA)) comparison = 1; // Null/NaN values come last
            else if (isNaN(numB)) comparison = -1;
            else comparison = numA - numB;
        }
        return sortConfig.direction === 'asc' ? comparison : comparison * -1;
    });

    if (entriesToRender.length > 0) {
        let hasDataErrors = false;
        entriesToRender.forEach((entry) => {
            // Find the original index to allow deletion from the unsorted master array
            const originalIndex = data[currentCar].entries.findIndex(e => 
                e.date === entry.date && e.odometerReading === entry.odometerReading && e.fuel === entry.fuel && e.price === entry.price
            );

            const distUnit = unit === 'imperial' ? 'miles' : 'km';
            const fuelUnit = unit === 'imperial' ? 'gal' : 'L';
            const tr = document.createElement('tr');
            if (entry.isFirst) {
                tr.classList.add('first-entry');
            }
            if (entry.isInvalid) {
                tr.classList.add('invalid-entry');
                hasDataErrors = true;
            }
            tr.innerHTML = `
                <td>${entry.date || 'N/A'}</td>
                <td>${entry.odometerReading !== null ? `${entry.odometerReading.toFixed(2)} ${distUnit}` : "N/A"}</td>
                <td>${entry.distanceTraveled !== null ? `${entry.distanceTraveled.toFixed(2)} ${distUnit}` : "N/A"}</td>
                <td>${entry.fuel !== null ? `${entry.fuel.toFixed(2)} ${fuelUnit}` : "N/A"}</td>
                <td>${entry.price !== null ? `$${entry.price.toFixed(3)}/${fuelUnit}` : "N/A"}</td>
                <td>${entry.totalSpend !== null ? `$${entry.totalSpend.toFixed(2)}` : "N/A"}</td>
                <td>
                    <button class="delete-btn" onclick="deleteEntry(${originalIndex})" title="Delete this entry">❌</button>
                </td>`;
            tableBody.appendChild(tr);
        });

        const totalEntriesNeeded = STATS_THRESHOLD + 1;
        let logMessageText = '';
        let errorMessageText = '';

        if (hasDataErrors) {
            errorMessageText = `<strong>Data Entry Issue:</strong> Some entries (highlighted in red) appear to have invalid data (e.g., odometer not increasing, missing values). These entries are excluded from statistics. Please edit or delete them for accurate calculations.`;
            const errorDiv = document.createElement('div');
            errorDiv.classList.add('stats-notice', 'error-notice');
            errorDiv.innerHTML = errorMessageText;
            logNoticesContainer.appendChild(errorDiv);
        }

        if (processedEntries.length > 0 && processedEntries.length < totalEntriesNeeded) {
            logMessageText = `<strong>Note:</strong> The first entry (highlighted) establishes your starting odometer reading. For accuracy, at least <strong>${totalEntriesNeeded} total entries</strong> are needed to generate stats and charts.`;
        } else if (processedEntries.length >= totalEntriesNeeded) {
            logMessageText = `<strong>Note:</strong> The first entry is always highlighted as your baseline reading and is excluded from statistics.`;
        }
        
        if (logMessageText) {
            const logDiv = document.createElement('div');
            logDiv.classList.add('stats-notice');
            logDiv.innerHTML = logMessageText;
            logNoticesContainer.appendChild(logDiv);
        }

    } else {
        tableBody.innerHTML = `<tr><td colspan="7">${currentCar ? 'No fuel entries yet.' : 'Please add or select a car.'}</td></tr>`;
    }

    // Update sort indicators on headers
    document.querySelectorAll('#logTable .sortable-header').forEach(header => {
        header.classList.remove('sort-asc', 'sort-desc');
        if (header.dataset.sortBy === sortConfig.key) {
            header.classList.add(`sort-${sortConfig.direction}`);
        }
    });
}

/**
 * Deletes a single fuel entry from the log.
 * @param {number} index - The index of the entry to delete in the original, unsorted array.
 */
function deleteEntry(index) {
  showConfirmBox('Delete this entry?', () => {
    if (index > -1) {
        data[currentCar].entries.splice(index, 1);
        localStorage.setItem('fuelTrackerData', JSON.stringify(data));
        render();
    }
  });
}

/**
 * Renders the statistics section based on valid log entries.
 * @param {Array} logs - The array of valid, processed log entries (first entry and invalid ones excluded).
 * @returns {number} The total cost of fuel.
 */
function renderStats(logs) {
  const statsContent = document.getElementById('statsContent');
  const accordionContainer = document.getElementById('statsAccordionContainer');
  const noticeDiv = document.getElementById('statsNotice');
  const exportButtons = document.querySelector('.stats-export-buttons');
  const accordionControls = document.getElementById('accordionControls');
  const unit = localStorage.getItem('unitSystem') || 'metric';

  statsContent.innerHTML = '';
  accordionContainer.innerHTML = '';
  accordionContainer.classList.add('hidden');
  accordionControls.classList.add('hidden');
  exportButtons.classList.add('hidden');
  noticeDiv.classList.add('hidden');

  if (!currentCar) {
    noticeDiv.innerHTML = `Please select or add a car to view detailed statistics.`;
    noticeDiv.classList.remove('hidden');
    return 0;
  }
  
  if (logs.length < STATS_THRESHOLD) {
    const needed = STATS_THRESHOLD - logs.length;
    noticeDiv.innerHTML = `Please add <strong>${needed}</strong> more valid fuel entr${needed > 1 ? 'ies' : 'y'} to view detailed statistics. (Requires at least ${STATS_THRESHOLD} entries with a calculated distance traveled and no data errors)`;
    noticeDiv.classList.remove('hidden');
    return logs.reduce((sum, l) => sum + l.totalSpend, 0);
  }

  accordionContainer.classList.remove('hidden');
  accordionControls.classList.remove('hidden');
  exportButtons.classList.remove('hidden');

  // --- All Calculations ---
  const distUnit = unit === 'imperial' ? 'mi' : 'km';
  const fuelUnit = unit === 'imperial' ? 'gal' : 'L';
  const effUnit = unit === 'imperial' ? 'MPG' : 'L/100km';
  const perDistUnit = `per ${distUnit}`;

  const efficiencies = logs.map(l => (unit === 'imperial') ? (l.distanceTraveled / l.fuel) : (l.fuel / l.distanceTraveled) * 100);
  const distances = logs.map(l => l.distanceTraveled);
  const fuelVolumes = logs.map(l => l.fuel);
  const prices = logs.map(l => l.price);
  const costs = logs.map(l => l.totalSpend);
  const dates = logs.map(l => new Date(l.date));

  const totalDist = distances.reduce((s, a) => s + a, 0);
  const totalFuel = fuelVolumes.reduce((s, a) => s + a, 0);
  const totalCost = costs.reduce((s, a) => s + a, 0);
  const avgEff = (totalFuel > 0) ? ((unit === 'imperial') ? (totalDist / totalFuel) : (totalFuel / totalDist) * 100) : 0;

  const getStdDev = (arr) => {
    if (arr.length < 2) return 0;
    const mean = arr.reduce((s, a) => s + a, 0) / arr.length;
    return Math.sqrt(arr.map(x => Math.pow(x - mean, 2)).reduce((s, a) => s + a, 0) / (arr.length - 1));
  };
  const getRollingAvg = (arr, window) => {
    if (arr.length < window) return 'N/A';
    const lastItems = arr.slice(-window);
    return lastItems.reduce((s, a) => s + a, 0) / window;
  };
  const getMedian = (arr) => {
    const sorted = [...arr].sort((a, b) => a - b);
    const mid = Math.floor(sorted.length / 2);
    return sorted.length % 2 !== 0 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
  };

  const firstDate = dates.length > 0 ? dates[0] : null;
  const lastDate = dates.length > 0 ? dates[dates.length - 1] : null;
  const totalDays = (firstDate && lastDate) ? Math.max(1, (lastDate - firstDate) / (1000 * 3600 * 24)) : 0;
  
  const dateGaps = dates.slice(1).map((date, i) => (date - dates[i]) / (1000 * 3600 * 24));
  const avgDaysBetweenEntries = dateGaps.length > 0 ? (dateGaps.reduce((s, a) => s + a, 0) / dateGaps.length) : 0;
  const longestGapBetweenEntries = dateGaps.length > 0 ? Math.max(...dateGaps) : 0;

  allStatsData = {
    'Primary': { 'Total Distance': `${totalDist.toFixed(2)} ${distUnit}`, 'Total Fuel': `${totalFuel.toFixed(2)} ${fuelUnit}`, 'Total Cost': `$${totalCost.toFixed(2)}`, 'Average Efficiency': `${avgEff.toFixed(2)} ${effUnit}` },
    'Time-Based': { 'Total Days Tracked': `${Math.round(totalDays)} days`, 'Average Days Between Entries': `${avgDaysBetweenEntries.toFixed(1)} days`, 'Distance per Day': `${(totalDist / totalDays).toFixed(2)} ${distUnit}`, 'Fuel Cost per Day': `$${(totalCost / totalDays).toFixed(2)}`, 'Longest Gap Between Entries': `${longestGapBetweenEntries.toFixed(0)} days` },
    'Distance': { 'Average Distance per Entry': `${(totalDist / logs.length).toFixed(2)} ${distUnit}`, 'Longest Distance on One Entry': `${Math.max(...distances).toFixed(2)} ${distUnit}`, 'Shortest Distance on One Entry': `${Math.min(...distances).toFixed(2)} ${distUnit}`, 'Std. Dev. of Distance': `${getStdDev(distances).toFixed(2)} ${distUnit}` },
    'Fuel & Cost': { 'Average Price per Unit': `$${(totalFuel > 0 ? (totalCost / totalFuel) : 0).toFixed(3)}/${fuelUnit}`, 'Average Cost per Entry': `$${(totalCost / logs.length).toFixed(2)}`, 'Most Expensive Entry': `$${Math.max(...costs).toFixed(2)}`, 'Cheapest Entry': `$${Math.min(...costs).toFixed(2)}`, 'Cost per Distance': `$${(totalDist > 0 ? (totalCost / totalDist) : 0).toFixed(3)} ${perDistUnit}`, 'Distance per Dollar': `${(totalCost > 0 ? (totalDist / totalCost) : 0).toFixed(2)} ${distUnit}/$` },
    'Efficiency': { 'Best Efficiency': `${(unit === 'imperial' ? Math.max(...efficiencies) : Math.min(...efficiencies)).toFixed(2)} ${effUnit}`, 'Worst Efficiency': `${(unit === 'imperial' ? Math.min(...efficiencies) : Math.max(...efficiencies)).toFixed(2)} ${effUnit}`, 'Median Efficiency': `${getMedian(efficiencies).toFixed(2)} ${effUnit}`, 'Std. Dev. of Efficiency': `${getStdDev(efficiencies).toFixed(2)} ${effUnit}`, '3-Entry Rolling Avg': `${getRollingAvg(efficiencies, 3) !== 'N/A' ? getRollingAvg(efficiencies, 3).toFixed(2) : 'N/A'} ${effUnit}`, '5-Entry Rolling Avg': `${getRollingAvg(efficiencies, 5) !== 'N/A' ? getRollingAvg(efficiencies, 5).toFixed(2) : 'N/A'} ${effUnit}` },
    'Volatility': { 'Std. Dev. of Fuel Price': `$${getStdDev(prices).toFixed(3)}`, 'Std. Dev. of Entry Cost': `$${getStdDev(costs).toFixed(2)}` }
  };

  statsContent.innerHTML = Object.entries(allStatsData.Primary).map(([key, val]) => `<div class="stat-card"><p><strong>${key}:</strong> ${val}</p></div>`).join('');
  const tooltips = { 'Time-Based': 'Statistics related to the passage of time between entries.', 'Distance': 'Analysis of the distance traveled between each refuel.', 'Fuel & Cost': 'Metrics about fuel volume, unit price, and total expenditure.', 'Efficiency': 'In-depth analysis of your vehicle\'s fuel efficiency trends.', 'Volatility': 'Measures the consistency of prices and costs over time. Higher numbers mean more fluctuation.' };
  accordionContainer.innerHTML = Object.entries(allStatsData).slice(1).map(([category, stats]) => `
    <details>
      <summary>${category}<span class="tooltip-icon">?<span class="tooltip-text">${tooltips[category]}</span></span></summary>
      <div class="accordion-content"><div class="stats-grid-container">
        ${Object.entries(stats).map(([key, val]) => `<div class="stat-card"><p><strong>${key}:</strong> ${val}</p></div>`).join('')}
      </div></div>
    </details>`).join('');
  
  return totalCost;
}

/**
 * Renders the Total Cost of Ownership section.
 * @param {number} totalFuelCost - The calculated total cost of fuel.
 * @param {Array} logs - The array of valid, processed log entries.
 */
function renderOwnershipCost(totalFuelCost, logs) {
  const ownershipSection = document.getElementById('ownershipCost');
  const ownershipContent = document.getElementById('ownershipCostContent');
  const ownershipNotice = document.getElementById('ownershipCostNotice');
  const carPrice = data[currentCar]?.price;

  ownershipContent.innerHTML = '';
  ownershipNotice.classList.add('hidden');
  ownershipSection.classList.remove('visible');

  if (!currentCar) {
    ownershipNotice.innerHTML = `Please select or add a car to view Total Cost of Ownership.`;
    ownershipNotice.classList.remove('hidden');
    return;
  }

  if (typeof carPrice !== 'number' || carPrice <= 0) {
    ownershipNotice.innerHTML = `To see Total Cost of Ownership, please <a href="#" onclick="editCarDetails(); return false;">edit your car</a> and add its purchase price.`;
    ownershipNotice.classList.remove('hidden');
    return;
  }

  if (logs.length < STATS_THRESHOLD) {
    const needed = STATS_THRESHOLD - logs.length;
    ownershipNotice.innerHTML = `Please add <strong>${needed}</strong> more valid fuel entr${needed > 1 ? 'ies' : 'y'} to calculate Total Cost of Ownership.`;
    ownershipNotice.classList.remove('hidden');
    return;
  }

  const totalOwnershipCost = carPrice + totalFuelCost;
  const firstDate = new Date(logs[0].date);
  const lastDate = new Date(logs[logs.length - 1].date);
  const daysDiff = Math.max(1, (lastDate.getTime() - firstDate.getTime()) / (1000 * 3600 * 24));
  const costPerDay = totalOwnershipCost / daysDiff;

  ownershipContent.innerHTML = `
        <div class="stat-card"><p><strong>Car Purchase Price:</strong> $${carPrice.toFixed(2)}</p></div>
        <div class="stat-card"><p><strong>Total Fuel Cost:</strong> $${totalFuelCost.toFixed(2)}</p></div>
        <div class="stat-card"><p><strong>Total Ownership Cost (Price + Fuel):</strong> $${totalOwnershipCost.toFixed(2)}</p></div>
        <div class="stat-card"><p><strong>Cost per Year:</strong> $${(costPerDay * 365.25).toFixed(2)}</p></div>
        <div class="stat-card"><p><strong>Cost per Month:</strong> $${(costPerDay * 30.44).toFixed(2)}</p></div>
        <div class="stat-card"><p><strong>Cost per Week:</strong> $${(costPerDay * 7).toFixed(2)}</p></div>
        <div class="stat-card"><p><strong>Cost per Day:</strong> $${costPerDay.toFixed(2)}</p></div>`;
  ownershipSection.classList.add('visible');
}

/**
 * Renders all the charts based on valid log entries.
 * @param {Array} logs - The array of valid, processed log entries.
 */
function renderCharts(logs) {
  Object.values(charts).forEach(chart => chart.destroy());
  charts = {};

  const chartsContent = document.getElementById('chartsContent');
  const chartsNotice = document.getElementById('chartsNotice');
  const exportButtons = document.querySelector('.charts-export-buttons');
  const unit = localStorage.getItem('unitSystem') || 'metric';

  chartsContent.querySelector('.chart-display-area').innerHTML = '';
  exportButtons.classList.add('hidden');
  chartsNotice.classList.add('hidden');

  if (!currentCar) {
    chartsNotice.innerHTML = `Please select or add a car to view charts.`;
    chartsNotice.classList.remove('hidden');
    return;
  }

  if (logs.length < STATS_THRESHOLD) {
    const needed = STATS_THRESHOLD - logs.length;
    chartsNotice.innerHTML = `Please add <strong>${needed}</strong> more valid fuel entr${needed > 1 ? 'ies' : 'y'} to display charts.`;
    chartsNotice.classList.remove('hidden');
    return;
  }

  const chartDisplayArea = chartsContent.querySelector('.chart-display-area');
  chartDisplayArea.innerHTML = `
    <div id="efficiencyChartContainer" class="chart-container"><canvas id="efficiencyChart"></canvas></div>
    <div id="costChartContainer" class="chart-container"><canvas id="costChart"></canvas></div>
    <div id="costPerDistanceChartContainer" class="chart-container"><canvas id="costPerDistanceChart"></canvas></div>
    <div id="fuelPriceChartContainer" class="chart-container"><canvas id="fuelPriceChart"></canvas></div>
    <div id="fuelVolumeChartContainer" class="chart-container"><canvas id="fuelVolumeChart"></canvas></div>
    <div id="cumulativeDistanceChartContainer" class="chart-container"><canvas id="cumulativeDistanceChart"></canvas></div>`;

  exportButtons.classList.remove('hidden');

  const labels = logs.map(e => e.date);
  const efficiencyData = logs.map(e => (unit === 'imperial' ? (e.distanceTraveled / e.fuel) : (e.fuel / e.distanceTraveled) * 100));
  const costData = logs.map(e => e.totalSpend);
  const costPerDistanceData = logs.map(e => e.totalSpend / e.distanceTraveled);
  const fuelPriceData = logs.map(e => e.price);
  const fuelVolumeData = logs.map(e => e.fuel);
  const cumulativeDistanceData = logs.reduce((acc, e) => [...acc, (acc.length > 0 ? acc[acc.length - 1] : 0) + e.distanceTraveled], []);

  const chartTextColor = getComputedStyle(document.body).getPropertyValue('--text-color');
  const chartBorderColor = getComputedStyle(document.body).getPropertyValue('--border-color');
  const commonOptions = { responsive: true, maintainAspectRatio: false, plugins: { legend: { labels: { color: chartTextColor } } }, scales: { x: { ticks: { color: chartTextColor }, grid: { color: chartBorderColor } }, y: { beginAtZero: true, ticks: { color: chartTextColor }, grid: { color: chartBorderColor } } } };

  charts.efficiency = new Chart(document.getElementById('efficiencyChart'), { type: 'line', data: { labels, datasets: [{ label: unit === 'imperial' ? 'MPG' : 'L/100km', data: efficiencyData, borderColor: '#00cec9', tension: 0.1 }] }, options: { ...commonOptions, scales: { ...commonOptions.scales, y: { ...commonOptions.scales.y, reverse: unit === 'metric' } } } });
  charts.cost = new Chart(document.getElementById('costChart'), { type: 'bar', data: { labels, datasets: [{ label: 'Cost per Entry ($)', data: costData, backgroundColor: '#0984e3' }] }, options: commonOptions });
  charts.costPerDistance = new Chart(document.getElementById('costPerDistanceChart'), { type: 'line', data: { labels, datasets: [{ label: `Cost per ${unit === 'imperial' ? 'Mile' : 'KM'} ($)`, data: costPerDistanceData, borderColor: '#fdcb6e', tension: 0.1 }] }, options: commonOptions });
  charts.fuelPrice = new Chart(document.getElementById('fuelPriceChart'), { type: 'line', data: { labels, datasets: [{ label: `Price per ${unit === 'imperial' ? 'Gallon' : 'Liter'} ($)`, data: fuelPriceData, borderColor: '#e17055', tension: 0.1 }] }, options: commonOptions });
  charts.fuelVolume = new Chart(document.getElementById('fuelVolumeChart'), { type: 'bar', data: { labels, datasets: [{ label: `Fuel Volume (${unit === 'imperial' ? 'Gallons' : 'Liters'})`, data: fuelVolumeData, backgroundColor: '#55efc4' }] }, options: commonOptions });
  charts.cumulativeDistance = new Chart(document.getElementById('cumulativeDistanceChart'), { type: 'line', data: { labels, datasets: [{ label: `Cumulative Distance (${unit === 'imperial' ? 'miles' : 'km'})`, data: cumulativeDistanceData, borderColor: '#a29bfe', backgroundColor: 'rgba(162, 155, 254, 0.2)', fill: true, tension: 0.1 }] }, options: commonOptions });
}

/**
 * Exports the fuel log to either JSON or CSV format, including all entries.
 * @param {string} format - The desired format ('json' or 'csv').
 */
function exportLog(format) {
  const rawEntries = data[currentCar]?.entries;
  if (!rawEntries || rawEntries.length === 0) {
    showMessageBox('No log data to export.');
    return;
  }

  if (format === 'json') {
    const blob = new Blob([JSON.stringify(rawEntries, null, 2)], { type: 'application/json' });
    saveAs(blob, `${currentCar}_log.json`);
  } else if (format === 'csv') {
    const processedEntries = processEntries(rawEntries); 
    const csvHeader = 'Date,OdometerReading,DistanceTraveled,Fuel,PricePerUnit,TotalSpend\n';
    const csvRows = processedEntries.map(e => 
        `${e.date},${e.odometerReading !== null ? e.odometerReading.toFixed(2) : 'N/A'},${e.distanceTraveled !== null ? e.distanceTraveled.toFixed(2) : 'N/A'},${e.fuel !== null ? e.fuel.toFixed(2) : 'N/A'},${e.price !== null ? e.price.toFixed(3) : 'N/A'},${e.totalSpend !== null ? e.totalSpend.toFixed(2) : 'N/A'}`
    ).join('\n');
    const blob = new Blob([csvHeader + csvRows], { type: 'text/csv;charset=utf-8;' });
    saveAs(blob, `${currentCar}_log.csv`);
  }
}

/**
 * Exports the calculated statistics to either JSON or CSV format.
 * @param {string} format - The desired format ('json' or 'csv').
 */
function exportStats(format) {
  if (Object.keys(allStatsData).length === 0) {
    showMessageBox("No statistics to export. Add more data.");
    return;
  }
  if (format === 'json') {
    const blob = new Blob([JSON.stringify(allStatsData, null, 2)], { type: 'application/json' });
    saveAs(blob, `${currentCar}_stats.json`);
  } else if (format === 'csv') {
    let csvContent = "Category,Statistic,Value\n";
    for (const category in allStatsData) {
      for (const statistic in allStatsData[category]) {
        csvContent += `"${category}","${statistic}","${allStatsData[category][statistic]}"\n`;
      }
      // Add an empty row between categories for better readability in CSV
      csvContent += "\n"; 
    }
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    saveAs(blob, `${currentCar}_stats.csv`);
  }
}

/**
 * Exports all charts as a single ZIP file of PNG images.
 * @param {string} format - The image format (currently 'png').
 */
function exportAllCharts(format) {
  if (Object.keys(charts).length === 0) {
    showMessageBox("No charts to export. Add more data.");
    return;
  }
  const zip = new JSZip();
  Object.entries(charts).forEach(([name, chart]) => {
      const image = chart.toBase64Image();
      const base64Data = image.split(',')[1];
      zip.file(`${name}_chart.${format}`, base64Data, { base64: true });
  });

  zip.generateAsync({ type: "blob" }).then(content => {
    saveAs(content, `${currentCar}_charts.zip`);
  });
}

/**
 * Imports fuel data from a user-selected JSON or CSV file, replacing existing data.
 */
function importData() {
  const fileInput = document.getElementById('importFileInput');
  const file = fileInput.files[0];
  if (!file) {
    showMessageBox('Please select a file.');
    return;
  }
  if (!currentCar) {
    showMessageBox('Please select or add a car first.');
    fileInput.value = '';
    return;
  }
  
  const reader = new FileReader();
  reader.onload = (event) => {
    showConfirmBox(`This will replace all existing entries for "${currentCar}". Are you sure you want to continue?`, () => {
        const content = event.target.result;
        try {
          let importedData = [];
          if (file.name.endsWith('.json')) {
            const parsed = JSON.parse(content);
            if (Array.isArray(parsed) && parsed.every(e => 'odometerReading' in e && 'fuel' in e && 'price' in e && 'date' in e)) {
                importedData = parsed;
            } else {
              showMessageBox('Invalid JSON format. Expected an array of entry objects.');
              return;
            }
          } else if (file.name.endsWith('.csv')) {
            const lines = content.split(/\r?\n/).filter(line => line.trim());
            if (lines.length < 2) {
                showMessageBox('CSV file needs a header and at least one data row.');
                return;
            }
            const headers = lines[0].toLowerCase().split(',').map(h => h.trim().replace(/"/g, ''));
            const dateIndex = headers.indexOf('date');
            const odoIndex = headers.indexOf('odometerreading');
            const fuelIndex = headers.indexOf('fuel');
            let priceIndex = headers.indexOf('price');
            if (priceIndex === -1) priceIndex = headers.indexOf('priceperunit');

            if ([dateIndex, odoIndex, fuelIndex, priceIndex].includes(-1)) {
                showMessageBox(`CSV must contain headers: 'date', 'odometerreading', 'fuel', and 'price' (or 'priceperunit').`);
                return;
            }
            
            importedData = lines.slice(1).map(line => {
              const values = line.split(',');
              return {
                date: values[dateIndex]?.trim(),
                odometerReading: parseFloat(values[odoIndex]),
                fuel: parseFloat(values[fuelIndex]),
                price: parseFloat(values[priceIndex])
              };
            }).filter(e => e.date && !isNaN(e.odometerReading) && !isNaN(e.fuel) && !isNaN(e.price));
          } else {
            showMessageBox('Unsupported file. Please use .json or .csv');
            return;
          }

          data[currentCar].entries = importedData;
          localStorage.setItem('fuelTrackerData', JSON.stringify(data));
          render();
          showMessageBox(`Successfully replaced log with ${importedData.length} imported entries!`);

        } catch (e) {
          console.error('Import error:', e);
          showMessageBox('Error processing file. Please ensure it\'s a valid JSON or CSV format.');
        } finally {
          fileInput.value = '';
        }
    }, () => { // Cancel callback
        fileInput.value = ''; // Reset file input even if canceled
    });
  };
  reader.readAsText(file);
}

// --- Edit Log Modal Functions ---

/**
 * Opens the modal for editing the entire log.
 */
function openEditLogModal() {
    const modal = document.getElementById('editLogModal');
    const tableBody = document.getElementById('editLogBody');
    tableBody.innerHTML = '';

    if (!currentCar || !data[currentCar] || data[currentCar].entries.length === 0) {
        showMessageBox("No entries to edit.");
        return;
    }

    const sortedEntries = [...data[currentCar].entries].sort((a,b) => new Date(a.date) - new Date(b.date));

    sortedEntries.forEach((entry, index) => {
        const tr = document.createElement('tr');
        if (index === 0) {
            tr.classList.add('first-entry');
        }
        tr.innerHTML = `
            <td><input type="date" value="${entry.date}" class="edit-input"/></td>
            <td><input type="number" step="0.01" value="${entry.odometerReading}" class="edit-input"/></td>
            <td><input type="number" step="0.01" value="${entry.fuel}" class="edit-input"/></td>
            <td><input type="number" step="0.001" value="${entry.price}" class="edit-input"/></td>
        `;
        tableBody.appendChild(tr);
    });

    modal.classList.remove('hidden');
    modal.classList.add('visible');
}

/**
 * Saves all changes made in the edit log modal.
 */
function saveLogChanges() {
    const tableBody = document.getElementById('editLogBody');
    const rows = tableBody.querySelectorAll('tr');
    const newEntries = [];
    let isValid = true;

    rows.forEach(row => {
        const inputs = row.querySelectorAll('input');
        const date = inputs[0].value;
        const odometerReading = parseFloat(inputs[1].value);
        const fuel = parseFloat(inputs[2].value);
        const price = parseFloat(inputs[3].value);

        if (!date || isNaN(odometerReading) || isNaN(fuel) || isNaN(price)) {
            isValid = false;
        }
        newEntries.push({ date, odometerReading, fuel, price });
    });

    if (!isValid) {
        showMessageBox("Please ensure all fields are filled correctly.");
        return;
    }

    data[currentCar].entries = newEntries;
    localStorage.setItem('fuelTrackerData', JSON.stringify(data));
    closeEditLogModal();
    render();
}

/**
 * Closes the edit log modal.
 */
function closeEditLogModal() {
    const modal = document.getElementById('editLogModal');
    modal.classList.remove('visible');
    setTimeout(() => modal.classList.add('hidden'), 300);
}

/**
 * Displays a custom message box instead of alert().
 * @param {string} message - The message to display.
 */
function showMessageBox(message) {
    // Create modal elements if they don't exist
    let msgModal = document.getElementById('messageBoxModal');
    if (!msgModal) {
        msgModal = document.createElement('div');
        msgModal.id = 'messageBoxModal';
        msgModal.classList.add('modal', 'hidden');
        msgModal.innerHTML = `
            <div class="modal-content">
                <p id="messageBoxText"></p>
                <div class="modal-actions">
                    <button id="messageBoxOkBtn">OK</button>
                </div>
            </div>
        `;
        document.body.appendChild(msgModal);
        document.getElementById('messageBoxOkBtn').onclick = () => {
            msgModal.classList.remove('visible');
            setTimeout(() => msgModal.classList.add('hidden'), 300);
        };
    }
    document.getElementById('messageBoxText').textContent = message;
    msgModal.classList.remove('hidden');
    msgModal.classList.add('visible');
}

/**
 * Displays a custom confirmation box instead of confirm().
 * @param {string} message - The message to display.
 * @param {function} onConfirm - Callback function if user confirms.
 * @param {function} onCancel - Callback function if user cancels.
 */
function showConfirmBox(message, onConfirm, onCancel = () => {}) {
    let confirmModal = document.getElementById('confirmBoxModal');
    if (!confirmModal) {
        confirmModal = document.createElement('div');
        confirmModal.id = 'confirmBoxModal';
        confirmModal.classList.add('modal', 'hidden');
        confirmModal.innerHTML = `
            <div class="modal-content">
                <p id="confirmBoxText"></p>
                <div class="modal-actions">
                    <button id="confirmBoxOkBtn">OK</button>
                    <button id="confirmBoxCancelBtn">Cancel</button>
                </div>
            </div>
        `;
        document.body.appendChild(confirmModal);
    }

    document.getElementById('confirmBoxText').textContent = message;

    const okBtn = document.getElementById('confirmBoxOkBtn');
    const cancelBtn = document.getElementById('confirmBoxCancelBtn');

    // Clear previous event listeners
    okBtn.onclick = null;
    cancelBtn.onclick = null;

    okBtn.onclick = () => {
        confirmModal.classList.remove('visible');
        setTimeout(() => confirmModal.classList.add('hidden'), 300);
        if (onConfirm) onConfirm();
    };

    cancelBtn.onclick = () => {
        confirmModal.classList.remove('visible');
        setTimeout(() => confirmModal.classList.add('hidden'), 300);
        if (onCancel) onCancel();
    };

    confirmModal.classList.remove('hidden');
    confirmModal.classList.add('visible');
}
