#include <WiFi.h>
#include <Adafruit_GFX.h>
#include <Adafruit_SSD1306.h>
#include <Adafruit_AHTX0.h> // Library for DHT20
#include <ThingSpeak.h>
#include <esp_sleep.h>
#include <DFRobot_MAX17043.h> // Library for DFR0563 battery monitor
#include <Wire.h>
#include <BH1750.h> // Library for BH1750 light sensor
#include <EEPROM.h>

// secrets
#define WIFI_SSID "CHANGE"
#define WIFI_PASSWORD "CHANGE"
unsigned long myChannelNumber = CHANGE; // ThingSpeak channel number
const char* myWriteAPIKey = "CHANGE"; // ThingSpeak channel write API key

// variables
#define DISPLAY_DURATION 5000 // Duration to show the display before going back to deep sleep (milliseconds)
#define INIT_DISPLAY_DURATION 1000 // Duration to show the initial display message
#define SLEEP_DURATION 300 // Deep sleep duration in seconds
#define WIFI_MAX_RETRIES 5 // Maximum number of Wi-Fi connection retries
#define EEPROM_SIZE 1
#define IN_GREENHOUSE_ADDR 0

// error codes
#define WIFI_CONNECTION_FAILURE_FLASHES 2
#define THINGSPEAK_UPDATE_FAILURE_FLASHES 3
#define DISPLAY_INIT_FAILURE_FLASHES 5
#define DHT20_FAILURE_FLASHES 6
#define BH1750_FAILURE_FLASHES 7
#define BATTERY_MONITOR_FAILURE_FLASHES 8

// pins
#define GREEN_LED_PIN 2 // GPIO pin for the green LED
#define RED_LED_PIN 4 // GPIO pin for the red LED
#define BLUE_LED_PIN 16 // GPIO pin for the blue LED
#define SENSOR_POWER_PIN 13 // GPIO pin to control power to sensors
#define BUTTON_PIN 15 // GPIO pin for the button
#define TOGGLE_BUTTON_PIN 27 // GPIO pin for the toggle button
#define SOIL_MOISTURE_PIN 34 // GPIO pin for the soil moisture sensor
#define BATTERY_VOLTAGE_PIN 35 // GPIO pin to monitor the voltage of the batteries
#define TRIGGER_PIN 25 // GPIO pin for the HC-SR04 trigger
#define ECHO_PIN 26 // GPIO pin for the HC-SR04 echo

// instances
Adafruit_AHTX0 aht; // Create an instance of the DHT20 sensor
DFRobot_MAX17043 batteryMonitor; // Create an instance of the DFR0563 battery monitor
BH1750 lightMeter; // Create an instance of the BH1750 light sensor
WiFiClient client;
Adafruit_SSD1306 display(128, 64, &Wire, -1);

// flag
bool inGreenHouse = false;

struct SensorData {
  float temperature;
  float humidity;
  int32_t rssi;
  int soilMoisture;
  float batteryVoltage;
  int batteryPercentage;
  float distance;
  float lux;
  String status;
};

#define NUM_READINGS 5 // Number of readings to average
#define READING_DELAY 50 // Delay between readings in milliseconds

void flashLED(int pin, int times, int delayTime = 180) {
  for (int i = 0; i < times; i++) {
    digitalWrite(pin, HIGH);
    delay(delayTime);
    digitalWrite(pin, LOW);
    delay(delayTime);
  }
}

void connectToWiFi() {
  int retries = 0;
  WiFi.begin(WIFI_SSID, WIFI_PASSWORD);
  Serial.print("Connecting to WiFi...");

  while (WiFi.status() != WL_CONNECTED && retries < WIFI_MAX_RETRIES) {
    delay(500);
    Serial.print(".");
    retries++;
  }

  if (WiFi.status() == WL_CONNECTED) {
    Serial.println("Connected to WiFi");
  } else {
    Serial.println("Failed to connect to WiFi");
    flashLED(RED_LED_PIN, WIFI_CONNECTION_FAILURE_FLASHES);
  }
}

void initializeDisplay() {
  Serial.println("Initializing display...");
  if (!display.begin(SSD1306_SWITCHCAPVCC, 0x3C)) {
    Serial.println("SSD1306 allocation failed");
    display.setCursor(0, 0);
    display.print("D init fail");
    display.display();
    flashLED(RED_LED_PIN, DISPLAY_INIT_FAILURE_FLASHES);
  } else {
    display.clearDisplay();
    display.setTextSize(1);
    display.setTextColor(SSD1306_WHITE);
    display.setCursor(0, 0);
    display.print("Drivhus - FmR - 2024");
    display.display();
  }
}

void initializeSensors() {
  if (!aht.begin()) {
    Serial.println("Could not find a valid DHT20 sensor, check wiring!");
    display.clearDisplay();
    display.setCursor(0, 0);
    display.print("DHT20 fail");
    display.display();
    flashLED(RED_LED_PIN, DHT20_FAILURE_FLASHES);
  }

  if (!lightMeter.begin()) {
    Serial.println("Could not find a valid BH1750 sensor, check wiring!");
    display.clearDisplay();
    display.setCursor(0, 0);
    display.print("BH1750 fail");
    display.display();
    flashLED(RED_LED_PIN, BH1750_FAILURE_FLASHES);
  }
}

