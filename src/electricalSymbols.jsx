import React from 'react'

const W = 120
const H = 72

export { getTerminals, terminalPosition } from './electricalModel.js'
import { getTerminals } from './electricalModel.js'


function BaseSvg({children,className=''}){
  return <svg className={`electrical-symbol-svg ${className}`} viewBox={`0 0 ${W} ${H}`} role="img" aria-hidden="true">
    {children}
  </svg>
}

const L = ({x1=0,y1=36,x2=120,y2=36,...p}) => <line x1={x1} y1={y1} x2={x2} y2={y2} {...p}/>
const C = ({cx=60,cy=36,r=18,...p}) => <circle cx={cx} cy={cy} r={r} {...p}/>

function Switch({closed=false,nc=false}){
  return <BaseSvg><L x2="38"/><L x1="82"/><circle cx="38" cy="36" r="3"/><circle cx="82" cy="36" r="3"/>
    <line x1="40" y1="34" x2="80" y2={closed?'36':nc?'31':'18'} />
  </BaseSvg>
}
function PushButton({nc=false}){
  return <BaseSvg><L x2="38"/><L x1="82"/><circle cx="38" cy="36" r="3"/><circle cx="82" cy="36" r="3"/>
    <L x1="40" y1={nc?'36':'26'} x2="80" y2={nc?'36':'26'}/><L x1="60" y1="7" x2="60" y2="22"/><L x1="50" y1="7" x2="70" y2="7"/>
  </BaseSvg>
}
function RelayCoil({timer=false}){
  return <BaseSvg><L x2="36"/><L x1="84"/><rect x="36" y="20" width="48" height="32" rx="5"/>{timer&&<text x="60" y="41" textAnchor="middle" fontSize="15">t</text>}</BaseSvg>
}
function Transformer({auto=false,three=false}){
  return <BaseSvg>
    <L x2="27" y1="20" y2="20"/><L x2="27" y1="52" y2="52"/><L x1="93" y1="20" y2="20"/><L x1="93" y1="52" y2="52"/>
    <path d="M28 18 q7 -12 14 0 q7 12 14 0 q7 -12 14 0"/>
    <path d="M50 54 q7 -12 14 0 q7 12 14 0 q7 -12 14 0"/>
    {!auto&&<><L x1="60" y1="8" x2="60" y2="64"/><L x1="64" y1="8" x2="64" y2="64"/></>}
    {three&&<text x="60" y="69" textAnchor="middle" fontSize="8">3W</text>}
  </BaseSvg>
}
function Meter({text}){return <BaseSvg><L x2="38"/><L x1="82"/><C r="20"/><text x="60" y="42" textAnchor="middle" fontSize="18" fontWeight="700">{text}</text></BaseSvg>}
function Motor({text='M',active=false}){return <BaseSvg className={active?'motor-svg active':'motor-svg'}><L x2="37"/><L x1="83"/><C r="22"/><g className="motor-rotor"><line x1="60" y1="22" x2="60" y2="50"/><line x1="46" y1="36" x2="74" y2="36"/></g><text x="60" y="42" textAnchor="middle" fontSize="15" fontWeight="700">{text}</text></BaseSvg>}
function Resistor(){return <BaseSvg><L x2="35"/><L x1="85"/><rect x="35" y="25" width="50" height="22"/></BaseSvg>}
function Capacitor(){return <BaseSvg><L x2="54"/><L x1="66"/><L x1="54" y1="20" x2="54" y2="52"/><L x1="66" y1="20" x2="66" y2="52"/></BaseSvg>}
function Inductor(){return <BaseSvg><L x2="30"/><L x1="90"/><path d="M30 36 c0-18 15-18 15 0 c0-18 15-18 15 0 c0-18 15-18 15 0 c0-18 15-18 15 0"/></BaseSvg>}
function Diode({zener=false,led=false}){return <BaseSvg><L x2="39"/><L x1="82"/><path d="M40 20 L70 36 L40 52 Z"/><L x1="73" y1="20" x2="73" y2="52"/>{zener&&<path d="M68 20 l10 -5 M68 52 l10 5"/>}{led&&<><path d="M77 22 l13 -11"/><path d="M87 11 h-6 M90 11 v6"/><path d="M81 31 l13 -11"/></>}</BaseSvg>}
function Lamp({active=false}){return <BaseSvg className={active?'lamp-svg active':'lamp-svg'}><L x2="39"/><L x1="81"/><C r="20" className="lamp-bulb"/><path d="M47 23 L73 49 M73 23 L47 49"/><g className="lamp-rays"><L x1="60" y1="3" x2="60" y2="10"/><L x1="60" y1="62" x2="60" y2="69"/><L x1="27" y1="36" x2="34" y2="36"/><L x1="86" y1="36" x2="93" y2="36"/></g></BaseSvg>}
function Fuse(){return <BaseSvg><L x2="34"/><L x1="86"/><rect x="34" y="29" width="52" height="14" rx="2"/><L x1="39" x2="81"/></BaseSvg>}
function Breaker(){return <BaseSvg><L x2="35"/><L x1="85"/><circle cx="35" cy="36" r="3"/><circle cx="85" cy="36" r="3"/><path d="M39 34 Q60 15 81 34"/></BaseSvg>}
function Ground({chassis=false}){return <BaseSvg><L x1="60" y1="0" x2="60" y2="34"/>{chassis?<><L x1="38" y1="38" x2="82" y2="38"/><path d="M43 45 l-8 8 M55 45 l-8 8 M67 45 l-8 8 M79 45 l-8 8"/></>:<><L x1="38" y1="38" x2="82" y2="38"/><L x1="44" y1="45" x2="76" y2="45"/><L x1="51" y1="52" x2="69" y2="52"/></>}</BaseSvg>}
function Battery(){return <BaseSvg><L x2="50"/><L x1="70"/><L x1="52" y1="17" x2="52" y2="55"/><L x1="68" y1="25" x2="68" y2="47"/><text x="48" y="14" fontSize="10">+</text><text x="69" y="18" fontSize="10">−</text></BaseSvg>}
function ACSource(){return <BaseSvg><L x2="38"/><L x1="82"/><C r="20"/><path d="M45 36 q7 -12 15 0 q8 12 15 0"/></BaseSvg>}
function DCSource(){return <BaseSvg><L x2="38"/><L x1="82"/><C r="20"/><text x="60" y="31" textAnchor="middle" fontSize="12">+</text><text x="60" y="48" textAnchor="middle" fontSize="13">−</text></BaseSvg>}
function ThreePhase({kind='3Φ'}){return <BaseSvg><L x2="34"/><L x1="86"/><C r="22"/><text x="60" y="42" textAnchor="middle" fontSize="14" fontWeight="700">{kind}</text></BaseSvg>}
function Rectifier(){return <BaseSvg><rect x="33" y="15" width="54" height="42" rx="3"/><text x="60" y="32" textAnchor="middle" fontSize="11">~ → +</text><text x="60" y="47" textAnchor="middle" fontSize="10">BRIDGE</text></BaseSvg>}
function Block({label}){return <BaseSvg><L x2="29"/><L x1="91"/><rect x="29" y="15" width="62" height="42" rx="5"/><text x="60" y="40" textAnchor="middle" fontSize="11" fontWeight="700">{label}</text></BaseSvg>}
function Terminal(){return <BaseSvg><L x2="56"/><L x1="64"/><C r="5"/></BaseSvg>}
function Junction(){return <BaseSvg><L/><C r="4"/></BaseSvg>}
function Busbar(){return <BaseSvg><L x1="15" x2="105"/><L x1="60" y1="10" x2="60" y2="62"/></BaseSvg>}
function Arrester({mov=false}){return <BaseSvg><L x2="44"/><L x1="76"/><path d={mov?'M44 36 h10 l4 -10 l6 20 l4 -10 h8':'M44 36 h9 M67 36 h9 M53 28 l14 16'}/></BaseSvg>}
function Bell({kind='BELL',active=false}){return <BaseSvg className={active?'bell-svg active':'bell-svg'}><L x2="34"/><path d="M34 46 Q60 10 86 46 Z"/><L x1="86"/><text x="60" y="63" textAnchor="middle" fontSize="8">{kind}</text></BaseSvg>}
function Contact(){return <Switch closed={false}/>}

