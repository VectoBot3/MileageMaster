# MileageMaster: *Fuel Tracking for EVERY Driver.*
MileageMaster is a free, intuitive web app designed for tracking vehicle fuel economy and costs. Log fill-ups, analyze statistics, visualize trends, and manage multiple vehicles with ease!

## About the Creator:
Hey everyone! My name is Aren Yeghikian, and I'm currently a high school junior. I built this app as a summer project for college applications, inspired by my dad.

In 2020, my father bought our family's first hybrid, a 2020 Corolla Hybrid. Over the years, we've owned a 2020 Prius Prime, a 2011 Prius, and our favorite, a 2013 Prius V. Regardless of the car or fill-up location, my dad meticulously recorded everything in a notebook. Year-end, he spent hours tallying this info, manually calculating metrics like MPG and total expenses. It was time-consuming and tedious.

This dedication motivated me, highlighting the time an app could save for any hypermiler. My goal was simple: automate calculations and present clear, useful data. Over multiple years, I developed my coding skills through various high school and community college classes. Despite the endless challenges I met, I persevered. With invaluable input and feedback from my father on real-world use cases, plus great ideas from the hypermiling community, I'm excited to share this free, user-friendly, and feature-rich app.

I welcome everyone to use MileageMaster, share their thoughts, and enjoy its benefits. By becoming more familiar with our vehicles and habits, we can contribute to a cleaner environment. While similar apps exist with the same goal, most need in-app purchases or subscriptions for features MileageMaster offers for free. The aim was to create an accessible tool, providing detailed, enthusiast-focused metrics without cost, and MileageMaster offers. Please share your feedback, report any bugs, or suggest new features. I'll be sure to keep the app updated with planned improvements and suggestions!

## Features:
MileageMaster offers features for clear control and insights into fuel use and costs:

### Multi-Vehicle Management:
-	**Add, select, edit, and remove** multiple car profiles to track each vehicle's data separately. Ideal for families, enthusiasts, or small fleets.
-	**Add New Vehicles:** Create new car profiles with unique names. Optionally add the purchase price for ownership cost calculations.
-	**Edit Vehicle Details:** Update car names or adjust purchase prices anytime to keep records correct.
-	**Delete Vehicles:** Remove a car and all associated data with confirmation. This safety step prevents accidental deletion of records.

### Detailed Fuel Logging:
Log essential refueling info using a straightforward form, capturing every detail.
-	**Odometer Reading:** Enter current mileage/kilometers at refueling, crucial for calculating travel distance.
-	**Fuel Added:** Specify the exact amount of fuel (e.g., 10.5 liters, 12.3 gallons). Accuracy directly affects fuel efficiency calculations.
-	**Price per Unit:** Enter the precise price paid per unit (e.g., $1.50/liter, $4.25/gallon) for exact fuel cost tracking.
-	**Date of Entry:** Use the date picker to select the refueling date, useful for time-based analysis and sorting.
-	**First Entry Highlight:** The first entry for any car is highlighted in the log, marking the starting point for calculations.

### Flexible Unit Systems:
Seamlessly switch between Metric (L/100km) and Imperial (MPG) units. Preexisting data automatically converts, ensuring consistency and accuracy. The app defaults on the region's common unit system (e.g., Imperial for US) upon first use.

### Comprehensive Statistics:
Get real-time, in-depth calculations for metrics including distance traveled, total money spent, and fuel efficiency.
-	**Minimum Entry Requirement:** Detailed stats and interactive charts appear after logging at least three valid fuel entries (excluding the first odometer reading), ensuring useful and reliable data analysis.
-	**Primary Statistics:** See key performance numbers at once: total distance driven, total fuel used, overall total cost, and average fuel efficiency.
-	**Detailed Categorized Sections:** Explore complex statistics, organized into expandable sections:
  -	**Time-Based:** Track driving and fuel habits over time, including total days tracked, average days between fill-ups, and daily cost.
	-	**Distance:** Understand driving patterns with metrics like average distance per entry, longest/shortest trips, and distance variation.
	-	**Fuel & Cost:** Understand your spending with average price per unit, average cost per fill-up, most/least expensive fill-ups, and cost per unit of distance traveled.
	-	**Efficiency:** Track best, worst, and median fuel efficiency. Includes rolling averages (3 and 5-entry for smoother trends) and efficiency fluctuation.
	-	**Volatility:** Check consistency of fuel prices and total fill-up costs. Higher numbers show more fluctuation.
