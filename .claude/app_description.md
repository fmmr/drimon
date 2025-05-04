# DriMon 
Main project folder: ~/projects/drimon/

Drimon is my greenhouse monitor repo.  20240724_drimon_1_3/ contains the code which runs on an esp32 to gather sensor data and post these to thingspeak.

docs/ is the application for showing data.  it's a github docs repo - so asny changes pushed to git are set in production automatically.  It consists f data from thingspeak - in form of a HTML page with header, including data, data-selectors and other command.  and the main portion which are a series of charts.

## Main Structure
- **index.html**: Main application
  - Header with functions and data-chips
  - Chart area (4 rows of 4 charts)
  - Charts can be wide (2 columns) or narrow (1 column)
  - On mobile, charts display vertically
  
- **test.html**: Contains tests for JS/CSS components

## Features
- Language switching flags
- Dark/light mode toggle
- Statistics display toggle for charts

## Chart Components
- Title
- Stats field (min/max/avg/current values)
- Chart lines (single or multiple)
- Optional min/max point markings
- Secondary y-axis option for multiline charts
- Charts always scaled appropriately

## Development Notes
- Git commits should be well-tested
- No commits without explicit request