function Bjt({pnp=false}){
  return <BaseSvg>
    <L x1="10" y1="36" x2="48" y2="36"/><L x1="48" y1="18" x2="48" y2="54"/>
    <L x1="48" y1="26" x2="88" y2="12"/><L x1="48" y1="46" x2="88" y2="60"/>
    <L x1="88" y1="12" x2="112" y2="12"/><L x1="88" y1="60" x2="112" y2="60"/>
    {pnp?<path d="M72 51 l-10 -1 l6 -8 Z" fill="currentColor"/>:<path d="M68 43 l10 1 l-6 8 Z" fill="currentColor"/>}
    <text x="19" y="30" fontSize="8">B</text><text x="94" y="9" fontSize="8">C</text><text x="94" y="70" fontSize="8">E</text>
  </BaseSvg>
}
function Mosfet({p=false}){
  return <BaseSvg>
    <L x1="10" y1="36" x2="38" y2="36"/><L x1="42" y1="18" x2="42" y2="54"/>
    <L x1="50" y1="20" x2="50" y2="52"/><L x1="50" y1="26" x2="84" y2="14"/><L x1="50" y1="46" x2="84" y2="58"/>
    <L x1="84" y1="14" x2="112" y2="14"/><L x1="84" y1="58" x2="112" y2="58"/>
    <path d={p?'M65 36 l10 -6 v12 Z':'M75 36 l-10 -6 v12 Z'} fill="currentColor"/>
    <text x="16" y="31" fontSize="8">G</text><text x="95" y="11" fontSize="8">D</text><text x="95" y="69" fontSize="8">S</text>
  </BaseSvg>
}
function Thyristor({triac=false}){
  return <BaseSvg>
    <L x2="38" y1="28" y2="28"/><L x1="82" y1="28" y2="28"/>
    {triac?<><path d="M40 16 L66 28 L40 40 Z"/><path d="M80 16 L54 28 L80 40 Z"/></>:<><path d="M40 14 L70 28 L40 42 Z"/><L x1="73" y1="14" x2="73" y2="42"/></>}
    <L x1="60" y1="70" x2="60" y2="47"/><L x1="60" y1="47" x2="72" y2="38"/>
    <text x="56" y="69" fontSize="8">G</text>
  </BaseSvg>
}
function OpAmp(){return <BaseSvg><path d="M35 12 L88 36 L35 60 Z"/><L x2="35" y1="24" y2="24"/><L x2="35" y1="48" y2="48"/><L x1="88" x2="118"/><text x="23" y="27" fontSize="9">+</text><text x="23" y="51" fontSize="9">−</text></BaseSvg>}
function LogicGate({kind='AND'}){
  if(kind==='NOT') return <BaseSvg><L x2="40"/><path d="M40 18 L82 36 L40 54 Z"/><C cx="87" cy="36" r="5"/><L x1="92"/></BaseSvg>
  return <BaseSvg><L x2="35" y1="25" y2="25"/><L x2="35" y1="47" y2="47"/><path d={kind==='AND'?'M35 16 H58 Q88 16 88 36 Q88 56 58 56 H35 Z':'M35 16 Q51 36 35 56 Q65 61 89 36 Q65 11 35 16 Z'}/><L x1="89"/></BaseSvg>
}
function DeviceFace({label='DEV',sub='',active=false}){
  return <BaseSvg className={active?'device-face active':'device-face'}>
    <L x2="22"/><L x1="98"/>
    <rect x="22" y="9" width="76" height="54" rx="6" className="device-body"/>
    <rect x="31" y="17" width="40" height="14" rx="2" className="device-display"/>
    <text x="51" y="27" textAnchor="middle" fontSize="8" fontWeight="700">{label}</text>
    <circle cx="84" cy="23" r="4" className="device-led-svg"/>
    <path d="M33 44 H87 M33 51 H72" opacity=".55"/>
    {sub&&<text x="60" y="60" textAnchor="middle" fontSize="6.5">{sub}</text>}
  </BaseSvg>
}
function SolarPanel({active=false}){
  return <BaseSvg className={active?'solar-svg active':'solar-svg'}><L x2="21"/><L x1="99"/><rect x="23" y="12" width="74" height="48" rx="3" className="solar-panel"/><path d="M41 12 V60 M60 12 V60 M79 12 V60 M23 28 H97 M23 44 H97"/><circle cx="105" cy="12" r="5" className="sun-core"/><path d="M105 2 V0 M105 24 V22 M95 12 H92 M118 12 H115"/></BaseSvg>
}
function FanSymbol({active=false}){
  return <BaseSvg className={active?'fan-svg active':'fan-svg'}><L x2="34"/><L x1="86"/><C r="25"/><g className="fan-rotor"><circle cx="60" cy="36" r="4"/><path d="M60 32 C49 18 38 18 40 29 C42 38 51 39 60 36 M64 36 C78 26 88 29 83 39 C79 47 70 43 60 36 M60 40 C57 55 47 61 42 51 C38 43 48 38 60 36"/></g></BaseSvg>
}
function PumpSymbol({active=false}){
  return <BaseSvg className={active?'pump-svg active':'pump-svg'}><L x2="27"/><L x1="95"/><circle cx="56" cy="36" r="24"/><path d="M56 24 C72 25 76 39 65 47 C58 52 47 48 45 40 C43 32 48 26 56 24 Z"/><path d="M80 27 H96 V45 H80"/><text x="55" y="40" textAnchor="middle" fontSize="8">PUMP</text></BaseSvg>
}
function HeaterSymbol({active=false}){
  return <BaseSvg className={active?'heater-svg active':'heater-svg'}><L x2="25"/><L x1="95"/><rect x="25" y="17" width="70" height="38" rx="4"/><path d="M32 42 C38 21 44 55 50 30 C56 8 62 60 68 30 C74 8 80 55 88 28"/><path className="heat-wave" d="M43 11 q4 -8 8 0 M60 11 q4 -8 8 0 M77 11 q4 -8 8 0"/></BaseSvg>
}
function SolenoidSymbol({active=false,valve=false}){
  return <BaseSvg className={active?'solenoid-svg active':'solenoid-svg'}><L x2="29"/><L x1="91"/><rect x="30" y="17" width="38" height="38" rx="4"/><path d="M35 45 q5 -24 10 0 q5 -24 10 0 q5 -24 10 0"/>{valve?<><path d="M72 22 L88 36 L72 50 Z M88 22 L72 36 L88 50 Z"/></>:<><path d="M69 36 H88" className="plunger"/><rect x="86" y="28" width="7" height="16" className="plunger"/></>}</BaseSvg>
}
function SocketSymbol({schuko=false}){
  return <BaseSvg><L x2="31"/><L x1="89"/><rect x="31" y="11" width="58" height="50" rx="10"/><circle cx="48" cy="34" r="5"/><circle cx="72" cy="34" r="5"/>{schuko&&<><path d="M34 20 h8 M78 20 h8 M34 52 h8 M78 52 h8"/></>}<path d="M56 49 h8"/></BaseSvg>
}
function SensorFace({label='S',active=false}){
  return <BaseSvg className={active?'sensor-svg active':'sensor-svg'}><L x2="28"/><L x1="92"/><rect x="28" y="19" width="55" height="34" rx="8"/><circle cx="72" cy="36" r="7" className="sensor-lens"/><path d="M84 29 q12 7 0 14 M89 25 q20 11 0 22" opacity=".5"/><text x="42" y="40" textAnchor="middle" fontSize="8" fontWeight="700">{label}</text></BaseSvg>
}
function BreakerDevice({label='CB',active=false}){
  return <BaseSvg className={active?'breaker-device active':'breaker-device'}><L x2="27"/><L x1="93"/><rect x="27" y="8" width="66" height="56" rx="5" className="breaker-body"/><rect x="38" y="15" width="44" height="12" rx="2"/><text x="60" y="24" textAnchor="middle" fontSize="7" fontWeight="700">{label}</text><rect x="50" y="33" width="20" height="22" rx="6" className="breaker-toggle"/><path d="M60 35 v13"/><circle cx="82" cy="54" r="3" className="device-led-svg"/></BaseSvg>
}
function ContactorDevice({label='KM',active=false,poles=3}){
  return <BaseSvg className={active?'contactor-device active':'contactor-device'}><rect x="23" y="7" width="74" height="58" rx="5"/><rect x="35" y="28" width="50" height="18" rx="3"/><text x="60" y="40" textAnchor="middle" fontSize="9" fontWeight="700">{label}</text>{Array.from({length:poles}).map((_,i)=>{const x=32+i*(56/Math.max(1,poles-1));return <g key={i}><line x1={x} y1="8" x2={x} y2="20"/><line x1={x} y1="52" x2={x} y2="64"/></g>})}<circle cx="90" cy="18" r="3" className="device-led-svg"/></BaseSvg>
}
function TerminalBlockSymbol({fused=false,disconnect=false,earth=false}){
  return <BaseSvg><L x2="23"/><L x1="97"/><rect x="24" y="21" width="72" height="30" rx="4" className="terminal-body"/><circle cx="38" cy="36" r="6"/><circle cx="82" cy="36" r="6"/><path d="M44 36 H76"/>{fused&&<rect x="52" y="30" width="16" height="12"/>}{disconnect&&<path d="M51 38 l17 -11"/>}{earth&&<path d="M60 43 v9 M52 52 h16 M55 57 h10"/>}</BaseSvg>
}
function Thermistor({kind='NTC'}){return <BaseSvg><L x2="33"/><L x1="87"/><rect x="33" y="25" width="54" height="22"/><path d="M43 53 L78 18"/><text x="60" y="16" textAnchor="middle" fontSize="8">{kind}</text></BaseSvg>}
function Varistor(){return <BaseSvg><L x2="34"/><L x1="86"/><rect x="34" y="24" width="52" height="24"/><path d="M42 52 L77 17 M73 17 h8 v8"/><text x="60" y="41" textAnchor="middle" fontSize="8">MOV</text></BaseSvg>}
function PhotoDiode(){return <BaseSvg><L x2="39"/><L x1="82"/><path d="M40 20 L70 36 L40 52 Z"/><L x1="73" y1="20" x2="73" y2="52"/><path d="M28 12 l15 12 M35 7 l15 12"/></BaseSvg>}
function Optocoupler({active=false}){return <BaseSvg className={active?'opto-svg active':'opto-svg'}><rect x="22" y="10" width="76" height="52" rx="5" strokeDasharray="4 3"/><path d="M34 24 L51 36 L34 48 Z"/><L x1="54" y1="23" x2="54" y2="49"/><path d="M60 30 l10 5 M60 42 l10 -5"/><path d="M74 24 v24 M74 30 l13 -7 M74 42 l13 7"/></BaseSvg>}
function GenericSemiconductor({label}){return <Block label={label}/>} 