-	**Note on Accuracy:** In-car fuel economy calculations (like those on infotainment or trip-computer screens) often decrease in accuracy with age. Apps such as these provide independent calculations and increased long-term accuracy.

### Interactive Charts:
Visualize fuel usage, costs, and trends with dynamic, responsive Chart.js-powered charts. These visuals simplify patterns and changes over time.
-	**Chart Types:** Explore line charts for trends (MPG/L/100km, cost per distance, fuel price changes, cumulative distance) and bar charts for individual entry data (cost per entry, fuel volume).
-	**Enlarged View:** Click any chart to open it in a larger pop-up window for a more detailed view.
-	**Chart Export:** Download individual charts as high-quality PNG images. For convenience, export all charts at once in a single, organized ZIP file.

### Data Import/Export:
Easily manage and transfer logged fuel data.
-	**Export Log:** Save the complete fuel log as a Comma Separated Values (CSV) or JavaScript Object Notation (JSON) file. Perfect for backups or use with other analysis tools.
-	**Export Statistics:** Download all calculated statistics as a CSV or JSON file, providing a summary of vehicle performance.
-	**Export All Charts:** Download a ZIP archive holding high-resolution PNG images of all generated charts, perfect for presentations or personal records.
-	**Import Data:** Easily import existing fuel data from previously exported JSON or CSV files. Easily move data or add old records. A confirmation pop-up appears before imports to prevent accidental overrides. 

### Log Management:
Keep fuel records correct and organized with these comprehensive tools:
-	**Sortable Table:** The full fuel log displays on a clear table. Sort entries (ascending/descending) by clicking column headers like "Date," "Odometer," "Distance," "Fuel," "Price/Unit," and "Total Spent."
-	**Invalid Entry Identification:** Problematic entries (e.g., non-increasing odometer) are highlighted in red. This visual cue helps in spotting and fixing issues. To ensure accuracy, MileageMaster automatically excludes invalid entries from calculations.
-	**Edit Log Modal:** Open a pop-up to conveniently change log entries. Quickly correct dates, odometer readings, fuel amounts, and prices across multiple records.
-	**Delete Individual Entries:** Remove specific fuel entries using the "❌" icon next to each row. Confirmation prevents accidental deletion.
-	**Clear Current Vehicle Data:** Erase all fuel entries for the current vehicle. A confirmation prompt appears, as this action cannot be reversed. 

### User Interface:
Experience a modern, intuitive, and responsive design!
-	**Modern Aesthetic:** A clean, flat, and responsive design guarantees a wonderful experience on any device.
-	**Dark and Light Theme Toggle:** Effortlessly switch themes to match visual preference. The app remembers the choice.
-	**Helpful Tutorial:** A friendly pop-up automatically guides unaccustomed users through primary features on their first visit.
-	**Custom Modals:** All alert and confirmation messages use custom-designed pop-up windows, keeping a consistent, polished app appearance. 
-	**Tooltips:** Hover over stats or controls for informative tooltips providing extra context and explanations, making the app easier to understand.

### Device Compatibility:
-	**Responsive Design:** Enjoy a seamless experience on any screen size or device, from desktops to tablets and smartphones.

### User Guidance & Accessibility:
-	**Interactive Tutorial:** A helpful tutorial guides new users through the app's core functionalities upon first launch.
-	**Clear Messaging:** Intuitive prompts and messages provide guidance and feedback throughout the app's use.
-	**Keyboard Navigation:** Navigate the entire application seamlessly using only your keyboard, enhancing accessibility and efficiency.

## Technologies Used:
MileageMaster utilizes standard web technologies and relies on these open-source libraries for it’s functionality:
-	**HTML5:** The language used to structure the web app's content and layout.
-	**CSS3:** Provides all styling for the app's modern, clean, and responsive look.
-	**JavaScript:** The main programming language behind interactive elements, dynamic content updates, data calculations, and overall logic.
-	**Chart.js:** A powerful and flexible JavaScript charting library used for dynamic, interactive data visualizations (line and bar charts).
	-	**https://www.chartjs.org/**
-	**FileSaver.js:** A client-side JavaScript library enabling direct data export features for CSV, JSON, and PNG file types. 
	-	**https://github.com/eligrey/FileSaver.js/**
-	**JSZip:** A JavaScript library for creating, reading, and editing .zip files in the browser, crucial for grouping multiple PNG charts into one downloadable archive.
	-	**https://stuk.github.io/jszip/**

