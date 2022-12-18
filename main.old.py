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
room = { 'bedroom': 'bedroom' }
roomName = 'bedroom'

wlan.active(True)
wlan.connect('SKYNET-IOT', 'austintexas@512')

def convertToF(celsius): 
  return celsius * (9 / 5) + 32;

def postError(errorObj):
    print(errorObj)
    post_data = ujson.dumps(errorObj)
    r = urequests.post("https://weather2-agent-default-rtdb.firebaseio.com/errors.json", headers = {'content-type': 'application/json'}, data = post_data)
    r.close()

def getUnixTime():
    try:
        r = urequests.get("https://timeapi.io/api/Time/current/zone?timeZone=America/New_York")
        nowObj = r.json()
        r.close()
        return nowObj['dateTime']
    except BaseException as err:
        print('An error occured while trying to get the current time... trying again in 10s...')
        postError(err)
        sleep(10)
        getUnixTime()

def postWeatherData():
    print('Attempting weather data post...')
    today = getUnixTime()
    try:
        led.on()
        sensor.measure()
        humidity = sensor.humidity()
        humidity_post_data = ujson.dumps({ 'x': today, 'y': humidity })
        if today:
            r = urequests.post("https://weather2-agent-default-rtdb.firebaseio.com/" + roomName + "/humidity.json", headers = {'content-type': 'application/json'}, data = humidity_post_data)
            r.close()
            temp = convertToF(sensor.temperature())
            temperature_post_data = ujson.dumps({ 'x': today, 'y': temp })
            r = urequests.post("https://weather2-agent-default-rtdb.firebaseio.com/" + roomName + "/temperature.json", headers = {'content-type': 'application/json'}, data = temperature_post_data)
            r.close()
            led.off()
            print('Weather data posted')
        sleep(300)
        postWeatherData()
    except BaseException as err:
        print('An error has occured while trying to post weather data... trying again in 300s...')
        postError(err)
        sleep(300)
        postWeatherData()
        
def registerNewRoom():
    led.on()
    print('WiFi connected!')
    status = wlan.ifconfig()
    print( 'ip = ' + status[0] )
    print('Attempting to register new room...')
    post_data = ujson.dumps(room)
    r = urequests.patch("https://weather2-agent-default-rtdb.firebaseio.com/rooms.json", headers = {'content-type': 'application/json'}, data = post_data)
    print('Registration complete.')
    r.close()
    postWeatherData()
    led.off()

max_wait = 10
while max_wait > 0:
    if wlan.status() < 0 or wlan.status() >= 3:
        break
    max_wait -= 1
    print('Waiting for WiFi connection...')
    time.sleep(1)

# Handle connection error
if wlan.status() != 3:
    raise RuntimeError('network connection failed')
else:
    try:
        registerNewRoom()
    except BaseException as err:
        print('An error has occured while trying to register new room... trying again...')
        postError(err)
        sleep(1)
        registerNewRoom()