export function ElectricalSymbol({part,state='closed',compact=false,active=false,level=0}){
  const id = part?.id || ''
  let el
  if(['dc-source','battery','battery-24v'].includes(id)) el = ['battery','battery-24v'].includes(id)?<Battery/>:<DCSource/>
  else if(['bench-dc-supply','dual-dc-supply','usb-supply'].includes(id)) el=<DeviceFace label={part.symbol} sub={part.rating} active={active}/>
  else if(['solar','pv-string'].includes(id)) el=<SolarPanel active={active}/>
  else if(['ac-source','generator'].includes(id)) el=<ACSource/>
  else if(id==='ups') el=<DeviceFace label="UPS" sub={part.rating} active={active}/>
  else if(id==='three-phase') el=<ThreePhase/>
  else if(id==='three-phase-delta') el=<ThreePhase kind="Δ"/>
  else if(id==='three-phase-wye') el=<ThreePhase kind="Y"/>
  else if(id==='three-phase-wye-grounded') el=<ThreePhase kind="Y⏚"/>
  else if(id==='three-phase-open-delta') el=<ThreePhase kind="V"/>
  else if(['switch-spst','wall-switch','isolator','knife-switch','line-switch','relay-contact-no','timed-contact-no','key-switch','foot-switch'].includes(id)) el=<Switch closed={state==='closed'}/>
  else if(['relay-contact-nc','timed-contact-nc'].includes(id)) el=<Switch closed={state!=='open'} nc/>
  else if(['push-no','momentary-no'].includes(id)) el=<PushButton/>
  else if(['push-nc','emergency-stop','momentary-nc'].includes(id)) el=<PushButton nc/>
  else if(['switch-spdt','two-way','selector','rotary-selector'].includes(id)) el=<Switch closed={state==='closed'}/>
  else if(['limit-switch','float-switch','flow-switch','level-switch-no','level-switch-nc','pressure-switch','pressure-vac-switch-no','pressure-vac-switch-nc','temperature-switch','torque-switch'].includes(id)) el=<Switch closed={state==='closed'}/>
  else if(id==='contactor') el=<ContactorDevice label="KM" active={active}/>
  else if(id==='contactor-4p') el=<ContactorDevice label="KM4" active={active} poles={4}/>
  else if(['control-relay','latching-relay','safety-relay','impulse-relay'].includes(id)) el=<RelayCoil/>
  else if(['timer-relay','star-delta-timer'].includes(id)) el=<RelayCoil timer/>
  else if(['earth-leakage-relay','undervoltage-relay','overvoltage-relay','phase-sequence-relay'].includes(id)) el=<DeviceFace label={part.symbol} sub={part.rating} active={active}/>
  else if(['fuse','hv-fuse-cutout'].includes(id)) el=<Fuse/>
  else if(['mcb','mccb','rcd','rcbo','motor-protector','thermal-relay','circuit-breaker','power-breaker','cb-3pole-magnetic','drawout-breaker','afdd','thermal-fuse','surge-fuse-combo'].includes(id)) el=<BreakerDevice label={part.symbol} active={active}/>
  else if(['transformer-1ph','transformer-3ph','isolation-transformer'].includes(id)) el=<Transformer/>
  else if(['autotransformer','variac'].includes(id)) el=<Transformer auto/>
  else if(id==='transformer-3w') el=<Transformer three/>
  else if(['ct','bushing-ct','pt'].includes(id)) el=<Transformer/>
  else if(id==='bridge') el=<Rectifier/>
  else if(['vfd','soft-starter','buck-converter','boost-converter','battery-charger','dc-supply','dc-dc','inverter'].includes(id)) el=<DeviceFace label={part.symbol} sub={part.rating} active={active}/>
  else if(['earth'].includes(id)) el=<Ground/>
  else if(id==='chassis-ground') el=<Ground chassis/>
  else if(['terminal','short-link','test-point'].includes(id)) el=<Terminal/>
  else if(id==='fused-terminal') el=<TerminalBlockSymbol fused/>
  else if(id==='disconnect-terminal') el=<TerminalBlockSymbol disconnect/>
  else if(id==='earth-terminal') el=<TerminalBlockSymbol earth/>
  else if(id==='junction') el=<Junction/>
  else if(id==='busbar') el=<Busbar/>
  else if(id==='spd' || id==='lightning-arrester-gap') el=<Arrester/>
  else if(id==='lightning-arrester-mov') el=<Arrester mov/>
  else if(['lamp','led-lamp','pilot-red','pilot-green','indicating-light','incandescent-lamp','fluorescent-lamp','emergency-light'].includes(id)) el=<Lamp active={active}/>
  else if(id==='buzzer') el=<Bell kind="BZ" active={active}/>
  else if(id==='horn') el=<Bell kind="HORN" active={active}/>
  else if(id==='bell') el=<Bell active={active}/>
  else if(['motor-1ph','motor-3ph','dc-motor','servo','stepper','machine-general','induction-motor','synchronous-motor','universal-motor','geared-motor'].includes(id)) el=<Motor active={active} text={['motor-3ph','induction-motor','synchronous-motor'].includes(id)?'M3~':id==='motor-1ph'?'M1~':'M'}/>
  else if(id==='pump-motor'||id==='compressor-load') el=<PumpSymbol active={active}/>
  else if(id==='linear-actuator') el=<SolenoidSymbol active={active}/>
  else if(['fan','ceiling-fan','exhaust-fan'].includes(id)) el=<FanSymbol active={active}/>
  else if(['heater','heating-element','water-heater'].includes(id)) el=<HeaterSymbol active={active}/>
  else if(id==='solenoid-coil') el=<SolenoidSymbol active={active}/>
  else if(id==='solenoid-valve') el=<SolenoidSymbol active={active} valve/>
  else if(id==='socket') el=<SocketSymbol/>
  else if(id==='schuko-socket') el=<SocketSymbol schuko/>
  else if(['resistor','resistor-load','potentiometer'].includes(id)) el=<Resistor/>
  else if(id==='ntc') el=<Thermistor kind="NTC"/>
  else if(id==='ptc') el=<Thermistor kind="PTC"/>
  else if(id==='varistor') el=<Varistor/>
  else if(['field-compound','field-series','field-shunt'].includes(id)) el=<Inductor/>
  else if(id==='field-pm') el=<Block label="PM"/>
  else if(id==='capacitor') el=<Capacitor/>
  else if(id==='inductor') el=<Inductor/>
  else if(id==='diode') el=<Diode/>
  else if(id==='zener') el=<Diode zener/>
  else if(id==='led') el=<Diode led/>
  else if(id==='photodiode') el=<PhotoDiode/>
  else if(id==='optocoupler') el=<Optocoupler active={active}/>
  else if(id==='voltmeter') el=<Meter text="V"/>
  else if(id==='ammeter') el=<Meter text="A"/>
  else if(id==='ohmmeter') el=<Meter text="Ω"/>
  else if(id==='wattmeter') el=<Meter text="W"/>
  else if(id==='frequency-meter') el=<Meter text="Hz"/>
  else if(id==='power-factor') el=<Meter text="cosφ"/>
  else if(['multimeter','clamp-meter','oscilloscope','energy-meter'].includes(id)) el=<Meter text={part.symbol}/>
  else if(id==='npn') el=<Bjt/>
  else if(id==='pnp') el=<Bjt pnp/>
  else if(id==='mosfet-n') el=<Mosfet/>
  else if(id==='mosfet-p') el=<Mosfet p/>
  else if(id==='scr') el=<Thyristor/>
  else if(id==='triac') el=<Thyristor triac/>
  else if(id==='opamp') el=<OpAmp/>
  else if(id==='logic-and') el=<LogicGate kind="AND"/>
  else if(id==='logic-or') el=<LogicGate kind="OR"/>
  else if(id==='logic-not') el=<LogicGate kind="NOT"/>
  else if(['proximity-ind','proximity-cap','photoelectric','ultrasonic','temperature','thermocouple','level-sensor','pressure-transmitter','flow-sensor','ldr','reed','hall','current-sensor','voltage-sensor','vibration-sensor','humidity-sensor','magnetic-proximity','smoke-detector','motion-sensor','thermostat'].includes(id)) el=<SensorFace label={part.symbol} active={active}/>
  else if(['plc','plc-di','plc-do','plc-ai','plc-ao','plc-cpu','remote-io','io-link-master','hmi','pid','counter','modbus','ethernet-switch','signal-isolator','signal-converter'].includes(id)) el=<DeviceFace label={part.symbol} sub={part.rating} active={active}/>
  else el=<Block label={part.symbol || part.name?.slice(0,7) || 'DEV'}/>

  return <div className={`${compact?'electrical-symbol compact':'electrical-symbol'} ${active?'device-active':''} part-${id}`} style={{'--activity':String(level||0)}}>{el}</div>
}

