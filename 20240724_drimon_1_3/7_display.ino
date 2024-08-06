
void displaySerial(SensorData& data) {
  Serial.print("    Distance:     ");
  Serial.println(data.distance);
  Serial.print("    BME Temp:     ");
  Serial.println(data.bmeTemp);
  Serial.print("    AHT Temp:     ");
  Serial.println(data.ahtTemp);
  Serial.print("    Temp:         ");
  Serial.println(data.temperature);
  Serial.print("    BME Humidity: ");
  Serial.println(data.bmeHumidity);
  Serial.print("    AHT Humidity: ");
  Serial.println(data.ahtHumidity);
  Serial.print("    Humidity:     ");
  Serial.println(data.humidity);
  Serial.print("    BME Pressure: ");
  Serial.println(data.pressure);
  Serial.print("    LUX:          ");
  Serial.println(data.lux);
  Serial.print("    LUX (INT):    ");
  Serial.println(data.lux_int);
  Serial.print("    Volt:         ");
  Serial.println(data.batteryVoltage);
  Serial.print("    Bat %:        ");
  Serial.println(data.batteryPercentage);
  Serial.print("    Bat %:        ");
  Serial.println(data.batteryPercentageInt);
  Serial.print("    RSSI:         ");
  Serial.println(data.rssi);
  Serial.print("    Soil 1:       ");
  Serial.println(data.soil1);
  Serial.print("    Soil 2:       ");
  Serial.println(data.soil2);
  Serial.print("    Soil 3:       ");
  Serial.println(data.soil3);
  Serial.print("    Termo 1:      ");
  Serial.println(data.termo1);
  Serial.print("    Termo 2:      ");
  Serial.println(data.termo2);
  Serial.print("    Termo 3:      ");
  Serial.println(data.termo3);
  Serial.print("    Status:       ");
  Serial.println(data.status);
  Serial.print("    Time:         ");
  Serial.println(data.timeUsed);
}
void displayOled(SensorData& data) {
  display.clearDisplay();
  display.setTextSize(1);
  display.setTextColor(SSD1306_WHITE, SSD1306_BLACK);
  display.setCursor(0, 0);
  display.print("DriMon - FmR - 2024");

  display.setCursor(0, 11);
  display.print(data.temperature, 1);
  display.print(" ");
  display.print(data.bmeTemp, 1);
  display.print(" ");
  display.print(data.ahtTemp, 1);
  display.print(" ");
  display.print(data.termo2, 1);

  display.setCursor(0, 20);
  display.print("Hum: ");
  display.print(data.humidity, 1);
  display.print(" ");
  display.print(data.bmeHumidity, 1);
  display.print(" ");
  display.print(data.ahtHumidity, 1);

  display.setCursor(0, 29);
  display.print("Bat: ");
  display.print(data.batteryVoltage, 1);
  display.print("v ");
  display.print(data.batteryPercentageInt);
  display.print("% WiF:");
  display.print(data.rssi);

  display.setCursor(0, 38);
  display.print("dst: ");
  display.print(data.distance);
  display.print("mm ");
  display.print(" tu: ");
  display.print(data.timeUsed);
  display.print("ms");

  display.setCursor(0, 47);
  display.print("Soil M: ");
  display.print(data.soil1);
  display.print("% ");
  display.print(data.soil2);
  display.print("% ");
  display.print(data.soil3);
  display.print("%");

  display.setCursor(0, 56);
  display.print("Soil T: ");
  display.print(data.termo1, 1);
  display.print(" ");
  display.print(data.termo2, 1);

  display.display();
}

void displayLCD(SensorData& data) {
  lcd.clear();
  lcd.backlight();
  lcd.home();

  lcd.print("t:");
  lcd.print(data.temperature, 1);
  lcd.print(" b:");
  lcd.print(data.batteryPercentageInt);
  lcd.print(" h:");
  lcd.print(data.humidity, 0);

  lcd.setCursor(0, 1);
  lcd.print("p:");
  lcd.print(data.pressureInt);
  lcd.print("  l:");
  lcd.print(data.luxInt);
}

void displayData(SensorData& data) {
  displaySerial(data);
  if (DISPLAY_ON) {
    displayOled(data);
    displayLCD(data);
  }
}