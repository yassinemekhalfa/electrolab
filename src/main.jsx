import React, { createContext, useContext, useEffect, useMemo, useRef, useState } from 'react'
import { createRoot } from 'react-dom/client'
import {
  Activity, AlarmClock, Ampersand, ArrowLeft, BatteryCharging, Bell,
  BookOpen, Boxes, Cable, Calculator, CircuitBoard, ClipboardCheck, Cpu,
  Gauge, Grid3X3, Home, Info, Lightbulb, Menu, Minus, MonitorCog,
  MousePointer2, Play, Plus, Power, RotateCcw, Save, Search, Settings,
  ShieldCheck, SlidersHorizontal, Sparkles, Square, Trash2, Undo2, Redo2,
  Wrench, Zap, ZoomIn, ZoomOut, X, Move, PlugZap, Radio, Fan, GaugeCircle,
  Thermometer, Waves, TriangleAlert, ToggleLeft, Timer, CircleDot, ChevronDown,
  LayoutDashboard, Library, HelpCircle, GraduationCap, PanelLeftClose,
  PanelLeftOpen, GitBranch, Ruler, TestTube2, RotateCw, Copy
} from 'lucide-react'
import './style.css'
import { ElectricalSymbol, getTerminals, terminalPosition } from './electricalSymbols.jsx'
import { defaultParameters, getParameterFields } from './electricalModel.js'
import { simulateCircuit, defaultState, meterDisplay } from './simulationEngine.js'
import { tr, categoryName, partName, stateName, fieldName, starterText } from './i18n.js'

const CATEGORIES = [
  'Power & Sources', 'Protection', 'Switching & Control', 'Motors & Drives',
  'Loads & Lighting', 'Measurement', 'Sensors', 'Industrial Automation',
  'Transformers & Conversion', 'Electronics', 'Residential', 'Grounding & Wiring'
]

