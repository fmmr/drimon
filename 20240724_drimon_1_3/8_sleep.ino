#define NIGHT_LEVEL 2
#define DUSK_LEVEL 700
#define SHADE_LEVEL 6000

#define SLEEP_DURATION_DUSK 300
#define SLEEP_DURATION_DAY 300
#define SLEEP_DURATION_NIGHT 500

int getSleepDuration(float lux) {
  return 10;
  if (lux < NIGHT_LEVEL) {
    return SLEEP_DURATION_NIGHT;
  } else if (lux < DUSK_LEVEL) {
    return SLEEP_DURATION_DUSK;
  } else {
    return SLEEP_DURATION_DAY;
  }
}

void enterDeepSleep(int sleepDuration) {
  // Turn off the power to the sensors
  digitalWrite(SENSOR_POWER_PIN, LOW);

  // Turn off all LEDs
  digitalWrite(GREEN_LED_PIN, LOW);
  digitalWrite(RED_LED_PIN, LOW);
  digitalWrite(BLUE_LED_PIN, LOW);

  if (DISPLAY_ON){
    lcd.clear();
    display.clearDisplay();
  }

  esp_sleep_enable_ext0_wakeup(GPIO_NUM_15, 0);

  Serial.print("Going to deep sleep for ");
  Serial.print(sleepDuration);
  Serial.println(" seconds...");
  esp_sleep_enable_timer_wakeup(sleepDuration * 1000000);
  esp_deep_sleep_start();
}
