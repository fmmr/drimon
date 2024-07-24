
void displaySerial(SensorData& data) {
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
  Serial.print("    Volt:         ");
  Serial.println(data.batteryVoltage);
  Serial.print("    Bat %:        ");
  Serial.println(data.batteryPercentage);
  Serial.print("    Bat %         ");
  Serial.println(data.batteryPercentageInt);
  Serial.print("    RSSI          ");
  Serial.println(data.rssi);
  Serial.print("    Status:       ");
  Serial.println(data.status);
  Serial.print("    Time:         ");
  Serial.println(data.timeUsed);
}
void displayOled(SensorData& data) {
  Serial.println("  Displaying on OLED");
}
void displayLCD(SensorData& data) {
  lcd.clear();
  lcd.backlight();
  lcd.home();

  lcd.print("p:");
  lcd.print(data.pressureInt);
  lcd.print("  l:");
  lcd.print(data.luxInt);
  lcd.setCursor(0, 1);
  lcd.print("b:");
  lcd.print(data.batteryPercentageInt);
  lcd.print(" t:");
  lcd.print(data.temperature,1);
  lcd.print("/");
  lcd.print(data.humidity,1);
}

void displayData(SensorData& data) {
  displaySerial(data);
  displayOled(data);
  displayLCD(data);
}