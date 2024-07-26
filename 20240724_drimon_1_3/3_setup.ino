void setupPins() {
  pinMode(BLUE_LED_PIN, OUTPUT);
  pinMode(BUTTON_PIN, INPUT_PULLUP);
  pinMode(BUZZZER_PIN, OUTPUT);
  pinMode(GREEN_LED_PIN, OUTPUT);
  pinMode(POST_SWITCH_PIN, INPUT_PULLUP);
  pinMode(RED_LED_PIN, OUTPUT);
  pinMode(SENSOR_POWER_PIN, OUTPUT);
  pinMode(SOIL_1_PIN, ANALOG);
  pinMode(SOIL_2_PIN, ANALOG);
  pinMode(SOIL_3_PIN, ANALOG);
  delay(1200);

  // flashLED(GREEN_LED_PIN, 1);
  // delay(200);
  // flashLED(GREEN_LED_PIN, 2);
  digitalWrite(SENSOR_POWER_PIN, HIGH);
  // flashLED(BLUE_LED_PIN, 3);
  // delay(500);
}

void connectToWiFi() {
  int retries = 0;
  WiFi.begin(WIFI_SSID, WIFI_PASSWORD);
  Serial.print("  Initializing WiFi...");

  while (WiFi.status() != WL_CONNECTED && retries < WIFI_MAX_RETRIES) {
    delay(400);
    Serial.print(".");
    retries++;
  }
  Serial.println();

  if (WiFi.status() == WL_CONNECTED) {
    Serial.print("    WiFi: OK");
    Serial.print(", IP: ");
    Serial.print(WiFi.localIP());
    Serial.print(", RSSI: ");
    Serial.println(WiFi.RSSI());
    dispPrint(WiFi.localIP().toString() + "   " + WiFi.RSSI());

  } else {
    Serial.println("    WiFi: FAILED");
    flashLED(RED_LED_PIN, FLASH_WIFI_CONNECT_FAILURE);
    dispPrint("WiFi FAILED - " + WiFi.RSSI());
  }
  Serial.println("  Wifi Initialized");
}

void initDisplays() {
  Serial.println("  Initializing displays...");
  if (DISPLAY_ON) {
    Serial.println("  Will output stuff on displays");
    if (!display.begin(SSD1306_SWITCHCAPVCC, 0x3C)) {
      Serial.println("SSD1306 allocation failed");
      dispPrint("    D init fail");
      flashLED(RED_LED_PIN, FLASH_DISPLAY_INIT_FAILURE);
    } else {
      display.clearDisplay();
      display.setTextSize(1);
      display.setTextColor(SSD1306_WHITE, SSD1306_BLACK);
      dispPrint("DriMon - FmR - 2024");
      Serial.println("    SSD1306 Initialized");
    }

    lcd.begin(false);
    lcd.clear();
    lcd.backlight();
    lcd.home();
    lcd.print("DriMon FmR 2024");
    Serial.println("    LCD Initialized");
  } else {
    Serial.println("  Will NOT output stuff on displays");
    lcd.begin(false);
    lcd.noDisplay();
    // lcd.noBacklight();
  }
  Serial.println("  Displays Initialized");
}


void initSensors() {
  Serial.println("  Initializing sensors...");
  if (!tof.begin()) {
    Serial.println("    VL53L0X (tof): Failed");
    dispPrint("VL53L0X (tof): FAIL");
  } else {
    TOF_OK = true;
    Serial.println("    VL53L0X (tof): OK");
  }

  if (!bme.begin(0x76)) {
    Serial.println("    BME280: Failed");
    dispPrint("BME280: FAIL");
  } else {
    Serial.println("    BME280: OK");
  }

  if (!lightMeter.begin()) {
    Serial.println("    lightMeter: Failed");
    dispPrint("lightMeter: FAIL");
  } else {
    Serial.println("    lightMeter: OK");
  }

  if (!aht.begin()) {
    Serial.println("    AHT: Failed");
    dispPrint("AHT: FAIL");
  } else {
    Serial.println("    AHT: OK");
  }

  int retriesGauge = 0;

  while (batteryMonitor.begin() != 0 && retriesGauge < 5) {
    delay(30);
    retriesGauge++;
  }
  if (batteryMonitor.begin() != 0) {
    Serial.println("    GAUGE: Failed");
    dispPrint("GAUGE: FAIL");
  } else {
    Serial.println("    GAUGE: OK");
  }

  // test soil moisture sensors
  int soilTemp = analogRead(SOIL_1_PIN);
  if (soilTemp == 4095 || soilTemp == 0) {
    Serial.println("    SOIL1: Failed");
    String msg = "SOIL 1: FAIL (";
    msg = msg + soilTemp;
    msg = msg + ")";
    dispPrint(msg);
  } else {
    String msg = "SOIL 2: OK (";
    msg = msg + soilTemp;
    msg = msg + ")";
    Serial.print("    ");
    Serial.println(msg);
  }
  soilTemp = analogRead(SOIL_2_PIN);
  if (soilTemp == 4095 || soilTemp == 0) {
    Serial.println("    SOIL2: Failed");
    String msg = "SOIL 2: FAIL (";
    msg = msg + soilTemp;
    msg = msg + ")";
    dispPrint(msg);
  } else {
    String msg = "SOIL 2: OK (";
    msg = msg + soilTemp;
    msg = msg + ")";
    Serial.print("    ");
    Serial.println(msg);
  }
  soilTemp = analogRead(SOIL_3_PIN);
  if (soilTemp == 4095 || soilTemp == 0) {
    Serial.println("    SOIL3: Failed");
    String msg = "SOIL 3: FAIL (";
    msg = msg + soilTemp;
    msg = msg + ")";
    dispPrint(msg);
  } else {
    String msg = "SOIL 3: OK (";
    msg = msg + soilTemp;
    msg = msg + ")";
    Serial.print("    ");
    Serial.println(msg);
  }

  sensors.begin();
  String msg = "Found ";
  msg = msg + sensors.getDeviceCount();
  msg = msg + " 1-Wire dev";
  Serial.print("    ");
  Serial.println(msg);
  sensors.setResolution(termo1, 10);
  sensors.setResolution(termo2, 10);
  sensors.setResolution(termo3, 10);

  dispPrint(msg);
  Serial.println("  Sensors Initialized");
}