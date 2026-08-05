// Seconds until the next "round" wall-clock minute boundary — e.g. snappedSleep(10) will target :00, :10, :20…
// If a boundary is <intervalSec/3 away we skip to the next one (avoids waking again in a few seconds).
// If wall-clock isn't available yet (cold boot before first NTP sync), returns intervalMinutes*60 as fallback.
int snappedSleep(int intervalMinutes) {
  int intervalSec = intervalMinutes * 60;
  struct tm t;
  if (!getLocalTime(&t, 0)) {
    Serial.printf("  Sleep: no wall-clock yet, falling back to %d s\n", intervalSec);
    return intervalSec;
  }
  int currentSec = t.tm_min * 60 + t.tm_sec;
  int wait       = intervalSec - (currentSec % intervalSec);
  if (wait < intervalSec / 3) wait += intervalSec;
  wait += SNAP_BOUNDARY_BUFFER_SEC;   // land just past the boundary so posts don't clip under it in ThingSpeak's clock
  Serial.printf("  Sleep: snapping to next %d-min boundary +%d s buffer, wake in %d s (now :%02d:%02d)\n",
                intervalMinutes, SNAP_BOUNDARY_BUFFER_SEC, wait, t.tm_min, t.tm_sec);
  return wait;
}

// Off-season = outside 10 Apr – 10 Sep local Oslo time. When off-season, snap intervals and fallbacks are
// multiplied by SEASON_MULT_OFFSEASON to conserve battery when there's less sun on the solar panel.
// If wall-clock isn't available (very first cold-boot wake), assumes in-season (safe default).
bool isOffSeason(const struct tm *t) {
  int month = t->tm_mon + 1;    // tm_mon is 0-based
  int day   = t->tm_mday;
  if (month < SEASON_START_MONTH || month > SEASON_END_MONTH) return true;
  if (month == SEASON_START_MONTH && day < SEASON_START_DAY)  return true;
  if (month == SEASON_END_MONTH   && day > SEASON_END_DAY)    return true;
  return false;
}

int getSleepDuration(float lux) {
  struct tm t;
  int mult = 1;
  if (getLocalTime(&t, 0) && isOffSeason(&t)) {
    mult = SEASON_MULT_OFFSEASON;
    Serial.printf("  Sleep: off-season (mult %d) — snap/fallback multiplied\n", mult);
  }
  if (lux < NIGHT_LEVEL) return snappedSleep(SLEEP_INTERVAL_NIGHT_MIN * mult);   // in :00,:20,:40 / off (×3) :00 hourly
  if (lux < DUSK_LEVEL)  return snappedSleep(SLEEP_INTERVAL_DUSK_MIN  * mult);   // in :00,:05,:10… / off (×3) :00,:15,:30,:45
  return                        snappedSleep(SLEEP_INTERVAL_DAY_MIN   * mult);   // in :00,:10,:20… / off (×3) :00,:30
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
  // 1000000ULL forces the multiplication into uint64_t — plain int overflows at ~2147 s (35.7 min),
  // which the night snap and any off-season snap can exceed.
  esp_sleep_enable_timer_wakeup((uint64_t)sleepDuration * 1000000ULL);
  esp_deep_sleep_start();
}
