#include <WiFi.h>
#include <Adafruit_GFX.h>
#include <Adafruit_SSD1306.h>
#include <Adafruit_AHTX0.h> // Library for DHT20
#include <ThingSpeak.h>
#include <esp_sleep.h>
#include <DFRobot_MAX17043.h> // Library for DFR0563 battery monitor
#include <Wire.h>
#include <BH1750.h> // Library for BH1750 light sensor

// secrets
#define WIFI_SSID "CHANGE"
#define WIFI_PASSWORD "CHANGE"
unsigned long myChannelNumber = CHANGE; // ThingSpeak channel number
const char* myWriteAPIKey = "CHANGE"; // ThingSpeak channel write API key

// variables
#define DISPLAY_DURATION 5000 // Duration to show the display before going back to deep sleep (milliseconds)
#define INIT_DISPLAY_DURATION 1000 // Duration to show the initial display message
#define SLEEP_DURATION 300 // Deep sleep duration in seconds
#define WIFI_MAX_RETRIES 3 // Maximum number of Wi-Fi connection retries

// pins
#define GREEN_LED_PIN 2 // GPIO pin for the green LED
#define RED_LED_PIN 4 // GPIO pin for the red LED
#define SENSOR_POWER_PIN 13 // GPIO pin to control power to sensors
#define BUTTON_PIN 15 // GPIO pin for the button
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

void connectToWiFi() {
  int retries = 0;
  WiFi.begin(WIFI_SSID, WIFI_PASSWORD);
  Serial.print("Connecting to WiFi...");

  while (WiFi.status() != WL_CONNECTED && retries < WIFI_MAX_RETRIES) {
    delay(1000);
    Serial.print(".");
    retries++;
  }

  if (WiFi.status() == WL_CONNECTED) {
    Serial.println("Connected to WiFi");
  } else {
    Serial.println("Failed to connect to WiFi");
    flashRedLED(3); // Flash red LED 3 times for WiFi connection failure
  }
}

void initializeDisplay() {
  Serial.println("Initializing display...");
  if (!display.begin(SSD1306_SWITCHCAPVCC, 0x3C)) {
    Serial.println("SSD1306 allocation failed");
    display.setCursor(0, 0);
    display.print("D init fail");
    display.display();
    flashRedLED(5); // Flash red LED 5 times for display initialization failure
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
    flashRedLED(7); // Flash red LED 4 times for sensor initialization failure
  }

  if (!lightMeter.begin()) {
    Serial.println("Could not find a valid BH1750 sensor, check wiring!");
    display.clearDisplay();
    display.setCursor(0, 0);
    display.print("BH1750 fail");
    display.display();
    flashRedLED(8); // Flash red LED 4 times for sensor initialization failure
  }
}

void initializeBatteryMonitor() {
  while(batteryMonitor.begin() != 0) {
    Serial.println("gauge begin faild!");
    flashRedLED(4); // Flash red LED 7 times for battery monitor initialization failure
    delay(500);
  }
}

void gatherData(SensorData& data) {
  data.rssi = WiFi.RSSI();

  sensors_event_t humidity, temp;
  aht.getEvent(&humidity, &temp);
  data.temperature = temp.temperature;
  data.humidity = humidity.relative_humidity;

  int rawSoilMoisture = analogRead(SOIL_MOISTURE_PIN);
  data.soilMoisture = map(rawSoilMoisture, 1900, 4095, 100, 0); // Convert to percentage

  data.batteryVoltage = batteryMonitor.readVoltage() / 1000.0; // Convert millivolts to volts
  data.batteryPercentage = static_cast<int>(batteryMonitor.readPercentage());

  // Measure distance using HC-SR04
  digitalWrite(TRIGGER_PIN, LOW);
  delayMicroseconds(2);
  digitalWrite(TRIGGER_PIN, HIGH);
  delayMicroseconds(10);
  digitalWrite(TRIGGER_PIN, LOW);
  long duration = pulseIn(ECHO_PIN, HIGH);
  data.distance = duration * 0.0343 / 2; // Calculate distance in cm

  data.lux = lightMeter.readLightLevel(); // Read light level in lux

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
  display.display();
  delay(500); // Short delay to ensure the display is updated

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
    flashRedLED(3); // Flash red LED 6 times for ThingSpeak update failure
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

void flashRedLED(int times) {
  for (int i = 0; i < times; i++) {
    digitalWrite(RED_LED_PIN, HIGH);
    delay(180);
    digitalWrite(RED_LED_PIN, LOW);
    delay(180);
  }
}

void setup() {
  Serial.begin(115200);
  pinMode(BUTTON_PIN, INPUT_PULLUP);
  pinMode(SOIL_MOISTURE_PIN, INPUT);
  pinMode(GREEN_LED_PIN, OUTPUT);
  pinMode(RED_LED_PIN, OUTPUT);
  pinMode(SENSOR_POWER_PIN, OUTPUT);
  pinMode(TRIGGER_PIN, OUTPUT);
  pinMode(ECHO_PIN, INPUT);

  // Turn on the green LED
  digitalWrite(GREEN_LED_PIN, HIGH);

  // Turn on the power to the sensors
  digitalWrite(SENSOR_POWER_PIN, HIGH);

  // Check if wakeup was caused by deep sleep
  esp_sleep_wakeup_cause_t wakeup_reason = esp_sleep_get_wakeup_cause();
  bool displayOn = false;
  if (wakeup_reason == ESP_SLEEP_WAKEUP_EXT0) {
    Serial.println("Woke up from deep sleep by button press");
    displayOn = true;
  } else if (wakeup_reason == ESP_SLEEP_WAKEUP_TIMER) {
    Serial.println("Woke up from deep sleep by timer");
  } else {
    Serial.println("Starting fresh");
    displayOn = true;
  }

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

  // Initialize ThingSpeak
  Serial.println("Initializing ThingSpeak...");
  ThingSpeak.begin(client);

  // Gather and display data
  SensorData data;
  gatherData(data);
  if (displayOn) {
    displayData(data);
  }
  
  // Post data to ThingSpeak
  postToThingSpeak(data);

  // Post data to Serial
  postToSerial(data);

  // Keep the display on for 5 seconds if it was turned on
  if (displayOn) {
    delay(DISPLAY_DURATION);
    // Turn off the display to save power
    display.ssd1306_command(SSD1306_DISPLAYOFF);
  }

  // Turn off the power to the sensors
  digitalWrite(SENSOR_POWER_PIN, LOW);

  // Turn off the green LED
  digitalWrite(GREEN_LED_PIN, LOW);

  // Go to deep sleep
  Serial.println("Going to deep sleep...");
  esp_sleep_enable_ext0_wakeup(GPIO_NUM_15, 0); // Wake up on button press (LOW)
  esp_sleep_enable_timer_wakeup(SLEEP_DURATION * 1000000); // Wake up after SLEEP_DURATION seconds
  esp_deep_sleep_start();
}

void loop() {
  // This will not be called
}
