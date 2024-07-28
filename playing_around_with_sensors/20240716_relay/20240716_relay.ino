/*********
  Rui Santos
  Complete project details at https://RandomNerdTutorials.com/esp32-relay-module-ac-web-server/
  
  The above copyright notice and this permission notice shall be included in all
  copies or substantial portions of the Software.
*********/

const int relay1 = 12;
const int relay2 = 13;
const int relay3 = 14;

void setup() {
  Serial.begin(115200);
  pinMode(relay1, OUTPUT);
  pinMode(relay2, OUTPUT);
  pinMode(relay3, OUTPUT);
  digitalWrite(relay1, LOW);
  digitalWrite(relay2, LOW);
  digitalWrite(relay3, LOW);

}

void open(){
    Serial.println("open ");

    digitalWrite(relay1, HIGH);
    digitalWrite(relay2, HIGH);
    delay(250);
    digitalWrite(relay1, LOW);
    digitalWrite(relay2, LOW);
}
void close(){
    Serial.println("close ");
    digitalWrite(relay3, HIGH);
    delay(100);
    digitalWrite(relay3, LOW);
}

void loop() {
  open();
  delay(5000);
  close();
  delay(5000);
}