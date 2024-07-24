SensorData measure() {
  SensorData data;

  float total_bmeTemp = 0.0;
  float total_bmeHumidity = 0.0;
  float total_ahtTemp = 0.0;
  float total_ahtHumidity = 0.0;
  float total_bmePressure = 0.0;
  float total_lux = 0.0;

  for (int i = 0; i < NUM_READINGS; i++) {
    total_bmeTemp += bme.readTemperature();
    total_bmeHumidity += bme.readHumidity();
    total_bmePressure += (bme.readPressure() / 100.0F) + (12 * HEIGHT_ABOVE_SEE_LEVEL / 100.0);

    sensors_event_t ahtHumidity, ahtTemp;
    aht.getEvent(&ahtHumidity, &ahtTemp);
    total_ahtTemp += ahtTemp.temperature;
    total_ahtHumidity += ahtHumidity.relative_humidity;

    total_lux += lightMeter.readLightLevel();

    delay(SLEEP_BETWEEN_READINGS);  // Short delay between readings
  }

  data.bmeTemp = total_bmeTemp / NUM_READINGS;
  data.bmeHumidity = total_bmeHumidity / NUM_READINGS;
  data.ahtTemp = total_ahtTemp / NUM_READINGS;
  data.ahtHumidity = total_ahtHumidity / NUM_READINGS;
  data.bmePressure = total_bmePressure / NUM_READINGS;
  data.lux = total_lux / NUM_READINGS;


  data.temperature = (data.bmeTemp + data.ahtTemp) / 2.0;
  data.humidity = (data.bmeHumidity + data.ahtHumidity) / 2.0;

  data.status = "OK";
  return data;
}