const PARTS = [
  // Power & Sources
  ['dc-source','DC Voltage Source','Power & Sources','VDC','12 V','voltage'],
  ['ac-source','AC Voltage Source','Power & Sources','VAC','230 V / 50 Hz','voltage'],
  ['battery','Battery','Power & Sources','BAT','12 V','voltage'],
  ['three-phase','3-Phase Supply','Power & Sources','3Φ','400 V','voltage'],
  ['generator','Generator','Power & Sources','GEN','230 V','voltage'],
  ['solar','Solar Panel','Power & Sources','PV','36 V','voltage'],
  ['ups','UPS','Power & Sources','UPS','230 V','voltage'],
  ['dc-bus','DC Bus','Power & Sources','BUS','24 V','voltage'],
  // Protection
  ['fuse','Fuse','Protection','F','10 A','protection'],
  ['mcb','Miniature Circuit Breaker','Protection','MCB','C16','protection'],
  ['mccb','Molded Case Circuit Breaker','Protection','MCCB','100 A','protection'],
  ['rcd','Residual Current Device','Protection','RCD','30 mA','protection'],
  ['rcbo','RCBO','Protection','RCBO','16 A / 30 mA','protection'],
  ['spd','Surge Protection Device','Protection','SPD','Type 2','protection'],
  ['thermal-relay','Thermal Overload Relay','Protection','OL','4–6 A','protection'],
  ['motor-protector','Motor Protection Breaker','Protection','MPCB','6.3 A','protection'],
  ['isolator','Isolator / Disconnect','Protection','ISO','32 A','protection'],
  // Switching & Control
  ['switch-spst','SPST Switch','Switching & Control','S','NO','switch'],
  ['switch-spdt','SPDT Switch','Switching & Control','S','SPDT','switch'],
  ['push-no','Push Button NO','Switching & Control','PB','NO','switch'],
  ['push-nc','Push Button NC','Switching & Control','PB','NC','switch'],
  ['emergency-stop','Emergency Stop','Switching & Control','E-STOP','NC','switch'],
  ['selector','Selector Switch','Switching & Control','SEL','0-1-2','switch'],
  ['contactor','Contactor','Switching & Control','KM','24 V coil','switch'],
  ['control-relay','Control Relay','Switching & Control','KA','24 V coil','switch'],
  ['timer-relay','Timer Relay','Switching & Control','KT','0–10 s','switch'],
  ['latching-relay','Latching Relay','Switching & Control','K','SET/RESET','switch'],
  ['solid-state-relay','Solid State Relay','Switching & Control','SSR','25 A','switch'],
  ['float-switch','Float Switch','Switching & Control','FS','NO/NC','switch'],
  ['pressure-switch','Pressure Switch','Switching & Control','PS','0–10 bar','switch'],
  ['limit-switch','Limit Switch','Switching & Control','LS','roller','switch'],
  // Motors & Drives
  ['motor-1ph','Single Phase Motor','Motors & Drives','M1~','0.75 kW','load'],
  ['motor-3ph','Three Phase Motor','Motors & Drives','M3~','2.2 kW','load'],
  ['dc-motor','DC Motor','Motors & Drives','MDC','24 V','load'],
  ['servo','Servo Motor','Motors & Drives','SERVO','24 V','load'],
  ['stepper','Stepper Motor','Motors & Drives','STEP','24 V','load'],
  ['vfd','Variable Frequency Drive','Motors & Drives','VFD','0.75 kW','drive'],
  ['soft-starter','Soft Starter','Motors & Drives','SS','3Φ','drive'],
  ['encoder','Rotary Encoder','Motors & Drives','ENC','1024 PPR','sensor'],
  // Loads & Lighting
  ['lamp','Lamp','Loads & Lighting','LAMP','60 W','load'],
  ['led-lamp','LED Lamp','Loads & Lighting','LED','10 W','load'],
  ['heater','Heater','Loads & Lighting','HEAT','1000 W','load'],
  ['resistor-load','Resistive Load','Loads & Lighting','R','100 Ω','load'],
  ['fan','Fan','Loads & Lighting','FAN','80 W','load'],
  ['buzzer','Buzzer','Loads & Lighting','BZ','24 V','load'],
  ['horn','Horn','Loads & Lighting','HORN','24 V','load'],
  ['socket','Power Socket','Loads & Lighting','SOCK','16 A','load'],
  ['pilot-red','Red Pilot Light','Loads & Lighting','H1','24 V','load'],
  ['pilot-green','Green Pilot Light','Loads & Lighting','H2','24 V','load'],
  // Measurement
  ['voltmeter','Voltmeter','Measurement','V','0–600 V','meter'],
  ['ammeter','Ammeter','Measurement','A','0–100 A','meter'],
  ['ohmmeter','Ohmmeter','Measurement','Ω','Auto','meter'],
  ['multimeter','Digital Multimeter','Measurement','DMM','Auto','meter'],
  ['clamp-meter','Clamp Meter','Measurement','CLAMP','600 A','meter'],
  ['wattmeter','Wattmeter','Measurement','W','0–5 kW','meter'],
  ['energy-meter','Energy Meter','Measurement','kWh','1Φ','meter'],
  ['frequency-meter','Frequency Meter','Measurement','Hz','45–65 Hz','meter'],
  ['oscilloscope','Oscilloscope','Measurement','SCOPE','2 ch','meter'],
  ['power-factor','Power Factor Meter','Measurement','cosφ','0–1','meter'],
  // Sensors
  ['proximity-ind','Inductive Proximity Sensor','Sensors','IND','PNP NO','sensor'],
  ['proximity-cap','Capacitive Sensor','Sensors','CAP','PNP NO','sensor'],
  ['photoelectric','Photoelectric Sensor','Sensors','PHOTO','diffuse','sensor'],
  ['ultrasonic','Ultrasonic Sensor','Sensors','US','0.2–4 m','sensor'],
  ['temperature','Temperature Sensor','Sensors','TEMP','PT100','sensor'],
  ['thermocouple','Thermocouple','Sensors','TC','Type K','sensor'],
  ['level-sensor','Level Sensor','Sensors','LEVEL','4–20 mA','sensor'],
  ['pressure-transmitter','Pressure Transmitter','Sensors','PT','4–20 mA','sensor'],
  ['flow-sensor','Flow Sensor','Sensors','FLOW','pulse','sensor'],
  ['ldr','Light Sensor / LDR','Sensors','LDR','10 kΩ','sensor'],
  ['reed','Reed Switch','Sensors','REED','NO','sensor'],
  ['hall','Hall Effect Sensor','Sensors','HALL','digital','sensor'],
  // Industrial Automation
  ['plc','PLC','Industrial Automation','PLC','24 VDC','logic'],
  ['plc-di','PLC Digital Input','Industrial Automation','DI','24 VDC','logic'],
  ['plc-do','PLC Digital Output','Industrial Automation','DO','24 VDC','logic'],
  ['plc-ai','PLC Analog Input','Industrial Automation','AI','4–20 mA','logic'],
  ['plc-ao','PLC Analog Output','Industrial Automation','AO','0–10 V','logic'],
  ['hmi','HMI Panel','Industrial Automation','HMI','7 in','logic'],
  ['remote-io','Remote I/O','Industrial Automation','RIO','Ethernet','logic'],
  ['safety-relay','Safety Relay','Industrial Automation','SAFE','24 V','logic'],
  ['pid','PID Controller','Industrial Automation','PID','96×96','logic'],
  ['counter','Digital Counter','Industrial Automation','CNT','6 digit','logic'],
  ['modbus','Modbus Gateway','Industrial Automation','MB','RS485','logic'],
  ['ethernet-switch','Industrial Ethernet Switch','Industrial Automation','ETH','5 port','logic'],
  // Transformers & Conversion
  ['transformer-1ph','Single Phase Transformer','Transformers & Conversion','TR','230/24 V','convert'],
  ['transformer-3ph','Three Phase Transformer','Transformers & Conversion','TR3','400/230 V','convert'],
  ['ct','Current Transformer','Transformers & Conversion','CT','100/5 A','convert'],
  ['pt','Potential Transformer','Transformers & Conversion','PT','400/100 V','convert'],
  ['bridge','Bridge Rectifier','Transformers & Conversion','BR','10 A','convert'],
  ['dc-supply','AC/DC Power Supply','Transformers & Conversion','PSU','24 VDC','convert'],
  ['dc-dc','DC/DC Converter','Transformers & Conversion','DCDC','24/12 V','convert'],
  ['inverter','DC/AC Inverter','Transformers & Conversion','INV','12/230 V','convert'],
  // Electronics
  ['resistor','Resistor','Electronics','R','1 kΩ','passive'],
  ['potentiometer','Potentiometer','Electronics','POT','10 kΩ','passive'],
  ['capacitor','Capacitor','Electronics','C','100 µF','passive'],
  ['inductor','Inductor','Electronics','L','10 mH','passive'],
  ['diode','Diode','Electronics','D','1N4007','semiconductor'],
  ['zener','Zener Diode','Electronics','ZD','5.1 V','semiconductor'],
  ['led','LED','Electronics','LED','2 V','semiconductor'],
  ['npn','NPN Transistor','Electronics','Q','2N2222','semiconductor'],
  ['pnp','PNP Transistor','Electronics','Q','2N2907','semiconductor'],
  ['mosfet-n','N-MOSFET','Electronics','Q','IRLZ44N','semiconductor'],
  ['mosfet-p','P-MOSFET','Electronics','Q','PMOS','semiconductor'],
  ['scr','SCR / Thyristor','Electronics','SCR','40 A','semiconductor'],
  ['triac','TRIAC','Electronics','TRIAC','16 A','semiconductor'],
  ['opamp','Operational Amplifier','Electronics','OP','LM358','logic'],
  ['logic-and','AND Gate','Electronics','AND','2 input','logic'],
  ['logic-or','OR Gate','Electronics','OR','2 input','logic'],
  ['logic-not','NOT Gate','Electronics','NOT','1 input','logic'],
  // Residential
  ['wall-switch','Wall Switch','Residential','SW','10 A','switch'],
  ['two-way','Two-Way Switch','Residential','2W','10 A','switch'],
  ['dimmer','Dimmer','Residential','DIM','400 W','switch'],
  ['doorbell','Doorbell','Residential','BELL','12 V','load'],
  ['smoke-detector','Smoke Detector','Residential','SMOKE','230 V','sensor'],
  ['motion-sensor','PIR Motion Sensor','Residential','PIR','230 V','sensor'],
  ['thermostat','Thermostat','Residential','TH','0–40 °C','sensor'],
  ['contactor-home','Modular Contactor','Residential','MC','25 A','switch'],
  // Grounding & Wiring
  ['terminal','Terminal Block','Grounding & Wiring','TB','2.5 mm²','wire'],
  ['earth','Protective Earth','Grounding & Wiring','PE','Earth','wire'],
  ['neutral','Neutral','Grounding & Wiring','N','Neutral','wire'],
  ['phase','Phase','Grounding & Wiring','L','Phase','wire'],
  ['busbar','Busbar','Grounding & Wiring','BAR','63 A','wire'],
  ['junction','Junction','Grounding & Wiring','J','node','wire'],
  ['cable-2','2-Core Cable','Grounding & Wiring','2C','2.5 mm²','wire'],
  ['cable-3','3-Core Cable','Grounding & Wiring','3C','2.5 mm²','wire'],
  ['cable-5','5-Core Cable','Grounding & Wiring','5C','2.5 mm²','wire'],

  // Symbols and conventions added from the uploaded electrical-symbol reference
  ['relay-contact-no','Relay Contact NO','Switching & Control','13-14','NO','switch'],
  ['relay-contact-nc','Relay Contact NC','Switching & Control','21-22','NC','switch'],
  ['timed-contact-no','Timed Contact NO','Switching & Control','KT NO','NO timed','switch'],
  ['timed-contact-nc','Timed Contact NC','Switching & Control','KT NC','NC timed','switch'],
  ['momentary-no','Momentary Pushbutton NO','Switching & Control','PB NO','Momentary','switch'],
  ['momentary-nc','Momentary Pushbutton NC','Switching & Control','PB NC','Momentary','switch'],
  ['knife-switch','Knife Switch','Switching & Control','KS','General','switch'],
  ['line-switch','Line Switch','Switching & Control','89','Line switch','switch'],
  ['flow-switch','Flow Switch','Switching & Control','FS','NO','switch'],
  ['level-switch-no','Level Switch NO','Switching & Control','LS','NO','switch'],
  ['level-switch-nc','Level Switch NC','Switching & Control','LS','NC','switch'],
  ['pressure-vac-switch-no','Pressure / Vacuum Switch NO','Switching & Control','63','NO','switch'],
  ['pressure-vac-switch-nc','Pressure / Vacuum Switch NC','Switching & Control','63','NC','switch'],
  ['temperature-switch','Temperature Switch','Switching & Control','TS','NO','switch'],
  ['torque-switch','Torque Switch','Switching & Control','TQ','NO','switch'],
  ['three-phase-delta','3-Phase Delta Supply','Power & Sources','Δ','400 V','voltage'],
  ['three-phase-open-delta','3-Phase Open-Delta Supply','Power & Sources','VΔ','400 V','voltage'],
  ['three-phase-wye','3-Phase Wye Supply','Power & Sources','Y','400/230 V','voltage'],
  ['three-phase-wye-grounded','3-Phase Grounded Wye Supply','Power & Sources','Y⏚','400/230 V','voltage'],
  ['polarity-positive','Positive Polarity Marker','Grounding & Wiring','+','DC +','wire'],
  ['polarity-negative','Negative Polarity Marker','Grounding & Wiring','−','DC −','wire'],
  ['chassis-ground','Chassis Ground','Grounding & Wiring','CHASSIS','Ground','wire'],
  ['short-link','Shorting Link','Grounding & Wiring','LINK','0 Ω','wire'],
  ['autotransformer','Autotransformer','Transformers & Conversion','ATR','230/115 V','convert'],
  ['transformer-3w','Three-Winding Transformer','Transformers & Conversion','TR3W','230/24/12 V','convert'],
  ['bushing-ct','Bushing Current Transformer','Transformers & Conversion','BCT','100/5 A','convert'],
  ['hv-fuse-cutout','High-Voltage Fuse Cutout','Protection','FC','15 A','protection'],
  ['lightning-arrester-gap','Lightning Arrester - Gap','Protection','LA','Surge','protection'],
  ['lightning-arrester-mov','Lightning Arrester - MOV','Protection','MOV','Surge','protection'],
  ['circuit-breaker','Circuit Breaker - General','Protection','52','20 A','protection'],
  ['power-breaker','Power Circuit Breaker','Protection','52P','100 A','protection'],
  ['cb-3pole-magnetic','3-Pole Magnetic Circuit Breaker','Protection','3P CB','32 A','protection'],
  ['drawout-breaker','Drawout Circuit Breaker','Protection','DO CB','400 A','protection'],
  ['bell','Electric Bell','Loads & Lighting','BELL','24 V','load'],
  ['annunciator','Annunciator','Loads & Lighting','ANN','24 V','load'],
  ['indicating-light','Indicating Light','Loads & Lighting','IND','24 V','load'],
  ['machine-general','Machine / Generator / Motor','Motors & Drives','M/G','1 kW','load'],
  ['field-compound','Compound Field Winding','Motors & Drives','F-CMP','10 Ω','passive'],
  ['field-series','Series Field Winding','Motors & Drives','F-SER','10 Ω','passive'],
  ['field-shunt','Shunt Field Winding','Motors & Drives','F-SH','100 Ω','passive'],
  ['field-pm','Permanent-Magnet Field','Motors & Drives','PM','Field','passive'],

  // Expanded real-world component set
  ['bench-dc-supply','Adjustable Bench DC Supply','Power & Sources','LAB PSU','0–30 VDC','voltage'],
  ['dual-dc-supply','Dual DC Supply','Power & Sources','±VDC','±15 V','voltage'],
  ['usb-supply','USB Power Supply','Power & Sources','USB','5 V','voltage'],
  ['battery-24v','24 V Battery Bank','Power & Sources','BAT24','24 V','voltage'],
  ['pv-string','PV String','Power & Sources','PV STR','120 VDC','voltage'],

  ['afdd','Arc Fault Detection Device','Protection','AFDD','16 A','protection'],
  ['earth-leakage-relay','Earth Leakage Relay','Protection','ELR','30 mA','protection'],
  ['undervoltage-relay','Undervoltage Relay','Protection','27','180 V','protection'],
  ['overvoltage-relay','Overvoltage Relay','Protection','59','255 V','protection'],
  ['phase-sequence-relay','Phase Sequence Relay','Protection','47','400 V','protection'],
  ['thermal-fuse','Thermal Fuse','Protection','TF','10 A','protection'],
  ['surge-fuse-combo','Surge + Fuse Module','Protection','SPD/F','20 A','protection'],

  ['key-switch','Key Switch','Switching & Control','KEY','NO','switch'],
  ['foot-switch','Foot Switch','Switching & Control','FOOT','NO','switch'],
  ['rotary-selector','Rotary Selector 3 Position','Switching & Control','ROT','0-1-2','switch'],
  ['star-delta-timer','Star-Delta Timer Relay','Switching & Control','KTYΔ','24 V coil','switch'],
  ['impulse-relay','Impulse Relay','Switching & Control','KIMP','24 V coil','switch'],
  ['contactor-4p','4-Pole Contactor','Switching & Control','KM4','24 V coil','switch'],
  ['solenoid-coil','Solenoid Coil','Switching & Control','Y','24 V / 10 W','load'],

  ['induction-motor','Induction Motor','Motors & Drives','IM','1.5 kW','load'],
  ['synchronous-motor','Synchronous Motor','Motors & Drives','SM','1.5 kW','load'],
  ['universal-motor','Universal Motor','Motors & Drives','UM','500 W','load'],
  ['geared-motor','Geared Motor','Motors & Drives','GM','0.37 kW','load'],
  ['pump-motor','Pump Motor','Motors & Drives','PUMP M','1.1 kW','load'],
  ['linear-actuator','Linear Actuator','Motors & Drives','ACT','24 V / 120 W','load'],

  ['incandescent-lamp','Incandescent Lamp','Loads & Lighting','GLS','60 W','load'],
  ['fluorescent-lamp','Fluorescent Lamp','Loads & Lighting','FL','36 W','load'],
  ['emergency-light','Emergency Light','Loads & Lighting','EM L','12 W','load'],
  ['heating-element','Heating Element','Loads & Lighting','HTR','1500 W','load'],
  ['compressor-load','Compressor','Loads & Lighting','COMP','1.5 kW','load'],
  ['solenoid-valve','Solenoid Valve','Loads & Lighting','YV','24 V / 8 W','load'],

  ['phase-sequence-meter','Phase Sequence Meter','Measurement','SEQ','3Φ','meter'],
  ['insulation-tester','Insulation Tester','Measurement','IR','500 V','meter'],
  ['megohmmeter','Megohmmeter','Measurement','MΩ','1000 MΩ','meter'],
  ['tachometer','Tachometer','Measurement','RPM','0–6000 rpm','meter'],
  ['temperature-meter','Temperature Meter','Measurement','°C','-50–150 °C','meter'],

  ['current-sensor','Current Sensor','Sensors','I-SEN','0–100 A','sensor'],
  ['voltage-sensor','Voltage Sensor','Sensors','V-SEN','0–500 V','sensor'],
  ['vibration-sensor','Vibration Sensor','Sensors','VIB','0–20 mm/s','sensor'],
  ['humidity-sensor','Humidity Sensor','Sensors','RH','0–100 %','sensor'],
  ['magnetic-proximity','Magnetic Proximity Sensor','Sensors','MAG','NO','sensor'],

  ['plc-cpu','PLC CPU','Industrial Automation','CPU','24 VDC','logic'],
  ['signal-isolator','Signal Isolator','Industrial Automation','ISO SIG','4–20 mA','logic'],
  ['signal-converter','Signal Converter','Industrial Automation','SIG CONV','4–20 mA / 0–10 V','logic'],
  ['io-link-master','IO-Link Master','Industrial Automation','IOL','24 VDC','logic'],

  ['isolation-transformer','Isolation Transformer','Transformers & Conversion','ISO TR','230/230 V','convert'],
  ['variac','Variable Autotransformer','Transformers & Conversion','VARIAC','0–230 V','convert'],
  ['buck-converter','Buck Converter','Transformers & Conversion','BUCK','24/12 V','convert'],
  ['boost-converter','Boost Converter','Transformers & Conversion','BOOST','12/24 V','convert'],
  ['battery-charger','Battery Charger','Transformers & Conversion','CHG','230/24 V','convert'],

  ['ntc','NTC Thermistor','Electronics','NTC','10 kΩ','passive'],
  ['ptc','PTC Thermistor','Electronics','PTC','1 kΩ','passive'],
  ['varistor','MOV Varistor','Electronics','MOV','275 V','passive'],
  ['photodiode','Photodiode','Electronics','PD','5 V','semiconductor'],
  ['optocoupler','Optocoupler','Electronics','OPTO','PC817','semiconductor'],

  ['ceiling-fan','Ceiling Fan','Residential','CFAN','80 W','load'],
  ['exhaust-fan','Exhaust Fan','Residential','XFAN','35 W','load'],
  ['water-heater','Electric Water Heater','Residential','WH','2000 W','load'],
  ['schuko-socket','Schuko Socket Outlet','Residential','SOCK E','16 A','load'],

  ['fused-terminal','Fused Terminal Block','Grounding & Wiring','FTB','6.3 A','wire'],
  ['disconnect-terminal','Disconnect Terminal Block','Grounding & Wiring','DTB','2.5 mm²','wire'],
  ['earth-terminal','Protective Earth Terminal','Grounding & Wiring','PE-TB','2.5 mm²','wire'],
  ['test-point','Electrical Test Point','Grounding & Wiring','TP','4 mm','wire'],
].map(([id,name,category,symbol,rating,type]) => ({id,name,category,symbol,rating,type}))

