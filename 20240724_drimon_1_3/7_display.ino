
void displaySerial(SensorData& data) {
  Serial.print("  BME Temp:     ");
  Serial.println(data.bmeTemp);
  Serial.print("  AHT Temp:     ");
  Serial.println(data.ahtTemp);
  Serial.print("  Temp:         ");
  Serial.println(data.temperature);
  Serial.print("  BME Humidity: ");
  Serial.println(data.bmeHumidity);
  Serial.print("  AHT Humidity: ");
  Serial.println(data.ahtHumidity);
  Serial.print("  Humidity:     ");
  Serial.println(data.humidity);
  Serial.print("  BME Pressure: ");
  Serial.println(data.bmePressure);
  Serial.print("  LUX :         ");
  Serial.println(data.lux);
  Serial.print("  Status:       ");
  Serial.println(data.status);
}
void displayOled(SensorData& data) {
  Serial.println("  Displaying on OLED");
}
void displayLCD(SensorData& data) {
  Serial.println("  Displaying on LCD");
}

void displayData(SensorData& data) {
  displaySerial(data);
  displayOled(data);
  displayLCD(data);
}