void initializeBatteryMonitor() {
  while(batteryMonitor.begin() != 0) {
    Serial.println("gauge begin failed!");
    flashLED(RED_LED_PIN, BATTERY_MONITOR_FAILURE_FLASHES);
    delay(500);
  }
}

void gatherAverageData(SensorData& data) {
  float tempSum = 0;
  float humSum = 0;
  int rssiSum = 0;
  int soilMoistureSum = 0;
  float batteryVoltageSum = 0;
  int batteryPercentageSum = 0;
  float distanceSum = 0;
  float luxSum = 0;

  for (int i = 0; i < NUM_READINGS; i++) {
    sensors_event_t humidity_event, temp_event;
    aht.getEvent(&humidity_event, &temp_event);
    tempSum += temp_event.temperature;
    humSum += humidity_event.relative_humidity;
    
    rssiSum += WiFi.RSSI();

    int rawSoilMoisture = analogRead(SOIL_MOISTURE_PIN);
    soilMoistureSum += (100 - ((rawSoilMoisture / 4095.00) * 100));

    batteryVoltageSum += batteryMonitor.readVoltage() / 1000.0;
    batteryPercentageSum += static_cast<int>(batteryMonitor.readPercentage());

    digitalWrite(TRIGGER_PIN, LOW);
    delayMicroseconds(2);
    digitalWrite(TRIGGER_PIN, HIGH);
    delayMicroseconds(10);
    digitalWrite(TRIGGER_PIN, LOW);
    long duration = pulseIn(ECHO_PIN, HIGH);
    distanceSum += duration * 0.0343 / 2;

    luxSum += lightMeter.readLightLevel();

    delay(READING_DELAY);
  }

  data.temperature = tempSum / NUM_READINGS;
  data.humidity = humSum / NUM_READINGS;
  data.rssi = rssiSum / NUM_READINGS;
  data.soilMoisture = soilMoistureSum / NUM_READINGS;
  data.batteryVoltage = batteryVoltageSum / NUM_READINGS;
  data.batteryPercentage = batteryPercentageSum / NUM_READINGS;
  data.distance = distanceSum / NUM_READINGS;
  data.lux = luxSum / NUM_READINGS;
}

void gatherData(SensorData& data) {
  gatherAverageData(data);

  // Calculate the status string
  data.status = "";
  if (data.temperature < 14) data.status += "COLD";
  else if (data.temperature > 40) data.status += "HOT";
  else data.status += "TOK";

  if (data.lux < 2) data.status += "-NIGHT";
  else if (data.lux < 1200) data.status += "-SHADE";
  else data.status += "-SUN";

  if (data.distance < 3) data.status += "-CLOSE";
  else data.status += "-OPEN";

  if (data.batteryPercentage < 50) data.status += "-BLOW";
  else data.status += "-BOK";
}

void displayData(const SensorData& data) {
  display.clearDisplay();
  display.setCursor(0, 0);
  display.print(WiFi.localIP());
  display.print(" ");
  display.print(data.rssi);
  display.print("dBm");
  display.setCursor(0, 10);
  display.print("T:");
  display.print(data.temperature, 1);
  display.print(" H:");
  display.print(data.humidity, 1);
  display.print(" S:");
  display.print(data.soilMoisture);
  display.setCursor(0, 20);
  display.print("G:");
  display.print(data.batteryVoltage, 2);
  display.print("V ");
  display.print(data.batteryPercentage);
  display.print("%");
  display.setCursor(0, 30);
  display.print("D:");
  display.print(data.distance, 1);
  display.print(" L:");
  display.print(data.lux, 1);
  display.setCursor(0, 40);
  display.print(data.status);
  display.display();
}

void postToThingSpeak(const SensorData& data) {
  Serial.println("Setting fields...");
  ThingSpeak.setField(1, data.temperature);
  ThingSpeak.setField(2, data.humidity);
  ThingSpeak.setField(3, data.rssi);
  ThingSpeak.setField(4, data.soilMoisture);
  ThingSpeak.setField(5, data.batteryVoltage);
  ThingSpeak.setField(6, data.batteryPercentage);
  ThingSpeak.setField(7, data.distance);
  ThingSpeak.setField(8, data.lux);
  
  // Set the status
  ThingSpeak.setStatus(data.status);

  Serial.println("Attempting to update ThingSpeak...");
  int result = ThingSpeak.writeFields(myChannelNumber, myWriteAPIKey);

  if (result == 200) {
    Serial.println("Channel update successful.");
  } else {
    Serial.println("Problem updating channel. HTTP error code " + String(result));
    flashLED(RED_LED_PIN, THINGSPEAK_UPDATE_FAILURE_FLASHES);
  }
}