const STARTER_CIRCUITS = [
  { title: 'Lamp & switch', desc: 'Basic DC source, switch and lamp', parts: ['dc-source','switch-spst','lamp'] },
  { title: 'DOL motor starter', desc: '3-phase motor starter with breaker, contactor and overload', parts: ['three-phase','mcb','contactor','thermal-relay','motor-3ph'] },
  { title: '24 V control circuit', desc: 'Power supply, push buttons, relay and pilot light', parts: ['dc-supply','push-no','push-nc','control-relay','pilot-green'] },
  { title: 'Residential light circuit', desc: 'AC supply, breaker, wall switch and LED lamp', parts: ['ac-source','mcb','wall-switch','led-lamp'] },
  { title: 'Sensor to PLC', desc: '24 V supply, proximity sensor, PLC input and pilot output', parts: ['dc-supply','proximity-ind','plc-di','plc-do','pilot-green'] },
  { title: 'Bridge rectifier test', desc: 'Transformer, bridge rectifier, capacitor and DC load', parts: ['transformer-1ph','bridge','capacitor','resistor-load'] },
]

const typeClass = {
  voltage:'source', protection:'protection', switch:'switch', load:'load', meter:'meter',
  sensor:'sensor', drive:'drive', logic:'logic', convert:'convert', passive:'passive',
  semiconductor:'semi', wire:'wire'
}

function partIcon(type){
  const common={size:19,strokeWidth:1.9}
  if(type==='voltage') return <BatteryCharging {...common}/>
  if(type==='protection') return <ShieldCheck {...common}/>
  if(type==='switch') return <ToggleLeft {...common}/>
  if(type==='load') return <Lightbulb {...common}/>
  if(type==='meter') return <Gauge {...common}/>
  if(type==='sensor') return <Radio {...common}/>
  if(type==='drive') return <RotateCw {...common}/>
  if(type==='logic') return <Cpu {...common}/>
  if(type==='convert') return <Zap {...common}/>
  if(type==='wire') return <Cable {...common}/>
  return <CircuitBoard {...common}/>
}


const I18nContext=createContext({lang:'en',setLang:()=>{}})
function useI18n(){return useContext(I18nContext)}

function App(){
  const [view,setView] = useState('dashboard')
  const [search,setSearch] = useState('')
  const [category,setCategory] = useState('All')
  const [components,setComponents] = useState([])
  const [wires,setWires] = useState([])
  const [selected,setSelected] = useState(null)
  const [wireStart,setWireStart] = useState(null)
  const [simulating,setSimulating] = useState(false)
  const [zoom,setZoom] = useState(1)
  const [history,setHistory] = useState([])
  const [redo,setRedo] = useState([])
  const [paletteOpen,setPaletteOpen] = useState(true)
  const [gridOn,setGridOn] = useState(true)
  const [gridSize] = useState(10)
  const [tool,setTool] = useState('select')
  const [sheets,setSheets] = useState([{id:'sheet-1',name:'Sheet 1',components:[],wires:[]}])
  const [activeSheet,setActiveSheet] = useState('sheet-1')
  const [toast,setToast] = useState('')
  const [lang,setLang] = useState(()=>localStorage.getItem('electrolab-language')||'en')
  const canvasRef = useRef(null)

  useEffect(()=>{
    document.documentElement.lang=lang
    document.documentElement.dir=lang==='ar'?'rtl':'ltr'
    localStorage.setItem('electrolab-language',lang)
  },[lang])

  useEffect(()=>{
    try{
      const raw=localStorage.getItem('electrolab-project-v4')
      if(!raw)return
      const saved=JSON.parse(raw)
      if(Array.isArray(saved.sheets)&&saved.sheets.length){
        const sid=saved.activeSheet||saved.sheets[0].id
        const current=saved.sheets.find(x=>x.id===sid)||saved.sheets[0]
        setSheets(saved.sheets)
        setActiveSheet(current.id)
        setComponents(current.components||[])
        setWires(current.wires||[])
        if(typeof saved.gridOn==='boolean')setGridOn(saved.gridOn)
        if(Number.isFinite(saved.zoom))setZoom(saved.zoom)
      }
    }catch(e){ console.warn('Could not restore ElectroLab project',e) }
  },[])

  const filtered = useMemo(()=> PARTS.filter(p => {
    const q=search.toLowerCase().trim()
    return (category==='All' || p.category===category) && (!q || p.name.toLowerCase().includes(q) || partName(p,lang).toLowerCase().includes(q) || p.symbol.toLowerCase().includes(q))
  }),[search,category,lang])

  const snapshot = () => ({components: structuredClone(components), wires: structuredClone(wires)})
  const commit = () => { setHistory(h=>[...h.slice(-30),snapshot()]); setRedo([]) }
  const showToast = (text) => { setToast(text); window.clearTimeout(showToast._timer); showToast._timer=window.setTimeout(()=>setToast(''),2200) }
  const snap = (value) => gridOn ? Math.round(value/gridSize)*gridSize : value
  const cancelWire = () => setWireStart(null)

  const persistCurrentSheet = () => sheets.map(s=>s.id===activeSheet?{...s,components:structuredClone(components),wires:structuredClone(wires)}:s)
  const saveProject = () => {
    const next=persistCurrentSheet()
    setSheets(next)
    localStorage.setItem('electrolab-project-v4',JSON.stringify({version:4,activeSheet,sheets:next,gridOn,zoom}))
    showToast(tr('Project saved in this browser',lang))
  }
  const switchSheet = (id) => {
    if(id===activeSheet)return
    const currentSheets=persistCurrentSheet()
    const target=currentSheets.find(s=>s.id===id)
    if(!target)return
    setSheets(currentSheets)
    setActiveSheet(id)
    setComponents(structuredClone(target.components||[]))
    setWires(structuredClone(target.wires||[]))
    setSelected(null); setWireStart(null); setHistory([]); setRedo([])
  }
  const newSheet = () => {
    const saved=persistCurrentSheet()
    const n=saved.length+1
    const sheet={id:`sheet-${Date.now()}`,name:`Sheet ${n}`,components:[],wires:[]}
    setSheets([...saved,sheet]); setActiveSheet(sheet.id); setComponents([]); setWires([]); setSelected(null); setWireStart(null); setHistory([]); setRedo([])
    showToast(lang==='ar'?`تم إنشاء الورقة ${n}`:`Sheet ${n} created`)
  }

  const addPart = (part, x=420+Math.random()*350, y=220+Math.random()*260) => {
    commit()
    const item={uid:crypto.randomUUID(),partId:part.id,x:snap(x),y:snap(y),rotation:0,value:part.rating,tag:part.symbol,state:defaultState(part),params:defaultParameters(part)}
    setComponents(cs=>[...cs,item])
    setSelected(item.uid)
    setView('simulator')
  }

  const applyTemplate = (template) => {
    const arr=template.parts.map((id,i)=>({
      uid:crypto.randomUUID(),partId:id,x:250+i*170,y:280+(i%2)*80,rotation:0,
      value:PARTS.find(p=>p.id===id)?.rating||'',tag:PARTS.find(p=>p.id===id)?.symbol||'',state:defaultState(PARTS.find(p=>p.id===id)||{}),params:defaultParameters(PARTS.find(p=>p.id===id)||{})
    }))
    commit(); setComponents(arr); setWires([]); setSelected(arr[0]?.uid||null); setView('simulator')
    showToast(lang==='ar'?`تم تحميل ${starterText(template,lang).title}`:`${template.title} loaded`)
  }

  const removeSelected=()=>{
    if(!selected)return
    commit()
    setComponents(cs=>cs.filter(c=>c.uid!==selected))
    setWires(ws=>ws.filter(w=>w.a?.uid!==selected && w.b?.uid!==selected && w.a!==selected && w.b!==selected))
    setSelected(null)
  }
  const undo=()=>{
    if(!history.length)return
    const prev=history[history.length-1]
    setRedo(r=>[snapshot(),...r]); setComponents(prev.components); setWires(prev.wires); setHistory(h=>h.slice(0,-1)); setSelected(null)
  }
  const redoAction=()=>{
    if(!redo.length)return
    setHistory(h=>[...h,snapshot()]); const next=redo[0]; setComponents(next.components); setWires(next.wires); setRedo(r=>r.slice(1)); setSelected(null)
  }
  const onCanvasDrop=(e)=>{
    e.preventDefault(); const id=e.dataTransfer.getData('partId'); const p=PARTS.find(x=>x.id===id); if(!p)return
    const rect=canvasRef.current.getBoundingClientRect(); addPart(p,(e.clientX-rect.left)/zoom,(e.clientY-rect.top)/zoom)
  }
  const startWire=(uid,port)=>{
    setTool('wire')
    const endpoint={uid,port}
    if(!wireStart){ setWireStart(endpoint); showToast(tr('Select a terminal on another component',lang)) }
    else if(wireStart.uid!==uid || wireStart.port!==port){
      const duplicate=wires.some(w => (w.a.uid===wireStart.uid&&w.a.port===wireStart.port&&w.b.uid===uid&&w.b.port===port)||(w.b.uid===wireStart.uid&&w.b.port===wireStart.port&&w.a.uid===uid&&w.a.port===port))
      if(!duplicate){ commit(); setWires(ws=>[...ws,{uid:crypto.randomUUID(),a:wireStart,b:endpoint}]) }
      setWireStart(null)
    } else setWireStart(null)
  }
  const updateComponent=(uid,patch)=>setComponents(cs=>cs.map(c=>c.uid===uid?{...c,...patch}:c))
  const simulateReport = useMemo(()=>simulateCircuit(components,wires,PARTS,{frequency:50,applyProtection:simulating}),[components,wires,simulating])

  const ctx={lang,setLang}
  return <I18nContext.Provider value={ctx}><div className={`app-shell ${lang==='ar'?'rtl':''}`}>
    {view!=='simulator' && <Sidebar view={view} setView={setView}/>} 
    <main className={view==='simulator'?'main sim-main':'main'}>
      {view==='dashboard' && <Dashboard setView={setView} applyTemplate={applyTemplate} setSearch={setSearch}/>} 
      {view==='library' && <LibraryView filtered={filtered} search={search} setSearch={setSearch} category={category} setCategory={setCategory} addPart={addPart}/>} 
      {view==='calculator' && <CalculatorView/>}
      {view==='exercises' && <ExercisesView applyTemplate={applyTemplate}/>} 
      {view==='learning' && <LearningView setView={setView}/>} 
      {view==='guide' && <GuideView setView={setView}/>} 
      {view==='docs' && <DocsView/>} 
      {view==='about' && <AboutView/>}
      {view==='settings' && <SettingsView gridOn={gridOn} setGridOn={setGridOn}/>} 
      {view==='simulator' && <Simulator
        components={components} wires={wires} selected={selected} setSelected={setSelected}
        search={search} setSearch={setSearch} category={category} setCategory={setCategory} filtered={filtered}
        setView={setView} addPart={addPart} onCanvasDrop={onCanvasDrop} canvasRef={canvasRef}
        updateComponent={updateComponent} startWire={startWire} wireStart={wireStart}
        removeSelected={removeSelected} simulating={simulating} setSimulating={setSimulating}
        zoom={zoom} setZoom={setZoom} undo={undo} redoAction={redoAction} paletteOpen={paletteOpen} setPaletteOpen={setPaletteOpen}
        report={simulateReport} showToast={showToast} gridOn={gridOn} setGridOn={setGridOn} gridSize={gridSize} snap={snap}
        tool={tool} setTool={setTool} cancelWire={cancelWire} commit={commit} sheets={sheets} activeSheet={activeSheet}
        switchSheet={switchSheet} newSheet={newSheet} saveProject={saveProject}
      />}
    </main>
    {view!=='simulator' && <MobileNav view={view} setView={setView}/>}
    {toast && <div className="toast">{toast}</div>}
  </div></I18nContext.Provider>
}

