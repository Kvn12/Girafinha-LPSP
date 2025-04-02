#include <AccelStepper.h>
#include <Servo.h>
#include <math.h>

#define limitSwitch1 11
#define limitSwitch2 10
#define limitSwitch3 9
#define limitSwitch4 A3
#define releModule A2

// Define the stepper motors and the pins the will use
AccelStepper stepper1(1, 2, 5); // (Type:driver, STEP, DIR)
AccelStepper stepper2(1, 3, 6);
AccelStepper stepper3(1, 4, 7);
AccelStepper stepper4(1, 12, 13);

Servo gripperServo;  // create servo object to control a servo

// L1 = 228mm 
// L2 = 136.5mm

int stepper1Position, stepper2Position, stepper3Position, stepper4Position;

const int max_j1 = 30700;
const int max_j2 = 23050;
const int max_j3 = 6850;
const int max_z = 30000;
const int max_gripper = 110;

const float safety_value = 0.95;

String content = "";
int data[8];

int alreadyHomed = 0;

void setup() {
  Serial.begin(115200);

  pinMode(limitSwitch1, INPUT_PULLUP);
  pinMode(limitSwitch2, INPUT_PULLUP);
  pinMode(limitSwitch3, INPUT_PULLUP);
  pinMode(limitSwitch4, INPUT_PULLUP);
  pinMode(releModule, OUTPUT);

  // Stepper motors max speed
  stepper1.setMaxSpeed(4000);
  stepper1.setAcceleration(2000);
  stepper2.setMaxSpeed(4000);
  stepper2.setAcceleration(2000);
  stepper3.setMaxSpeed(4000);
  stepper3.setAcceleration(2000);
  stepper4.setMaxSpeed(4000);
  stepper4.setAcceleration(2000);

  gripperServo.attach(A1, 600, 2600);
  // Giving first values to data
  data[0] = 4000;  //Speed
  data[1] = 2000;  //Aceleration
  data[2] = 0;     //J1
  data[3] = 0;     //J2
  data[4] = 0;     //J3
  data[5] = 100;   //Z
  data[6] = 50;    //Gripper
  data[7] = 1;     //Rele
 
  // Start with motors off
  digitalWrite(releModule, 1);
}

void loop() {  
  if (Serial.available()) {
    content = Serial.readString(); // Read the incomding data from Processing
    // Extract the data from the string and put into separate integer variables (data[] array)
    for (int i = 0; i < 8; i++) {
      int index = content.indexOf(","); // locate the first ","
      data[i] = atol(content.substring(0, index).c_str()); //Extract the number from start to the ","
      content = content.substring(index + 1); //Remove the number from the string
    }

    Serial.println("20"); // To inform that data has been received

    if(data[0] == 0){ // To change the rele state only
      digitalWrite(releModule, data[7]);
      if (data[7] == 0){
        if (alreadyHomed == 0){
          Serial.println("10"); // To inform that is homing 
          homing();
          alreadyHomed = 1;
          Serial.println("11"); // To inform that has homed
        }
        else {
          Serial.println("30"); // To inform that is already on and is going to pos 0.
        }        
      }
      else {
        alreadyHomed = 0;
      }
    }
    else if (data[1] == 0){
      Serial.println("10"); // To inform that is homing 
      homing();
      alreadyHomed = 1;
      Serial.println("11"); // To inform that has homed
    }
    else{
      if(alreadyHomed == 0){
        Serial.println("10"); // To inform that is homing 
        homing();
        alreadyHomed = 1;
        Serial.println("11"); // To inform that has already homed
      }
    }
    delay(50);

    stepper1Position = (int)(float(data[2])/ 100 * max_j1 * safety_value);
    stepper2Position = (int)(float(data[3])/ 100 * max_j2 * safety_value);
    stepper3Position = (int)(float(data[4])/ 100 * max_j3 * safety_value);
    stepper4Position = (int)(float(data[5])/ 100 * max_z * safety_value);

    delay(50);
    
    stepper1.setSpeed(data[0]);
    stepper2.setSpeed(data[0]);
    stepper3.setSpeed(data[0]);
    stepper4.setSpeed(data[0]);
    
    stepper1.setAcceleration(data[1]);
    stepper2.setAcceleration(data[1]);
    stepper3.setAcceleration(data[1]);
    stepper4.setAcceleration(data[1]);
    
    stepper1.moveTo(stepper1Position);
    stepper2.moveTo(stepper2Position);
    stepper3.moveTo(stepper3Position);
    stepper4.moveTo(stepper4Position);
    
    while (stepper1.currentPosition() != stepper1Position || stepper2.currentPosition() != stepper2Position || stepper3.currentPosition() != stepper3Position || stepper4.currentPosition() != stepper4Position) {
      stepper1.run();
      stepper2.run();
      stepper3.run();
      stepper4.run();
    }

    delay(50);

    gripperServo.write((int)(float(data[6])/100 * max_gripper));

    Serial.println("21");

    delay(100);
    /*
    data[0] - Speed value
    data[1] - Acceleration value
    data[2] - Joint 1 angle
    data[3] - Joint 2 angle
    data[4] - Joint 3 angle
    data[5] - Z position
    data[6] - Gripper value
    data[7] - Rele State
    */
  }
}

void homing() {
  // Homing Stepper4  Posição Z
  while (digitalRead(limitSwitch4) != 1) {
    stepper4.setSpeed(1500);
    stepper4.runSpeed();
    stepper4.setCurrentPosition(max_z); // When limit switch pressed set position to 0 steps
  }
  delay(20);
  int zero_z = max_z * safety_value;
  stepper4.moveTo(zero_z);
  while (stepper4.currentPosition() != zero_z) {
    stepper4.run();
  }
  
  // Homing Stepper3  Posição J3
  while (digitalRead(limitSwitch3) != 1) {
    stepper3.setSpeed(-1100);
    stepper3.runSpeed();
    stepper3.setCurrentPosition(-max_j3); // When limit switch pressed set position to 0 steps
  }
  delay(20);
  int zero_j3 = data[4];
  stepper3.moveTo(zero_j3);
  while (stepper3.currentPosition() != zero_j3) {
    stepper3.run();
    }
  
  // Homing Stepper2  Posição J2
  while (digitalRead(limitSwitch2) != 1) {
    stepper2.setSpeed(-2200);
    stepper2.runSpeed();
    stepper2.setCurrentPosition(-max_j2); // When limit switch pressed set position to -5440 steps
  }
  delay(20);
  int zero_j2 = data[3];
  stepper2.moveTo(zero_j2);
  while (stepper2.currentPosition() != zero_j2) {
    stepper2.run();
  }

  // Homing Stepper1  Posição J1
  while (digitalRead(limitSwitch1) != 1) {
    stepper1.setSpeed(-2000);
    stepper1.runSpeed();
    stepper1.setCurrentPosition(-max_j1); // When limit switch pressed set position to 0 steps
  }
  delay(20);
  int zero_j1 = data[2];
  stepper1.moveTo(zero_j1);
  while (stepper1.currentPosition() != zero_j1) {
    stepper1.run();
  }
  
  // Testing Gripper
  for(int i=0;i<5;i++){
    gripperServo.write(0);  
    delay(500);
    gripperServo.write(110); 
    delay(500);
  }
}