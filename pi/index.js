var AWS = require("aws-sdk");
var awsIot = require('aws-iot-device-sdk');
// var gpio = require('rpi-gpio');
var Gpio = require('pigpio').Gpio;
var GpioLED = require('onoff').Gpio;
var LED = new GpioLED(4, 'out');

// SetupGPIO();

const doorLock = new Gpio(17, {mode:Gpio.OUTPUT});

function turnOffLock() {
  doorLock.servoWrite(2500); //Most clockwise
  setTimeout(function() {
    doorLock.servoWrite(500);
  }, 2000);
}

function turnOnLock() {
  doorLock.servoWrite(500); //Most clockwise
  setTimeout(function() {
    doorLock.servoWrite(2500);
  }, 2000);
}

function turnOnLight() {
	LED.writeSync(1);
}

function turnOffLight() {
	LED.writeSync(0);
}

LED.writeSync(0);

console.log('hahaha');
AWS.config.loadFromPath("./config.json");

const config = {
  bucketName: 'facerecogdata2',
  //dirName: 'media', /* optional */
  region: 'us-east-2',
  accessKeyId: 'AKIA2FBSYGBOR6A3TQGL',
  secretAccessKey: 'myA5ldaLfSkcCwYKF6DiG4q5nG4lMkXmJCoyRKSp',
  // s3Url: 'https:/your-custom-s3-url.com/', /* optional */
}

//AWS.config.update({accessKeyId: config.accessKeyId, secretAccessKey: config.secretAccessKey, region: config.region});

var thingName = "sdk-nodejs-6ff54d8d-5eec-4fc3-ae1a-86f19b20897c"; 
var keypath = "./certs/RPI3JS.private.key"; 
var certPath = "./certs/RPI3JS.cert.pem"; 
var caPath = "./certs/root-CA.crt";
var clientId = thingName;
var region = "us-east-2";
var host = "a6c5tbrr0zx9e-ats.iot.us-east-2.amazonaws.com"; 

var connectionParamaters = {
    keyPath: keypath,
    certPath: certPath,
    caPath: caPath,
    clientId: clientId,
    region: region,
    host: host
  };
  
  //Add your certificates and region details in the file system
  var device = awsIot.device(connectionParamaters);
  
  //Initializing Shadow State
  var requestedState = {
    "state": {
          "reported": {
            "device": "Lamp",
            "state": "Off",
          }
        }
  }

console.log("hahahahaha");
 //Connecting and subscribing to Shadow Topics
device
.on('connect', function() {
  console.log('Connected to AWS IoT' );
  console.log(JSON.stringify(device));
  device.subscribe('$aws/things/' + thingName + '/shadow/#');
  device.subscribe('$aws/things/' + thingName + '/#');
  device.subscribe('localstatus');
  device.publish('localstatus', 'Pi connected!');
  device.publish('$aws/things/' + thingName + '/shadow/update', JSON.stringify(requestedState));
  });

    //Listening for updates
device
.on('message', function(topic, payload) {
  console.log('message', topic, payload.toString(),'\n');
  //In case there's an IoT Remote app controlling and it sent a msg to 'localstatus', let it know it is alive
  if (topic == "localstatus" && payload.toString() == "Pi connected!"){
    device.publish('localstatus', 'Pi says hello to '  + thingName +  '!');
  }
  if (topic == "$aws/things/" + thingName + "/shadow/update/accepted"){
    requestedState = JSON.parse(payload.toString());
    console.log('Waiting for command from the mothership <Endpoint>.iot.<region>.amazonaws.com\n')
    handleRequest(requestedState);
  }
});

//Receiving commands
function handleRequest(requestedState){
  console.log ("Passing on Request to Pi: " + JSON.stringify(requestedState));

  //
  // Control a Lamp
  //
  if(requestedState.state.reported.device == "Lamp")
  {
    if (requestedState.state.reported.state == 'On')
    {
      // gpio.write(37, true, function(err) {
      //   if (err) throw err;
      //   console.log('Written to pin');
      // });

      // gpio.write(32, false, function(err) {
      //   if (err) throw err;
      //   console.log('Written to pin');
      // });
	turnOnLight();
      console.log('Turning the Light on\n');
    } 
    else
    {
      // gpio.write(37, false, function(err) {
      //   if (err) throw err;
      //   console.log('Written to pin');
      // });

      // gpio.write(32, true, function(err) {
      //   if (err) throw err;
      //   console.log('Written to pin');
      // });

	turnOffLight()
      console.log('Turning the Light off\n');
    }
      
  };

  //
  // Control a Fan
  //
  if(requestedState.state.reported.device == "Fan")
  {
    if (requestedState.state.reported.state == 'On')
    {
      // gpio.write(36, false, function(err) {
      //   if (err) throw err;
      //   console.log('Written to pin');
      // });

      console.log('Turning the Fan off\n');
    } 
    else
    {
      // gpio.write(36, true, function(err) {
      //   if (err) throw err;
      //   console.log('Written to pin');
      // });

      console.log('Turning the Fan on\n');
    }
      
  };

  //
  // Control a Lock
  //
  if(requestedState.state.reported.device == "Lock")
  {
    if (requestedState.state.reported.state == 'On')
    {
      turnOnLock();
      console.log('Turning the Lock on\n');
    } 
    else
    {
      turnOffLock();
      console.log('Turning the Lock off\n');
    }
      
  };
  
}

// function SetupGPIO()
// {
//   gpio.setup(37, gpio.DIR_OUT, function() {
    
//   }); 
  
//   gpio.setup(32, gpio.DIR_HIGH, function() {
    
//   }); 

//   gpio.setup(36, gpio.DIR_HIGH, function() {
    
//   }); 

//   gpio.setup(17, gpio.DIR_HIGH, function() {
    
//   }); 

//   gpio.setup(40, gpio.DIR_HIGH, function() {
    
//   }); 
  
// }