function MobileNav({view,setView}){
  const {lang}=useI18n(); const L=x=>tr(x,lang)
  const items=[['dashboard','Dashboard',LayoutDashboard],['library','Component Library',Library],['simulator','Circuit Simulator',CircuitBoard],['guide','Guide',GraduationCap],['settings','Settings',Settings]]
  return <nav className="mobile-bottom-nav" aria-label={L('MAIN')}>{items.map(([id,label,Icon])=><button key={id} className={view===id?'active':''} onClick={()=>setView(id)}><Icon/><span>{L(label)}</span></button>)}</nav>
}

function LanguageButton({compact=false}){
  const {lang,setLang}=useI18n()
  return <button className={compact?'language-btn compact':'language-btn'} onClick={()=>setLang(lang==='en'?'ar':'en')} title={tr('Switch language',lang)}><span className="lang-globe">◎</span><b>{lang==='en'?'العربية':'EN'}</b></button>
}

function Sidebar({view,setView}){
  const {lang}=useI18n(); const L=x=>tr(x,lang)
  const item=(id,label,Icon,extra=null)=><button className={view===id?'nav active':'nav'} onClick={()=>setView(id)}><Icon/>{L(label)}{extra}</button>
  return <aside className="sidebar">
    <div className="brand"><div className="brand-mark"><Zap size={20}/></div><div><b>ElectroLab</b><small>{L('Electrical Studio')}</small></div></div>
    <div className="side-label">{L('MAIN')}</div>
    {item('dashboard','Dashboard',LayoutDashboard)}
    {item('library','Component Library',Library,<span className="nav-pill">{PARTS.length}</span>)}
    {item('simulator','Circuit Simulator',CircuitBoard,<span className="dot"></span>)}
    <div className="side-label">{L('TOOLS')}</div>
    {item('calculator','Electrical Calculator',Calculator)}
    {item('exercises','Exercises',ClipboardCheck)}
    {item('learning','Learning Center',BookOpen)}
    {item('guide','Guide',GraduationCap)}
    <div className="side-label">{L('SUPPORT')}</div>
    {item('docs','Documentation',HelpCircle)}
    {item('about','About simulator',Info)}
    <div className="sidebar-footer">
      <div className="user-dot">E</div><div><b>{L('Engineering Lab')}</b><small>{L('Local workspace')}</small></div><button className="footer-settings" onClick={()=>setView('settings')} title={L('Settings')}><Settings size={18}/></button>
    </div>
  </aside>
}

function Dashboard({setView,applyTemplate,setSearch}){
  const {lang}=useI18n(); const L=x=>tr(x,lang)
  return <div className="page">
    <Topbar placeholder={L('Search components, circuits and tools...')} onSearch={q=>{setSearch(q);setView('library')}}/>
    <section className="content">
      <div className="hello"><div><h1>{L('Electrical Engineering Lab')} <span>⚡</span></h1><p>{L('Build, test and learn electrical circuits in one workspace.')}</p></div><button className="primary" onClick={()=>setView('simulator')}><Play size={18}/>{L('Open simulator')}</button></div>
      <div className="hero"><div><span className="eyebrow"><Sparkles size={14}/> {L('INTERACTIVE CIRCUIT LAB')}</span><h2>{L('Design. Connect. Test.')}<br/><strong>{L('Understand electricity safely.')}</strong></h2><p>{L('A professional browser-based training environment for electrical, electronics and industrial automation practice.')}</p><div className="hero-actions"><button className="hero-btn" onClick={()=>setView('simulator')}><CircuitBoard/>{L('Start new circuit')}</button><button className="ghost-btn" onClick={()=>setView('library')}><Library/>{L('Browse')} {PARTS.length}+ {L('parts')}</button></div></div>
        <div className="hero-visual"><div className="coil"></div><div className="visual-node n1"><Power/></div><div className="visual-node n2"><Lightbulb/></div><div className="visual-node n3"><Gauge/></div><div className="visual-node n4"><Cpu/></div><svg viewBox="0 0 300 210"><path d="M55 105 C90 20, 210 20, 250 92 S200 190 85 165"/><path d="M50 165 C110 95 175 135 255 40"/></svg></div>
      </div>
      <div className="stats-grid"><Stat icon={<Boxes/>} value={`${PARTS.length}+`} label={L('Electrical components')} tone="blue"/><Stat icon={<Library/>} value={`${CATEGORIES.length}`} label={L('Component categories')} tone="violet"/><Stat icon={<GitBranch/>} value={L('Unlimited')} label={L('Circuit workspaces')} tone="green"/><Stat icon={<ShieldCheck/>} value={L('Safe')} label={L('Virtual testing')} tone="orange"/></div>
      <div className="section-head"><div><h3>{L('Starter circuits')}</h3><p>{L('Load a complete example and start experimenting.')}</p></div><button className="text-btn" onClick={()=>setView('library')}>{L('View all components →')}</button></div>
      <div className="templates">{STARTER_CIRCUITS.map((template,i)=>{const txt=starterText(template,lang);return <button className="template-card" key={template.title} onClick={()=>applyTemplate(template)}><div className={`template-icon t${i%4}`}><CircuitBoard/></div><div><b>{txt.title}</b><p>{txt.desc}</p><span>{template.parts.length} {L('components')}</span></div><ChevronDown className="rotate"/></button>})}</div>
      <div className="notice"><TriangleAlert/><div><b>{L('Educational simulator')}</b><p>{L('Use this environment for learning, planning and virtual testing. Always follow qualified electrical safety practices on real installations.')}</p></div></div>
    </section>
  </div>
}

function Stat({icon,value,label,tone}){return <div className="stat"><div className={`stat-icon ${tone}`}>{icon}</div><div><b>{value}</b><span>{label}</span></div></div>}

function Topbar({placeholder,onSearch}){
  const {lang}=useI18n(); const L=x=>tr(x,lang)
  const [q,setQ]=useState(''); const [notice,setNotice]=useState(false)
  const submit=e=>{e.preventDefault(); if(onSearch)onSearch(q)}
  return <div className="topbar"><form className="top-search" onSubmit={submit}><Search size={18}/><input value={q} onChange={e=>setQ(e.target.value)} placeholder={placeholder}/>{onSearch&&q&&<button className="search-go" type="submit">{L('Go')}</button>}</form><div className="top-actions"><div className="notification-wrap"><button className="top-icon" onClick={()=>setNotice(v=>!v)} title={L('Notifications')}><Bell/></button>{notice&&<div className="notification-pop"><b>{L('Notifications')}</b><p>{L('No new notifications. Your local simulator is ready.')}</p></div>}</div><LanguageButton/><div className="avatar">EL</div><div className="avatar-copy"><b>ElectroLab</b><small>{L('Engineering workspace')}</small></div></div></div>
}

function LibraryView({filtered,search,setSearch,category,setCategory,addPart}){
  const {lang}=useI18n(); const L=x=>tr(x,lang)
  return <div className="page"><Topbar placeholder={L('Search the platform...')}/><section className="content">
    <div className="library-hero"><div><span className="eyebrow"><Library size={14}/> {L('COMPONENT LIBRARY')}</span><h1>{L('Practice with')} <strong>{L('real electrical components')}</strong></h1><p>{L('Search, inspect and place devices into the simulator.')}</p></div><div className="library-count"><b>{PARTS.length}</b><span>{L('components')}</span><i></i><b>{CATEGORIES.length}</b><span>{L('categories')}</span></div></div>
    <div className="filters"><div className="search-box"><Search size={17}/><input value={search} onChange={e=>setSearch(e.target.value)} placeholder={L('Search component...')}/></div><select value={category} onChange={e=>setCategory(e.target.value)}><option value="All">{L('All')}</option>{CATEGORIES.map(c=><option key={c} value={c}>{categoryName(c,lang)}</option>)}</select><button className="filter-btn active-static"><SlidersHorizontal size={17}/>{L('Interactive')}</button><button className="filter-btn" onClick={()=>{setSearch('');setCategory('All')}}><RotateCcw size={17}/>{L('Reset')}</button></div>
    <div className="part-grid">{filtered.map(p=><div className="part-card" key={p.id}><div className={`part-art ${typeClass[p.type]||'passive'}`}><ElectricalSymbol part={p} compact/><span className="part-kind-icon">{partIcon(p.type)}</span></div><div className="part-copy"><div className="part-top"><b>{partName(p,lang)}</b><span className="difficulty">{L('Interactive')}</span></div><span className="category-tag">{categoryName(p.category,lang)}</span><p>{L('Default')}: <strong>{p.rating}</strong></p></div><button className="access-btn" onClick={()=>addPart(p)}><Play size={16}/>{L('Add to simulator')}</button></div>)}</div>
  </section></div>
}

