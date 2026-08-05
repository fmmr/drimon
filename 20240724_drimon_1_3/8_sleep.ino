// Seconds until the next "round" wall-clock minute boundary — e.g. snappedSleep(10, ...) will target :00, :10, :20…
// If a boundary is <intervalSec/3 away we skip to the next one (avoids waking again in a few seconds).
// If wall-clock isn't available yet (cold boot before first NTP sync), returns fallbackSec.
int snappedSleep(int intervalMinutes, int fallbackSec) {
  struct tm t;
  if (!getLocalTime(&t, 0)) {
    Serial.printf("  Sleep: no wall-clock yet, falling back to %d s\n", fallbackSec);
    return fallbackSec;
  }
  int intervalSec = intervalMinutes * 60;
  int currentSec  = t.tm_min * 60 + t.tm_sec;
  int wait        = intervalSec - (currentSec % intervalSec);
  if (wait < intervalSec / 3) wait += intervalSec;
  Serial.printf("  Sleep: snapping to next %d-min boundary, wake in %d s (now :%02d:%02d)\n",
                intervalMinutes, wait, t.tm_min, t.tm_sec);
  return wait;
}

int getSleepDuration(float lux) {
  if (lux < NIGHT_LEVEL) return snappedSleep(15, SLEEP_DURATION_NIGHT);   // :00, :15, :30, :45
  if (lux < DUSK_LEVEL)  return snappedSleep(5,  SLEEP_DURATION_DUSK);    // :00, :05, :10, …
  return                        snappedSleep(10, SLEEP_DURATION_DAY);     // :00, :10, :20, …
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
