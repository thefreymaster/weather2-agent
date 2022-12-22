import network
import time
import urequests
import ujson
from machine import Pin
from machine import RTC
from time import sleep
import ntptime
import dht

led = machine.Pin("LED", machine.Pin.OUT)
wlan = network.WLAN(network.STA_IF)

sensor = dht.DHT11(Pin(16)) 
deviceId = 'MovieTheaterTempSensor'

wlan.active(True)
wlan.connect('SKYNET-IOT', 'austintexas@512')

def convertToF(celsius): 
  return celsius * (9 / 5) + 32;

def runProgram():
    print('Attempting to collect temperature data...')
    try:
        led.on()
        sensor.measure()
        temperature = sensor.temperature()
        print('Current temp is: ', convertToF(temperature))
        temperature_post_data = ujson.dumps({ 'name': deviceId, 'value': temperature })
        r = urequests.post("http://192.168.1.118:6800/api/temperature", headers = {'content-type': 'application/json'}, data = temperature_post_data)
        r.close()
        print('Data posted successfully, sleeping for 60s...')
        led.off()
        sleep(60)
        runProgram()
    except BaseException as err:
        print('An error has occured while trying to post weather data... trying again in 60s...')
        led.off()
        print(err)
        sleep(60)
        runProgram()

max_wait = 100
while max_wait > 0:
    if wlan.status() < 0 or wlan.status() >= 3:
        break
    max_wait -= 1
    print('Waiting for WiFi connection...')
    time.sleep(2)

# Handle connection error
if wlan.status() != 3:
    raise RuntimeError('network connection failed')
else:
    try:
        print('WiFi connected!')
        status = wlan.ifconfig()
        print( 'ip = ' + status[0] )
        runProgram()
    except BaseException as err:
        print('An error has occured while trying to register new room... trying again...')
        print(err)
        sleep(1)