function SimplePage({title,subtitle,children,placeholder='Search the platform...'}){
  const {lang}=useI18n();return <div className="page"><Topbar placeholder={tr(placeholder,lang)}/><section className="content utility-page"><div className="utility-heading"><h1>{title}</h1><p>{subtitle}</p></div>{children}</section></div>
}

function CalculatorView(){
  const {lang}=useI18n(); const L=x=>tr(x,lang); const [v,setV]=useState(12);const [r,setR]=useState(10)
  const current=Number(r)>0?Number(v)/Number(r):0; const power=Number(v)*current
  return <SimplePage title={L('Electrical Calculator')} subtitle={L('Quick electrical calculations')}><div className="tool-card calculator-card"><div className="tool-card-title"><Calculator/><div><b>{L('Ohm’s law calculator')}</b><span>{L('Enter voltage and resistance to calculate current and power.')}</span></div></div><div className="calc-grid"><label>{L('Voltage (V)')}<input type="number" value={v} onChange={e=>setV(e.target.value)}/></label><label>{L('Resistance (Ω)')}<input type="number" min="0.001" value={r} onChange={e=>setR(e.target.value)}/></label><div className="calc-result"><span>{L('Current (A)')}</span><b>{Number.isFinite(current)?current.toFixed(4):'∞'} A</b></div><div className="calc-result"><span>{L('Power (W)')}</span><b>{Number.isFinite(power)?power.toFixed(2):'∞'} W</b></div></div><button className="secondary-action" onClick={()=>{setV(12);setR(10)}}><RotateCcw/>{L('Reset')}</button></div></SimplePage>
}

function ExercisesView({applyTemplate}){
  const {lang}=useI18n(); const L=x=>tr(x,lang); const [open,setOpen]=useState(null)
  const answers={
    'Lamp & switch':lang==='ar'?'صل البطارية بالمفتاح، ثم المفتاح بالمصباح، وأعد طرف المصباح إلى البطارية. أغلق المفتاح ليضيء المصباح.':'Connect source → switch → lamp → source return. Close the switch to light the lamp.',
    'DOL motor starter':lang==='ar'?'رتّب المصدر ثم القاطع ثم الكونتاكتور ثم المرحّل الحراري ثم المحرك.':'Place supply → breaker → contactor → thermal overload → motor.',
    '24 V control circuit':lang==='ar'?'استخدم زر الإيقاف NC وزر التشغيل NO للتحكم في ملف المرحّل ومصباح البيان.':'Use the NC stop and NO start buttons to control the relay coil and pilot light.'
  }
  return <SimplePage title={L('Interactive exercises')} subtitle={L('Practice with guided circuit tasks.')}><div className="exercise-grid">{STARTER_CIRCUITS.slice(0,3).map((t,i)=>{const txt=starterText(t,lang);return <div className="exercise-card" key={t.title}><div className="exercise-num">{i+1}</div><h3>{txt.title}</h3><p>{txt.desc}</p><div className="exercise-actions"><button onClick={()=>applyTemplate(t)}><Play/>{L('Load exercise')}</button><button className="outline" onClick={()=>setOpen(open===t.title?null:t.title)}><HelpCircle/>{open===t.title?L('Hide answer'):L('Show answer')}</button></div>{open===t.title&&<div className="answer-box">{answers[t.title]}</div>}</div>})}</div></SimplePage>
}

function LearningView({setView}){
  const {lang}=useI18n(); const L=x=>tr(x,lang)
  const cards=[['guide',GraduationCap,L('Simulator Guide'),L('Learn the simulator step by step.'),L('Open guide')],['docs',BookOpen,L('Documentation'),L('Reference for the simulator controls and electrical workspace.'),L('Open documentation')],['library',Library,L('Component Library'),L('Search, inspect and place devices into the simulator.'),L('Browse components')]]
  return <SimplePage title={L('Learning Center')} subtitle={L('Learn the simulator step by step.')}><div className="learning-grid">{cards.map(([id,Icon,title,desc,action])=><button key={id} className="learning-card" onClick={()=>setView(id)}><Icon/><h3>{title}</h3><p>{desc}</p><span>{action} →</span></button>)}</div></SimplePage>
}

function GuideView({setView}){
  const {lang}=useI18n(); const L=x=>tr(x,lang)
  const en=[['Add a source and a load','Open Component Library and drag a battery/source and a lamp or motor to the sheet.'],['Left-click','Left-click a component to select it and edit it in the right panel.'],['Connect the terminals','Click a terminal, then click the destination terminal. Repeat until you have a closed circuit.'],['Configure the component','Use the right inspector to change voltage, power, resistance, state, rotation and other available values.'],['Run the simulation','Press SIMULATE to activate protection trips and running feedback. The live analyser also updates while editing.'],['Read the live values','Watch voltage, current, power, terminal voltage, device state and energized wire colours.'],['Save your project','Press the save button. The project is stored locally in this browser.']]
  const ar=[['أضف مصدراً وحملاً','افتح مكتبة المكوّنات واسحب بطارية أو مصدراً مع مصباح أو محرك إلى الورقة.'],['النقر بالزر الأيسر','انقر بالزر الأيسر على أي مكوّن لتحديده فوراً وتعديل خصائصه من اللوحة اليمنى.'],['وصّل الأطراف','انقر طرفاً ثم انقر الطرف المطلوب في المكوّن الآخر. كرر ذلك حتى تحصل على دائرة مغلقة.'],['اضبط المكوّن','من لوحة الخصائص اليمنى غيّر الجهد والقدرة والمقاومة والحالة والدوران والقيم المتاحة.'],['شغّل المحاكاة','اضغط تشغيل المحاكاة لتفعيل فصل الحماية وردود فعل التشغيل. التحليل المباشر يعمل أيضاً أثناء التعديل.'],['اقرأ القيم المباشرة','راقب الجهد والتيار والقدرة وجهود الأطراف وحالة الجهاز وألوان الأسلاك المكهربة.'],['احفظ مشروعك','اضغط زر الحفظ. يتم تخزين المشروع محلياً في هذا المتصفح.']]
  const steps=lang==='ar'?ar:en
  return <SimplePage title={L('Simulator Guide')} subtitle={L('Follow these steps to build and test a circuit.')}><div className="guide-layout"><div className="guide-steps">{steps.map((s,i)=><div className="guide-step" key={s[0]}><div className="step-num">{i+1}</div><div><h3>{s[0]}</h3><p>{s[1]}</p></div></div>)}</div><aside className="guide-side"><MousePointer2/><h3>{L('Left-click')}</h3><p>{L('Use the left mouse button to select and drag components.')}</p><button className="primary" onClick={()=>setView('simulator')}><Play/>{L('Open simulator')}</button></aside></div></SimplePage>
}

function DocsView(){
  const {lang}=useI18n(); const L=x=>tr(x,lang)
  const rows=lang==='ar'?[['التحديد','انقر بالزر الأيسر على المكوّن لتحديده. اسحبه لتحريكه.'],['التوصيل','انقر نقطة طرف ثم انقر نقطة طرف أخرى لإنشاء سلك.'],['الإعداد','غيّر الخصائص الكهربائية من لوحة المكوّن اليمنى.'],['الشبكة','فعّل الشبكة لتثبيت حركة المكوّنات على مسافات منتظمة.'],['المحاكاة','المعاينة المباشرة تحسب أثناء التحرير، وزر المحاكاة يفعّل الحماية ومنطق التشغيل.'],['الحفظ','احفظ كل الأوراق والمكوّنات والأسلاك في التخزين المحلي للمتصفح.']]:[['Selection','Left-click a component to select it. Drag it to move it.'],['Wiring','Click one terminal point, then another terminal point to create a wire.'],['Configuration','Edit electrical properties in the component inspector on the right.'],['Grid','Enable the grid to snap moved components to regular positions.'],['Simulation','Live preview calculates while editing; SIMULATE enables protection and operating logic.'],['Saving','Save all sheets, components and wires to browser local storage.']]
  return <SimplePage title={L('Documentation')} subtitle={L('Reference for the simulator controls and electrical workspace.')}><div className="docs-list">{rows.map(r=><div className="docs-row" key={r[0]}><b>{r[0]}</b><p>{r[1]}</p></div>)}</div></SimplePage>
}

function AboutView(){
  const {lang}=useI18n(); const L=x=>tr(x,lang)
  return <SimplePage title={L('About ElectroLab')} subtitle={L('ElectroLab is a browser-based educational electrical simulation workspace.')}><div className="about-card"><div className="brand-mark big"><Zap/></div><h2>ElectroLab</h2><p>{lang==='ar'?'يوفر مكتبة مكوّنات كهربائية ورموزاً هندسية ومساحة رسم ومحرك تحليل تعليمي وقيم قياس مباشرة. وهو مخصص للتعلّم والاختبار الافتراضي، وليس بديلاً عن إجراءات السلامة والحسابات الهندسية المعتمدة في المنشآت الحقيقية.':'It provides an electrical component library, engineering symbols, a circuit canvas, an educational analysis engine and live measurements. It is intended for learning and virtual testing, not as a replacement for qualified safety practice or certified engineering calculations on real installations.'}</p><div className="about-stats"><span><b>{PARTS.length}</b>{L('components')}</span><span><b>{CATEGORIES.length}</b>{L('categories')}</span></div></div></SimplePage>
}

function SettingsView({gridOn,setGridOn}){
  const {lang,setLang}=useI18n(); const L=x=>tr(x,lang)
  return <SimplePage title={L('Settings')} subtitle={L('Project preferences')}><div className="settings-page-card"><h3>{L('Interface language')}</h3><div className="language-choice"><button className={lang==='en'?'selected':''} onClick={()=>setLang('en')}>English</button><button className={lang==='ar'?'selected':''} onClick={()=>setLang('ar')}>العربية</button></div><hr/><h3>{L('Default grid')}</h3><label className="toggle-row"><span>{gridOn?L('Enabled'):L('Disabled')}</span><input type="checkbox" checked={gridOn} onChange={e=>setGridOn(e.target.checked)}/></label></div></SimplePage>
}

function metricPct(value, reference){ if(!Number.isFinite(value)||value<=0)return 0; return Math.max(3,Math.min(100,(value/reference)*100)) }
function formatValue(value,digits=2){ if(!Number.isFinite(value))return '∞'; if(Math.abs(value)>=1000)return value.toFixed(0); return value.toFixed(digits) }


function endpointOf(raw, fallback='1'){
  if(!raw)return null
  return typeof raw==='string'?{uid:raw,port:fallback}:raw
}

function getConnectedTerminalSet(wires){
  const set=new Set()
  for(const w of wires){
    const a=endpointOf(w.a,'2'), b=endpointOf(w.b,'1')
    if(a?.uid)set.add(`${a.uid}:${a.port}`)
    if(b?.uid)set.add(`${b.uid}:${b.port}`)
  }
  return set
}