void postToSerial(const SensorData& data) {
  Serial.print("RSSI: ");
  Serial.print(data.rssi);
  Serial.println(" dBm");

  Serial.print("Temp: ");
  Serial.println(data.temperature);
  Serial.print("Humidity: ");
  Serial.println(data.humidity);
  Serial.print("Soil Moisture: ");
  Serial.println(data.soilMoisture);
  Serial.print("Battery Voltage: ");
  Serial.print(data.batteryVoltage, 2);
  Serial.println("V");
  Serial.print("Battery Percentage: ");
  Serial.print(data.batteryPercentage);
  Serial.println("%");
  Serial.print("Distance: ");
  Serial.print(data.distance, 1);
  Serial.println(" cm");
  Serial.print("Light Intensity: ");
  Serial.print(data.lux, 1);
  Serial.println(" lx");
  Serial.print("Status: ");
  Serial.println(data.status);
}

void goToDeepSleep() {
  // Turn off all LEDs
  digitalWrite(GREEN_LED_PIN, LOW);
  digitalWrite(RED_LED_PIN, LOW);
  digitalWrite(BLUE_LED_PIN, LOW);
  
  // Turn off the power to the sensors
  digitalWrite(SENSOR_POWER_PIN, LOW);

  // Enable wakeup on button press (LOW) for both buttons
  esp_sleep_enable_ext1_wakeup((1ULL << BUTTON_PIN) | (1ULL << TOGGLE_BUTTON_PIN), ESP_EXT1_WAKEUP_ANY_HIGH);
  esp_sleep_enable_timer_wakeup(SLEEP_DURATION * 1000000); // Wake up after SLEEP_DURATION seconds

  Serial.println("Going to deep sleep...");
  esp_deep_sleep_start();
}

void setup() {
  Serial.begin(115200);
  pinMode(BUTTON_PIN, INPUT_PULLUP);
  pinMode(TOGGLE_BUTTON_PIN, INPUT_PULLUP);
  pinMode(SOIL_MOISTURE_PIN, INPUT);
  pinMode(GREEN_LED_PIN, OUTPUT);
  pinMode(RED_LED_PIN, OUTPUT);
  pinMode(BLUE_LED_PIN, OUTPUT);
  pinMode(SENSOR_POWER_PIN, OUTPUT);
  pinMode(TRIGGER_PIN, OUTPUT);
  pinMode(ECHO_PIN, INPUT);

  // Initialize EEPROM
  EEPROM.begin(EEPROM_SIZE);
  inGreenHouse = EEPROM.read(IN_GREENHOUSE_ADDR);

  // Turn on the green LED and blue LED if inGreenHouse is true
  if (inGreenHouse) {
    digitalWrite(GREEN_LED_PIN, HIGH);
    digitalWrite(BLUE_LED_PIN, HIGH);
  } else {
    digitalWrite(GREEN_LED_PIN, HIGH);
    digitalWrite(BLUE_LED_PIN, LOW);
  }

  // Check if wakeup was caused by deep sleep
  esp_sleep_wakeup_cause_t wakeup_reason = esp_sleep_get_wakeup_cause();
  bool displayOn = false;

  if (wakeup_reason == ESP_SLEEP_WAKEUP_EXT1) {
    uint64_t wakeup_pin_mask = esp_sleep_get_ext1_wakeup_status();
    if (wakeup_pin_mask & (1ULL << TOGGLE_BUTTON_PIN)) {
      Serial.println("Toggle button pressed, toggling greenhouse flag");
      inGreenHouse = !inGreenHouse;
      EEPROM.write(IN_GREENHOUSE_ADDR, inGreenHouse);
      EEPROM.commit();
      if (inGreenHouse) {
        flashLED(BLUE_LED_PIN, 4);
      } else {
        flashLED(BLUE_LED_PIN, 2);
      }
      goToDeepSleep();
    } else if (wakeup_pin_mask & (1ULL << BUTTON_PIN)) {
      Serial.println("Woke up from deep sleep by main button press");
      displayOn = true;
    }
  } else if (wakeup_reason == ESP_SLEEP_WAKEUP_TIMER) {
    Serial.println("Woke up from deep sleep by timer");
  } else {
    Serial.println("Starting fresh");
    displayOn = true;
  }

  // Turn on the power to the sensors
  digitalWrite(SENSOR_POWER_PIN, HIGH);

  // Initialize the OLED display if required
  if (displayOn) {
    initializeDisplay();
    delay(INIT_DISPLAY_DURATION); // Show initial display message
  }

  // Initialize the DHT20 sensor
  initializeSensors();

  // Initialize the battery monitor
  initializeBatteryMonitor();

  // Connect to Wi-Fi
  connectToWiFi();

  // Gather and display data
  SensorData data;
  gatherData(data);
  if (displayOn) {
    displayData(data);
  }

  // Post data to ThingSpeak if inGreenHouse is true
  if (inGreenHouse) {
    Serial.println("Initializing ThingSpeak...");
    ThingSpeak.begin(client);
    postToThingSpeak(data);
  }

  // Post data to Serial
  postToSerial(data);

  // Keep the display on for 5 seconds if it was turned on
  if (displayOn) {
    delay(DISPLAY_DURATION);
    // Turn off the display to save power
    display.ssd1306_command(SSD1306_DISPLAYOFF);
  }

  goToDeepSleep();
}

void loop() {
  // This will not be called
}
