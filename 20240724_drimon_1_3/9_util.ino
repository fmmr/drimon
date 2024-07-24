
void calibrate_soil() {
  int s1Max = 0;
  int s2Max = 0;
  int s3Max = 0;
  int s1Min = 5000;
  int s2Min = 5000;
  int s3Min = 5000;
  for (int i = 0; i < 1000; i++) {
    int s1 = min((int)analogRead(SOIL_1_PIN), 4094);
    int s2 = min((int)analogRead(SOIL_2_PIN), 4094);
    int s3 = min((int)analogRead(SOIL_3_PIN), 4094);
    s1Max = max(s1, s1Max);
    s2Max = max(s2, s2Max);
    s3Max = max(s3, s3Max);
    s1Min = min(s1, s1Min);
    s2Min = min(s2, s2Min);
    s3Min = min(s3, s3Min);

    int m1 = constrain(map(s1, 2704, 776, 0, 100), 0, 100);
    int m2 = constrain(map(s2, 2768, 994, 0, 100), 0, 100);
    int m3 = constrain(map(s2, 2600, 1009, 0, 100), 0, 100);

    Serial.print("soil1: ");
    Serial.print(s1);
    Serial.print("   ");
    Serial.print(s1Max);
    Serial.print("   ");
    Serial.print(s1Min);
    Serial.print("   ");
    Serial.println(m1);

    Serial.print("soil2: ");
    Serial.print(s2);
    Serial.print("   ");
    Serial.print(s2Max);
    Serial.print("   ");
    Serial.print(s2Min);
    Serial.print("   ");
    Serial.println(m2);

    Serial.print("soil3: ");
    Serial.print(s3);
    Serial.print("   ");
    Serial.print(s3Max);
    Serial.print("   ");
    Serial.print(s3Min);
    Serial.print("   ");
    Serial.println(m3);

    Serial.println(i);

    delay(400);
  }
}