function buildCircuitGuidance({components,wires,report,selectedComp,selectedPart,selectedResult,wireStart,lang}){
  const ar=lang==='ar'
  const advice=[]
  const add=(level,title,text,action)=>advice.push({level,title,text,action})
  const connected=getConnectedTerminalSet(wires)
  const openSwitches=components.filter(c=>{
    const p=PARTS.find(x=>x.id===c.partId)
    return p && (p.type==='switch'||p.type==='protection') && c.state==='open'
  })

  if(!components.length){
    add('info',ar?'ابدأ بدائرة بسيطة':'Start with a simple circuit',ar?'أضف مصدر طاقة وحملاً مثل مصباح أو محرك.':'Add a power source and a load such as a lamp or motor.',ar?'مثال: بطارية ← مفتاح ← مصباح ← البطارية':'Example: Battery → switch → lamp → battery')
    return advice
  }
  if(wireStart){
    add('info',ar?'أكمل السلك':'Finish the wire',ar?'لقد بدأت توصيلاً من أحد الأطراف. اختر طرفاً آخر لإكمال السلك.':'You started a wire from one terminal. Tap another terminal to complete it.',ar?'اضغط على طرف في مكوّن آخر، أو اضغط Escape للإلغاء.':'Tap a terminal on another component, or press Escape to cancel.')
  }
  if(report.shortCircuit){
    add('danger',ar?'قصر كهربائي':'Short circuit detected',ar?'يوجد مسار منخفض المقاومة مباشرة عبر مصدر الطاقة، وقد يكون التيار خطيراً جداً.':'A very low-resistance path exists across a power source, so current can become dangerously high.',ar?'افصل أحد الأسلاك، افتح المفتاح، أو أضف حملاً/حماية بين طرفي المصدر.':'Disconnect one wire, open a switch, or place a load/protection device between the source terminals.')
  }
  if(report.trips?.length){
    add('danger',ar?'جهاز حماية مفصول':'Protection device tripped',ar?`تم فصل ${report.trips.length} جهاز حماية لأن التيار تجاوز الإعداد.`:`${report.trips.length} protection device(s) tripped because current exceeded the configured rating.`,ar?'تحقق من القصر والحمل والتيار الاسمي ثم أعد ضبط الدائرة.':'Check for a short circuit, load size and protection rating, then correct the circuit.')
  }
  if(report.sources===0){
    add('warning',ar?'لا يوجد مصدر طاقة':'No power source',ar?'المكوّنات الموجودة لن تعمل بدون مصدر جهد.':'The components on the sheet cannot operate without a voltage source.',ar?'أضف بطارية أو مصدر DC/AC مناسب ثم وصّله بالدائرة.':'Add a suitable battery, DC source or AC source and connect it to the circuit.')
  }
  if(report.loads>0 && report.sources>0 && report.current<0.001 && !report.shortCircuit){
    if(openSwitches.length){
      const p=PARTS.find(x=>x.id===openSwitches[0].partId)
      add('warning',ar?'المسار مفتوح':'Circuit path is open',ar?`يوجد مفتاح/حماية في وضع OPEN${p?' ('+partName(p,lang)+')':''}.`:`A switch/protection device is OPEN${p?' ('+partName(p,lang)+')':''}.`,ar?'أغلق المفتاح إذا كان ذلك مقصوداً، ثم تأكد من وجود مسار عودة إلى المصدر.':'Close the switch if appropriate, then make sure there is a return path back to the source.')
    }else{
      add('warning',ar?'الدائرة غير مكتملة':'Circuit is incomplete',ar?'يوجد مصدر وحمل ولكن لا يوجد تيار. غالباً هناك طرف غير موصول أو لا يوجد مسار عودة.':'A source and load exist, but no current is flowing. A terminal is probably unconnected or the return path is missing.',ar?'تتبع المسار من +/L عبر الحمل ثم أعده إلى −/N.':'Trace the path from +/L through the load and back to −/N.')
    }
  }

  if(selectedComp && selectedPart){
    const terminals=getTerminals(selectedPart)
    const used=terminals.filter(t=>connected.has(`${selectedComp.uid}:${t.id}`))
    const simpleTwoTerminal=terminals.length===2
    if(simpleTwoTerminal && used.length===0){
      add('warning',ar?'المكوّن غير موصول':'Selected component is not connected',ar?`${partName(selectedPart,lang)} لا يحتوي على أي سلك متصل.`:`${partName(selectedPart,lang)} has no connected wires.`,ar?'وصّل الطرفين لإدخاله في مسار كهربائي كامل.':'Connect both terminals so it becomes part of a complete electrical path.')
    }else if(simpleTwoTerminal && used.length===1){
      add('warning',ar?'طرف واحد فقط موصول':'One terminal is still open',ar?'المكوّن موصول من جهة واحدة فقط، لذلك لا يمكن للتيار المرور خلاله.':'The component is connected on only one side, so current cannot flow through it.',ar?`وصّل الطرف ${terminals.find(t=>!connected.has(`${selectedComp.uid}:${t.id}`))?.label||''} لإكمال المسار.`:`Connect terminal ${terminals.find(t=>!connected.has(`${selectedComp.uid}:${t.id}`))?.label||''} to complete the circuit.`)
    }

    const params={...defaultParameters(selectedPart),...(selectedComp.params||{})}
    const rated=Number(params.ratedVoltage||params.coilVoltage||params.supplyVoltage||params.inputVoltage||0)
    const actual=Number(selectedResult?.voltage||0)
    if(rated>0 && actual>rated*1.25 && selectedPart.type!=='voltage'){
      add('danger',ar?'الجهد أعلى من القيمة الاسمية':'Voltage is too high',ar?`الجهد المقاس ${actual.toFixed(1)} V بينما القيمة الاسمية تقريباً ${rated} V.`:`Measured voltage is ${actual.toFixed(1)} V while the configured/rated value is about ${rated} V.`,ar?'استخدم مصدراً مناسباً أو غيّر إعداد المكوّن فقط إذا كانت مواصفاته الحقيقية تسمح بذلك.':'Use a suitable source voltage, or change the component rating only if the real device specification allows it.')
    }else if(rated>0 && actual>0 && actual<rated*.5 && selectedPart.type!=='voltage'){
      add('warning',ar?'الجهد منخفض':'Voltage is too low',ar?`المكوّن يستقبل ${actual.toFixed(1)} V فقط مقارنة بقيمة ${rated} V.`:`The component is receiving only ${actual.toFixed(1)} V compared with a ${rated} V configured/rated value.`,ar?'تحقق من المصدر والتوصيلات وهبوط الجهد والقيمة الاسمية.':'Check the source, connections, voltage drop and configured rating.')
    }
    if(selectedResult?.operating){
      add('success',ar?'المكوّن يعمل':'Component is operating',ar?`${partName(selectedPart,lang)} يعمل حالياً والقيم الحية تظهر في لوحة الفحص.`:`${partName(selectedPart,lang)} is operating and its live values are shown in the inspector.`,ar?'يمكنك تغيير الإعدادات ومراقبة الجهد والتيار والقدرة مباشرة.':'You can change its settings and watch voltage, current and power update live.')
    }
  }

  if(!advice.length){
    add('success',ar?'لا توجد مشكلة واضحة':'No obvious problem detected',ar?'الدائرة لا تعرض حالياً خطأ أساسياً. راقب القيم الحية وحالة كل مكوّن.':'The circuit currently shows no basic fault. Keep watching the live values and each component state.',ar?'شغّل SIMULATE لاختبار منطق الحماية والتشغيل.':'Press SIMULATE to test protection and operating logic.')
  }
  const priority={danger:0,warning:1,info:2,success:3}
  return advice.sort((a,b)=>priority[a.level]-priority[b.level]).slice(0,4)
}

function CircuitAssistant({advice,lang}){
  const ar=lang==='ar'
  return <section className="circuit-assistant">
    <div className="assistant-heading"><div className="assistant-icon"><Wrench/></div><div><b>{ar?'مساعد الدائرة':'Circuit Assistant'}</b><span>{ar?'يفحص التوصيل ويقترح الخطوة التالية':'Checks the circuit and suggests the next step'}</span></div></div>
    <div className="assistant-items">{advice.map((item,i)=><article key={`${item.title}-${i}`} className={`assistant-item ${item.level}`}><div className="assistant-severity">{item.level==='danger'||item.level==='warning'?<TriangleAlert/>:<Info/>}</div><div><b>{item.title}</b><p>{item.text}</p><small><strong>{ar?'ماذا تفعل:':'What to do:'}</strong> {item.action}</small></div></article>)}</div>
  </section>
}