## Getting Started:
Using MileageMaster is easy; simply open MileageMaster.github.io on any internet browser. No downloads are necessary, as all calculations and data management happens on the web. MileageMaster also does not need any personal information and even stores information locally in the browser, keeping privacy and accessibility. 

### How to Use MileageMaster — A Quick Tutorial:
MileageMaster is intuitive. Here’s a step-by-step guide to maximize its features:
1.	**Launch the App:** Open MileageMaster.github.io in a supported browser. First-time users will see a theme selection pop-up, followed by a welcome tutorial guiding them through initial setup and features.
2.	**Add Your Car:**
	-	Go to the "Car Selection" section.
	-	Click "+ Add Car."
	-	Type a unique name (e.g., "My Daily Driver").
	-	Optionally, enter the car's original purchase price for "Total Cost of Ownership" calculations.
	-	Click "Save." The new car is automatically selected, ready for fuel logging.
3.	**Set Your Units:**
	-	In the header, find the "Units" dropdown.
	-	Choose "Metric (L/100km)" or "Imperial (MPG)."
	-	Changing units after adding entries automatically converts all existing data.
4.	**Log Your Fuel Entries:**
	-	Go to the "New Fuel Entry" section.
	-	Fill in all required boxes:
		- **Odometer Reading:** Current mileage/kilometers at refueling.
		- **Fuel Added:** Exact fuel amount (e.g., 10.5 liters).
		- **Price per Unit:** Cost per liter/gallon (e.g., $1.50/L).
		- **Date:** Select the fill-up date.
	-	Click "Add Entry." The new entry appears on the "Fuel Log" table.
	-	The first entry for any car is highlighted as the starting point for stats.
5.	**View and Manage Your Fuel Log:**
	-	The "Fuel Log" table displays all recorded entries.
	-	**Sort:** Click any column header ("Date," "Odometer," etc.) to sort entries.
	-	**Edit:** Click "Edit Log" to open a pop-up for changing multiple entries. Click "Save Changes" when done.
	-	**Delete:** Click the "❌" icon next to an entry to remove it. Confirmation prevents accidental deletion.
	-	**Notices:** Check below the table for important notifications or error messages, especially for data entry issues.
6.	**Analyze Statistics and Charts:**
	-	With at least three valid fuel entries (excluding the first odometer reading), "Statistics," "Total Cost of Ownership," and "Charts" sections activate.
	-	**Statistics:** View main statistics at the top. Expand accordion sections ("Time-Based," "Efficiency," etc.) for detailed numbers.
	-	**Charts:** Explore visual data trends. Click any chart to enlarge it in a pop-up.
7.	**Export Your Data:**
	-	MileageMaster allows data export for backups or other programs.
	-	**Log:** In "Fuel Log," select "Export Log (CSV)" or "Export Log (JSON)" to download raw entry data.
	-	**Statistics:** In "Statistics," use "Export Stats (CSV)" or "Export Stats (JSON)" to download a summary of calculated metrics.
	-	**Charts:** In the "Charts" section, click "Export All Charts (PNG)" to download a ZIP file of all generated charts. To download a single chart, click it to enlarge, then click "Download Chart (PNG)."
8.	**Import Data:**
	-	To load old entries or data, go to "Fuel Log" and click "Import Data." Then, select a JSON or CSV file from your computer. 
	-	***Note: Importing data replaces existing entries for the selected car. A confirmation pop-up appears, as this action is irreversible.***
9.	**Clear Data:**
	-	To clear data for a specific car, go to "Fuel Log" and click "Clear Current Car Data." A confirmation prompt appears, as this action is irreversible.
10.	**Theme Toggle:**
	-	In the header, click the theme toggle switch to switch between light and dark modes. The app remembers your preferences.
11.	**Help/Tutorial:**
	-	For a quick refresher or guidance, click the "Help / Tutorial" button in the footer. This re-opens the first-use tutorial.
12.	**FAQ & Tips:**
	-	For common questions and helpful tips, please visit our [FAQ & Tips page](faq-tips.html) or click on the "FAQ & Tips" button at the bottom of the main page.

## Contribution & Feedback:
MileageMaster is an open-source project built with passion and community collaboration. Insights, bug reports, and feature suggestions are welcome! Please open an issue on the GitHub repository or email me directly at **yeghikianaren@gmail.com**. I'm always looking forward to improving the app based on your needs!

## License:
Copyright © 2025 Aren Yeghikian

This project is open-source and available under the MIT License. See the LICENSE.md file for full details.

#### ***Thanks for using MileageMaster!***
