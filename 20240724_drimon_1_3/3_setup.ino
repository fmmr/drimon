RTC_DATA_ATTR uint8_t cachedBSSID[6] = {0};
RTC_DATA_ATTR int32_t cachedChannel = 0;
RTC_DATA_ATTR uint16_t wifiFailStreak = 0;  // consecutive wakes where WiFi never associated; wiped by cold reset
RTC_DATA_ATTR uint16_t postFailStreak = 0;  // consecutive wakes where WiFi was OK but ALL 3 POSTs failed; wiped by cold reset
RTC_DATA_ATTR int lastPostResults[3] = {0, 0, 0};  // HTTP codes from previous wake's 3 channel POSTs
RTC_DATA_ATTR uint8_t postRetryCounts[3] = {0, 0, 0};  // per-channel EXTRA attempts used in previous wake (0 = no retry, up to MAX_POST_RETRY)

String g_wifiCacheStatus = "?";
long g_wifiConnectMs = 0;
String g_wifiBssid = "?";

void setupPins() {
  pinMode(BLUE_LED_PIN, OUTPUT);
  pinMode(BUTTON_PIN, INPUT_PULLUP);
  pinMode(BUZZER_PIN, OUTPUT);
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
  long wifiStart = millis();

  IPAddress local_IP(WIFI_STATIC_IP);
  IPAddress gateway(WIFI_GATEWAY);
  IPAddress subnet(WIFI_SUBNET);
  IPAddress dns(WIFI_DNS);
  WiFi.config(local_IP, gateway, subnet, dns);

  if (wifiFailStreak > WIFI_FAILS_BEFORE_FRESH_SCAN && cachedChannel > 0) {
    Serial.printf("  WiFi: fail streak = %u (> %d), forcing fresh scan\n",
                  wifiFailStreak, WIFI_FAILS_BEFORE_FRESH_SCAN);
    cachedChannel = 0;
  }

  int retries = 0;
  bool usingCache = (cachedChannel > 0);
  if (usingCache) {
    Serial.printf("  WiFi: RTC cache present (ch %d, BSSID %02x:%02x:%02x:%02x:%02x:%02x)\n",
                  cachedChannel,
                  cachedBSSID[0], cachedBSSID[1], cachedBSSID[2],
                  cachedBSSID[3], cachedBSSID[4], cachedBSSID[5]);
    WiFi.begin(WIFI_SSID, WIFI_PASSWORD, cachedChannel, cachedBSSID);
  } else {
    Serial.println("  WiFi: no RTC cache, doing full scan");
    WiFi.begin(WIFI_SSID, WIFI_PASSWORD);
  }
  Serial.print("  Initializing WiFi...");
  long deadline = millis() + WIFI_INITIAL_TIMEOUT_MS;
  while (WiFi.status() != WL_CONNECTED && millis() < deadline) {
    delay(WIFI_POLL_INTERVAL_MS);
  }

  while (WiFi.status() != WL_CONNECTED && retries < WIFI_MAX_RETRIES) {
    WiFi.disconnect();
    cachedChannel = 0;  // invalidate cache on failure, next attempt does full scan
    WiFi.begin(WIFI_SSID, WIFI_PASSWORD);
    delay(WIFI_RETRY_DELAY_MS);
    Serial.print(".");
    retries++;
  }
  Serial.println();

  if (WiFi.status() == WL_CONNECTED) {
    memcpy(cachedBSSID, WiFi.BSSID(), 6);
    cachedChannel = WiFi.channel();
    if (usingCache && retries == 0) {
      g_wifiCacheStatus = "HIT";
    } else if (usingCache) {
      g_wifiCacheStatus = "FBK";
    } else {
      g_wifiCacheStatus = "MISS";
    }
    char bs[13];
    snprintf(bs, sizeof(bs), "%02x%02x%02x%02x%02x%02x",
             cachedBSSID[0], cachedBSSID[1], cachedBSSID[2],
             cachedBSSID[3], cachedBSSID[4], cachedBSSID[5]);
    g_wifiBssid = bs;
    g_wifiConnectMs = millis() - wifiStart;
    Serial.print("    WiFi: OK (");
    Serial.print(g_wifiCacheStatus);
    Serial.print("), IP: ");
    Serial.print(WiFi.localIP());
    if (WiFi.localIP() == local_IP) {
      Serial.print(" (static OK)");
    } else {
      Serial.print(" (DHCP fallback!)");
    }
    Serial.print(", RSSI: ");
    Serial.println(WiFi.RSSI());
    Serial.printf("    WiFi connect took %ld ms\n", g_wifiConnectMs);
    dispPrint(WiFi.localIP().toString() + "   " + WiFi.RSSI());

    // Kick off NTP sync every wake — corrects the ~1-2% cumulative drift from the ESP32's internal 150 kHz RC
    // oscillator during deep sleep. Non-blocking (SNTP fires in background), ~144 bytes UDP, sub-second WiFi cost.
    // Every subsequent getLocalTime() sees the fresh, drift-corrected time.
    configTime(0, 0, "pool.ntp.org");
    setenv("TZ", "CET-1CEST,M3.5.0,M10.5.0/3", 1);   // Oslo local time for pretty serial prints; snap doesn't need TZ
    tzset();

    // Serial-visible wall-clock diagnostic. Waits up to 2 s for SNTP to actually respond so the print reflects
    // the corrected time — no-op on subsequent wakes since RTC already has a valid year.
    struct tm t;
    if (getLocalTime(&t, 2000)) {
      Serial.printf("    Wall clock: %04d-%02d-%02d %02d:%02d:%02d (Oslo)\n",
                    t.tm_year + 1900, t.tm_mon + 1, t.tm_mday,
                    t.tm_hour, t.tm_min, t.tm_sec);
    } else {
      Serial.println("    Wall clock: SNTP did not respond within 2 s — snap will use last-known time");
    }

  } else {
    g_wifiCacheStatus = "FAIL";
    g_wifiConnectMs = millis() - wifiStart;
    if (wifiFailStreak != UINT16_MAX) wifiFailStreak++;
    Serial.printf("    WiFi: FAILED (streak now %u)\n", wifiFailStreak);
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
    lcd.noBacklight();
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

  if (!lightMeter.begin(BH1750::CONTINUOUS_HIGH_RES_MODE, 0x5C)) {
    Serial.println("    lightMeter: Failed");
    dispPrint("lightMeter: FAIL");
  } else {
    Serial.println("    lightMeter: OK");
  }

  if (!lightMeter_int.begin(BH1750::CONTINUOUS_HIGH_RES_MODE, 0x23)) {
    Serial.println("    lightMeter_int: Failed");
    dispPrint("lightMeter_int: FAIL");
  } else {
    Serial.println("    lightMeter_int: OK");
  }

  if (!aht.begin()) {
    Serial.println("    AHT: Failed");
    dispPrint("AHT: FAIL");
  } else {
    Serial.println("    AHT: OK");
  }

  bool gaugeOk = (batteryMonitor.begin() == 0);
  int retriesGauge = 0;
  while (!gaugeOk && retriesGauge < 5) {
    delay(30);
    retriesGauge++;
    gaugeOk = (batteryMonitor.begin() == 0);
  }
  if (!gaugeOk) {
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
    String msg = "SOIL 1: OK (";
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