function Simulator(props){
  const {lang}=useI18n(); const L=x=>tr(x,lang)
  const {components,wires,selected,setSelected,search,setSearch,category,setCategory,filtered,setView,onCanvasDrop,canvasRef,
    updateComponent,startWire,wireStart,removeSelected,simulating,setSimulating,zoom,setZoom,undo,redoAction,paletteOpen,setPaletteOpen,report,showToast,
    gridOn,setGridOn,gridSize,snap,tool,setTool,cancelWire,commit,sheets,activeSheet,switchSheet,newSheet,saveProject}=props
  const selectedComp=components.find(c=>c.uid===selected)
  const selectedPart=selectedComp?PARTS.find(p=>p.id===selectedComp.partId):null
  const selectedResult=selectedComp?report.componentResults?.[selectedComp.uid]:null
  const guidance=useMemo(()=>buildCircuitGuidance({components,wires,report,selectedComp,selectedPart,selectedResult,wireStart,lang}),[components,wires,report,selectedComp,selectedPart,selectedResult,wireStart,lang])
  const parameterFields=selectedPart?getParameterFields(selectedPart):[]
  const selectedParams=selectedPart?{...defaultParameters(selectedPart),...(selectedComp?.params||{})}:{}
  const setParameter=(key,value)=>{if(selectedComp)updateComponent(selectedComp.uid,{params:{...selectedParams,[key]:value}})}
  const [elapsed,setElapsed]=useState(0)
  const [inspectorOpen,setInspectorOpen]=useState(()=>typeof window==='undefined'?true:window.innerWidth>900)
  useEffect(()=>{if(!simulating)return;const id=setInterval(()=>setElapsed(v=>v+1),1000);return()=>clearInterval(id)},[simulating])
  useEffect(()=>{
    if(typeof window!=='undefined' && window.innerWidth<=900)setPaletteOpen(false)
  },[])
  useEffect(()=>{
    if(selected){setInspectorOpen(true);if(typeof window!=='undefined' && window.innerWidth<=900)setPaletteOpen(false)}
  },[selected])
  const elapsedText=`${String(Math.floor(elapsed/60)).padStart(2,'0')}:${String(elapsed%60).padStart(2,'0')}`
  const panStart=useRef(null)
  const onStagePointerDown=(e)=>{
    if(tool!=='pan'||(e.pointerType==='mouse'&&e.button!==0))return
    e.preventDefault();const el=e.currentTarget;panStart.current={x:e.clientX,y:e.clientY,left:el.scrollLeft,top:el.scrollTop}
    const move=(ev)=>{if(!panStart.current)return;el.scrollLeft=panStart.current.left-(ev.clientX-panStart.current.x);el.scrollTop=panStart.current.top-(ev.clientY-panStart.current.y)}
    const up=()=>{panStart.current=null;window.removeEventListener('pointermove',move);window.removeEventListener('pointerup',up);window.removeEventListener('pointercancel',up)}
    window.addEventListener('pointermove',move);window.addEventListener('pointerup',up);window.addEventListener('pointercancel',up)
  }
  const configureSelected=()=>{if(!selectedPart){setInspectorOpen(true);showToast(L('Select a component first'));return}setInspectorOpen(true);document.querySelector('.inspector')?.scrollTo({top:0,behavior:'smooth'});showToast(lang==='ar'?`${partName(selectedPart,lang)} جاهز للإعداد`:`${selectedPart.name} ready to configure`)}
  const addFromPalette=(part)=>{props.addPart(part);if(typeof window!=='undefined'&&window.innerWidth<=900){setPaletteOpen(false);setInspectorOpen(true)}}
  useEffect(()=>{
    const key=e=>{
      const tag=document.activeElement?.tagName
      if(['INPUT','SELECT','TEXTAREA'].includes(tag))return
      if(e.key==='Delete'&&selected){e.preventDefault();removeSelected()}
      if(e.key==='Escape'){cancelWire();setSelected(null);setTool('select')}
      if((e.ctrlKey||e.metaKey)&&e.key.toLowerCase()==='s'){e.preventDefault();saveProject()}
      if((e.ctrlKey||e.metaKey)&&e.key.toLowerCase()==='z'){e.preventDefault();e.shiftKey?redoAction():undo()}
      if(selected&&e.key.toLowerCase()==='r'){const c=components.find(x=>x.uid===selected);if(c)updateComponent(c.uid,{rotation:(c.rotation+90)%360})}
    }
    window.addEventListener('keydown',key);return()=>window.removeEventListener('keydown',key)
  },[selected,components,removeSelected,cancelWire,setSelected,setTool,saveProject,redoAction,undo,updateComponent])
  const reportStatus=stateName(report.status,lang)
  return <div className={`simulator ${simulating?'simulation-mode':''} tool-${tool}`} dir={lang==='ar'?'rtl':'ltr'}>
    <div className="sim-header"><div className="sim-title"><button className="icon-btn dark" onClick={()=>setView('dashboard')}><ArrowLeft/></button><div><b>{L('Universal Electrical Workbench')}</b><span>{L('Electrical • Interactive • Training')}</span></div></div><div className="sim-status"><span className={report.status==='Circuit energized'?'live-dot on':'live-dot'}></span>{reportStatus}</div><div className="sim-header-actions"><LanguageButton compact/><button className="icon-btn dark" title="Reset simulation timer" onClick={()=>setElapsed(0)}><Timer/></button><span className="timer">{simulating?elapsedText:L('LIVE')}</span><button className="icon-btn dark" onClick={()=>setView('dashboard')}><X/></button></div></div>
    <div className="sim-toolbar"><div className="toolbar-left"><button className="icon-btn accent" onClick={()=>setPaletteOpen(v=>!v)}>{paletteOpen?<PanelLeftClose/>:<PanelLeftOpen/>}</button><div className="sim-brand"><Zap/>ElectroLab</div><span className="demo-pill">LAB</span></div><button className={simulating?'run-btn stop':'run-btn'} onClick={()=>setSimulating(v=>!v)}>{simulating?<Square size={17}/>:<Play size={17}/>} {simulating?L('STOP'):L('SIMULATE')}</button><div className="toolbar-right"><button className="icon-btn" title="Undo" onClick={undo}><Undo2/></button><button className="icon-btn" title="Redo" onClick={redoAction}><Redo2/></button><button className="icon-btn" title="Save" onClick={saveProject}><Save/></button><button className="icon-btn" onClick={()=>setZoom(z=>Math.max(.45,z-.1))}><ZoomOut/></button><button className="zoom-value" onClick={()=>setZoom(1)}>{Math.round(zoom*100)}%</button><button className="icon-btn" onClick={()=>setZoom(z=>Math.min(1.6,z+.1))}><ZoomIn/></button></div></div>
    <div className="sheetbar"><div className="sheet-tabs">{sheets.map((sheet,i)=><button key={sheet.id} className={`tab-btn ${sheet.id===activeSheet?'active':''}`} onClick={()=>switchSheet(sheet.id)}>{i+1}. {lang==='ar'?`ورقة ${i+1}`:sheet.name}</button>)}</div><div className="sheet-actions"><button onClick={configureSelected}><Settings/>{L('Configure')}</button><button className={gridOn?'active':''} onClick={()=>setGridOn(v=>!v)}><Ruler/>{L('Grid')} {gridOn?'ON':'OFF'}</button><button onClick={()=>selected?removeSelected():showToast(L('Select a component first'))} className="danger"><Trash2/>{L('Delete')}</button><button onClick={newSheet}><Plus/>{L('New sheet')}</button></div></div>
    <div className="sim-body">
      {paletteOpen&&<aside className="palette"><div className="palette-title"><Menu/>{L('Component Library')}</div><div className="mini-search"><Search/><input value={search} onChange={e=>setSearch(e.target.value)} placeholder={L('Search parts...')}/></div><select className="cat-select" value={category} onChange={e=>setCategory(e.target.value)}><option value="All">{L('All')}</option>{CATEGORIES.map(c=><option key={c} value={c}>{categoryName(c,lang)}</option>)}</select><div className="wire-tools"><button className={tool==='wire'?'wire-active':''} onClick={()=>setTool('wire')}><Cable/>{L('WIRE')}</button><button className={tool==='select'?'wire-active':''} onClick={()=>{setTool('select');cancelWire()}}><MousePointer2/>{L('SELECT')}</button><button className={tool==='pan'?'wire-active':''} onClick={()=>{setTool('pan');cancelWire()}}><Move/>{L('PAN')}</button></div><div className="palette-scroll">{CATEGORIES.map(cat=>{const items=filtered.filter(p=>p.category===cat);if(!items.length)return null;return <div key={cat} className="palette-section"><h4>{categoryName(cat,lang)}</h4><div className="palette-grid">{items.map(p=><div key={p.id} className="palette-part" draggable onDragStart={e=>e.dataTransfer.setData('partId',p.id)} onDoubleClick={()=>addFromPalette(p)} title={L('Drag to canvas or double-click to add')}><div className={`tiny-symbol ${typeClass[p.type]||'passive'}`}><ElectricalSymbol part={p} compact/></div><span>{partName(p,lang)}</span><button className="palette-add-btn" onClick={e=>{e.stopPropagation();addFromPalette(p)}}><Plus/>{lang==='ar'?'إضافة':'Add'}</button></div>)}</div></div>})}</div></aside>}
      <div className="canvas-wrap"><div className="canvas-top-info"><span><Activity/> {components.length} {L('components')}</span><span><Cable/> {wires.length} {L('wires')}</span><span className={report.voltage>0?'energized':''}><Zap/> {formatValue(report.voltage,1)} V {L('detected')}</span><span className={report.current>.001?'energized':''}><Gauge/> {formatValue(report.current,3)} A</span></div><div className={`canvas-stage ${tool==='pan'?'pan-mode':''}`} ref={canvasRef} onDrop={onCanvasDrop} onDragOver={e=>e.preventDefault()} onPointerDown={onStagePointerDown} onClick={e=>{if(tool!=='pan' && !e.target.closest?.('.canvas-component'))setSelected(null)}}><div className={`canvas-world ${gridOn?'grid-on':'grid-off'}`} style={{transform:`scale(${zoom})`}}>
        <svg className="wire-layer" width="1800" height="1000">{wires.map(w=>{const ae=typeof w.a==='string'?{uid:w.a,port:'2'}:w.a,be=typeof w.b==='string'?{uid:w.b,port:'1'}:w.b;const a=components.find(c=>c.uid===ae.uid),b=components.find(c=>c.uid===be.uid);if(!a||!b)return null;const ap=PARTS.find(p=>p.id===a.partId),bp=PARTS.find(p=>p.id===b.partId);if(!ap||!bp)return null;const at=getTerminals(ap).find(t=>t.id===ae.port)||getTerminals(ap)[0],bt=getTerminals(bp).find(t=>t.id===be.port)||getTerminals(bp)[0];const A=terminalPosition(a,ap,at),B=terminalPosition(b,bp,bt),mx=(A.x+B.x)/2,wr=report.wireResults?.[w.uid];const cls=`wire ${wr?.energized?'live':''} ${wr?.returnPath?'return-path':''} ${report.shortCircuit?'fault':''}`;return <path key={w.uid} className={cls} d={`M ${A.x} ${A.y} C ${mx} ${A.y}, ${mx} ${B.y}, ${B.x} ${B.y}`}/>})}</svg>
        <div className="sheet-frame"><div className="coord top">1&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;2&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;3&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;4&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;5&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;6&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;7&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;8</div><div className="coord left">A<br/><br/><br/>B<br/><br/><br/>C<br/><br/><br/>D</div></div>
        {components.map(c=><CanvasComponent key={c.uid} c={c} selected={selected===c.uid} setSelected={setSelected} updateComponent={updateComponent} startWire={startWire} wireStart={wireStart} result={report.componentResults?.[c.uid]} zoom={zoom} tripped={report.trips?.some(t=>t.uid===c.uid)} tool={tool} snap={snap} commit={commit}/>)}
        {!components.length&&<div className="empty-canvas"><CircuitBoard/><h3>{L('Build your first circuit')}</h3><p>{L('Drag components from the library, then click connection points to wire them.')}</p></div>}
      </div></div><div className="statusbar"><span>X: 0 mm</span><span>Y: 0 mm</span><span>{L('Grid')}: {gridOn?`${gridSize} mm`:'OFF'}</span><span>{L('State')}: {tool.toUpperCase()}</span><span>{simulating?L('Simulation + protection active'):L('Live electrical preview')}</span></div></div>
      <aside className={`inspector ${inspectorOpen?'mobile-open':''}`}><div className="inspector-head"><b>{selectedPart?L('Component Inspector'):L('Live Test Bench')}</b><div className="inspector-head-actions"><SlidersHorizontal/><button className="mobile-inspector-close" onClick={()=>setInspectorOpen(false)} aria-label={lang==='ar'?'إغلاق':'Close'}><X/></button></div></div><CircuitAssistant advice={guidance} lang={lang}/>{selectedPart?<>
        <div className={`inspect-symbol ${typeClass[selectedPart.type]||'passive'} ${selectedResult?.operating?'inspect-active':''}`}><ElectricalSymbol part={selectedPart} state={selectedComp.state} active={Boolean(selectedResult?.operating)} level={selectedResult?.level||0}/></div><div className="inspect-title-row"><div><span className="selected-kicker">{L('Selected component')}</span><h3>{partName(selectedPart,lang)}</h3><span className="category-tag">{categoryName(selectedPart.category,lang)}</span></div><span className={`state-badge ${selectedResult?.operating?'on':''}`}>{stateName(selectedResult?.stateLabel||'IDLE',lang)}</span></div>
        <label>{L('Component tag / reference')}<input value={selectedComp.tag??selectedPart.symbol} onChange={e=>updateComponent(selectedComp.uid,{tag:e.target.value})}/></label><label>{L('Displayed rating / value')}<input value={selectedComp.value??selectedPart.rating} onChange={e=>updateComponent(selectedComp.uid,{value:e.target.value})}/></label><div className="rating-note">{L('Library default')}: <b>{selectedPart.rating}</b></div>
        {parameterFields.length>0&&<div className="settings-group"><div className="settings-title"><Settings/> {L('Electrical settings')}</div>{parameterFields.map(field=>field.type==='boolean'?<label key={field.key}>{fieldName(field.label,lang)}<select value={selectedParams[field.key]?'true':'false'} onChange={e=>setParameter(field.key,e.target.value==='true')}><option value="false">{L('Inactive / OFF')}</option><option value="true">{L('Active / ON')}</option></select></label>:<label key={field.key}>{fieldName(field.label,lang)}<div className="input-unit"><input type="number" min={field.min} max={field.max} step={field.step||'any'} value={selectedParams[field.key]??''} onChange={e=>setParameter(field.key,e.target.value===''?'':Number(e.target.value))}/><span>{field.unit}</span></div></label>)}</div>}
        <label>{L('Rotation')}<select value={selectedComp.rotation} onChange={e=>updateComponent(selectedComp.uid,{rotation:Number(e.target.value)})}><option value="0">0°</option><option value="90">90°</option><option value="180">180°</option><option value="270">270°</option></select></label>
        {(selectedPart.type==='switch'||selectedPart.type==='protection')&&<label>{L('Contact / operating state')}<select value={selectedComp.state} onChange={e=>updateComponent(selectedComp.uid,{state:e.target.value})}>{['contactor','control-relay','timer-relay','latching-relay','safety-relay'].includes(selectedPart.id)&&<option value="auto">{L('Automatic from coil')}</option>}{['switch-spdt','selector','two-way'].includes(selectedPart.id)&&<><option value="closed">COM → NO</option><option value="nc">COM → NC</option></>}{!['switch-spdt','selector','two-way'].includes(selectedPart.id)&&<option value="closed">{L('Closed / ON')}</option>}<option value="open">{L('Open / OFF')}</option></select></label>}
        <div className="live-reading four"><span>{L('Voltage')}</span><b>{formatValue(selectedResult?.voltage||0,2)} V</b><span>{L('Current')}</span><b>{formatValue(Math.abs(selectedResult?.current||0),3)} A</b><span>{L('Power')}</span><b>{formatValue(selectedResult?.power||0,2)} W</b><span>{L('State')}</span><b>{stateName(selectedResult?.stateLabel||'IDLE',lang)}</b></div>
        {selectedResult&&<div className="terminal-readings"><span>{L('Terminal voltages')}</span>{Object.entries(selectedResult.terminalVoltages||{}).map(([terminal,v])=><div key={terminal}><b>{terminal}</b><em>{formatValue(v,2)} V</em></div>)}</div>}
        <div className="terminal-list"><span>{L('Connect a wire to terminal')}</span>{getTerminals(selectedPart).map(t=><button key={t.id} onClick={()=>startWire(selectedComp.uid,t.id)} className={wireStart?.uid===selectedComp.uid&&wireStart?.port===t.id?'active':''}>{t.label}</button>)}</div><div className="inspect-actions"><button onClick={()=>{const t=getTerminals(selectedPart)[0];startWire(selectedComp.uid,t.id)}} className={wireStart?.uid===selectedComp.uid?'active':''}><Cable/>{L('Start wire')}</button><button onClick={()=>updateComponent(selectedComp.uid,{rotation:(selectedComp.rotation+90)%360})}><RotateCw/>{L('Rotate')}</button></div><div className="tip"><Info/>{L('Values recalculate instantly when you change a setting or connect/disconnect a terminal.')}</div>
      </>:<><div className="bench-status"><span className={report.status==='Circuit energized'?'bench-dot on':'bench-dot'}></span><div><b>{reportStatus}</b><small>{simulating?L('Protection and operating logic are active.'):L('Live preview is active. Press SIMULATE to enable protection trips.')}</small></div></div><div className="meter-card"><span>{L('Maximum circuit voltage')}</span><b>{formatValue(report.voltage,1)} <small>V</small></b><div className="meter-line"><i style={{width:`${metricPct(report.voltage,400)}%`}}></i></div></div><div className="meter-card"><span>{L('Source current')}</span><b>{formatValue(report.current,3)} <small>A</small></b><div className="meter-line"><i style={{width:`${metricPct(report.current,50)}%`}}></i></div></div><div className="meter-card"><span>{L('Load power')}</span><b>{formatValue(report.watts,1)} <small>W</small></b><div className="meter-line"><i style={{width:`${metricPct(report.watts,5000)}%`}}></i></div></div><div className="diagnostic"><h4>{L('Diagnostics')}</h4><p><span>{L('Sources')}</span><b>{report.sources}</b></p><p><span>{L('Loads')}</span><b>{report.loads}</b></p><p><span>{L('Active loads')}</span><b>{report.activeLoads||0}</b></p><p><span>{L('Protection devices')}</span><b>{report.protections}</b></p><p><span>{L('Meters')}</span><b>{report.meters}</b></p></div><div className={`tip warning ${report.shortCircuit?'danger-tip':''}`}><TriangleAlert/>{report.shortCircuit?L('Short circuit detected. Disconnect the source or open a protection device.'):report.trips?.length?(lang==='ar'?`تم فصل ${report.trips.length} جهاز حماية بسبب تجاوز التيار المضبوط.`:`${report.trips.length} protection device(s) tripped above their configured rating.`):L('The analyser updates immediately as you add parts, edit ratings and connect wires.')}</div></>}
      </aside>
    </div>
    <nav className="mobile-sim-dock" aria-label={lang==='ar'?'أدوات المحاكي':'Simulator tools'}>
      <button className={paletteOpen?'active':''} onClick={()=>{setPaletteOpen(v=>!v);setInspectorOpen(false)}}><Library/><span>{lang==='ar'?'المكونات':'Parts'}</span></button>
      <button className={tool==='select'?'active':''} onClick={()=>{setTool('select');cancelWire();setPaletteOpen(false)}}><MousePointer2/><span>{lang==='ar'?'تحديد':'Select'}</span></button>
      <button className={inspectorOpen?'active':''} onClick={()=>{setInspectorOpen(v=>!v);setPaletteOpen(false)}}><Wrench/><span>{lang==='ar'?'المساعد':'Guide'}</span><i>{guidance.filter(x=>x.level==='danger'||x.level==='warning').length||''}</i></button>
      <button className={simulating?'active run':''} onClick={()=>setSimulating(v=>!v)}>{simulating?<Square/>:<Play/>}<span>{simulating?(lang==='ar'?'إيقاف':'Stop'):(lang==='ar'?'تشغيل':'Run')}</span></button>
    </nav>
  </div>
}

function CanvasComponent({c,selected,setSelected,updateComponent,startWire,wireStart,result,zoom,tripped,tool,snap,commit}){
  const {lang}=useI18n(); const p=PARTS.find(x=>x.id===c.partId); const dragging=useRef(null); const terminals=getTerminals(p)
  const isToggleable=p.type==='switch'||p.type==='protection'; const isLamp=['lamp','led-lamp','pilot-red','pilot-green','indicating-light','incandescent-lamp','fluorescent-lamp','emergency-light'].includes(p.id); const isMotor=['motor-1ph','motor-3ph','dc-motor','servo','stepper','machine-general','induction-motor','synchronous-motor','universal-motor','geared-motor','pump-motor','ceiling-fan','exhaust-fan','compressor-load'].includes(p.id)
  const onDown=e=>{
    if((e.pointerType==='mouse'&&e.button!==0)||tool==='pan')return
    e.stopPropagation()
    setSelected(c.uid)
    // Mouse and touch both select. Only SELECT mode starts dragging.
    if(tool!=='select')return
    dragging.current={sx:e.clientX,sy:e.clientY,x:c.x,y:c.y,committed:false}
    const move=ev=>{
      if(!dragging.current)return
      const dx=(ev.clientX-dragging.current.sx)/zoom,dy=(ev.clientY-dragging.current.sy)/zoom
      if(!dragging.current.committed && Math.hypot(dx,dy)>3){commit?.();dragging.current.committed=true}
      if(dragging.current.committed){ev.preventDefault?.();updateComponent(c.uid,{x:snap(dragging.current.x+dx),y:snap(dragging.current.y+dy)})}
    }
    const up=()=>{dragging.current=null;window.removeEventListener('pointermove',move);window.removeEventListener('pointerup',up);window.removeEventListener('pointercancel',up)}
    window.addEventListener('pointermove',move,{passive:false});window.addEventListener('pointerup',up);window.addEventListener('pointercancel',up)
  }
  const toggle=e=>{e.stopPropagation();if(!isToggleable)return;if(['contactor','control-relay','timer-relay','latching-relay','safety-relay'].includes(p.id))updateComponent(c.uid,{state:c.state==='auto'?'open':'auto'});else if(['switch-spdt','selector','two-way'].includes(p.id))updateComponent(c.uid,{state:c.state==='closed'?'nc':'closed'});else updateComponent(c.uid,{state:c.state==='open'?'closed':'open'})}
  const meter=p.type==='meter'?meterDisplay(p,result,50):null; const active=Boolean(result?.operating)
  const classes=['canvas-component',selected?'selected':'',result?.energized?'powered':'',active?'device-operating':'',isLamp&&active?'lamp-on':'',isMotor&&active?'motor-on':'',tripped?'tripped':''].filter(Boolean).join(' ')
  const label=tripped?stateName('TRIPPED',lang):stateName(result?.stateLabel||'IDLE',lang)
  return <div className={classes} data-component-id={c.uid} title={lang==='ar'?'انقر بالزر الأيسر للتحديد والتعديل':'Left-click to select and edit'} style={{left:c.x,top:c.y,transform:`rotate(${c.rotation}deg)`}} onPointerDown={onDown} onClick={e=>{e.stopPropagation();if(e.button===0)setSelected(c.uid)}} onDoubleClick={toggle}>
    <span className={`device-status-led ${tripped?'trip':active?'on':result?.energized?'powered':''}`} title={label}></span><span className={`component-state-chip ${tripped?'trip':active?'on':result?.energized?'powered':''}`}>{label}</span><div className={`canvas-symbol ${typeClass[p.type]||'passive'}`}><ElectricalSymbol part={p} state={c.state} active={active} level={result?.level||0}/></div><div className="canvas-label"><b>{c.tag||partName(p,lang)}</b><span>{meter?`${Number.isFinite(meter.value)?meter.value.toFixed(meter.unit==='A'?3:2):'∞'} ${meter.unit}`:c.value}</span><em className={active?'state-ok':result?.energized?'state-powered':'state-idle'}>{label}</em></div>{terminals.map(t=><button key={t.id} title={`${t.label} terminal`} className={`port terminal-port ${wireStart?.uid===c.uid&&wireStart?.port===t.id?'active':''}`} style={{left:`${t.x*100}%`,top:`${t.y*100}%`}} onPointerDown={e=>{e.stopPropagation();if(e.pointerType!=='mouse'||e.button===0)setSelected(c.uid)}} onClick={e=>{e.stopPropagation();setSelected(c.uid);startWire(c.uid,t.id)}}><span>{t.label}</span></button>)}
  </div>
}

createRoot(document.getElementById('root')).render(<App/>)
