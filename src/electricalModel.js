function firstNumber(text, fallback = 0){
  const m = String(text ?? '').replace(',', '.').match(/[-+]?\d*\.?\d+/)
  return m ? Number(m[0]) : fallback
}

function numberBeforeUnit(text, unit, fallback = 0){
  const re = new RegExp(`([-+]?\\d+(?:[.,]\\d+)?)\\s*${unit}`, 'i')
  const m = String(text ?? '').match(re)
  return m ? Number(m[1].replace(',', '.')) : fallback
}

function currentFromRating(text, fallback = 16){
  const raw = String(text ?? '').trim()
  const ma = raw.match(/(\d+(?:[.,]\d+)?)\s*mA\b/i)
  if(ma) return Number(ma[1].replace(',', '.')) / 1000
  const ka = raw.match(/(\d+(?:[.,]\d+)?)\s*kA\b/i)
  if(ka) return Number(ka[1].replace(',', '.')) * 1000
  const a = raw.match(/(?:^|\s|[CDBK])(\d+(?:[.,]\d+)?)\s*A?\b/i)
  if(a) return Number(a[1].replace(',', '.'))
  return fallback
}

function powerFromRating(text, fallback = 20){
  const raw = String(text ?? '')
  const kw = raw.match(/(\d+(?:[.,]\d+)?)\s*kW\b/i)
  if(kw) return Number(kw[1].replace(',', '.')) * 1000
  const w = raw.match(/(\d+(?:[.,]\d+)?)\s*W\b/i)
  if(w) return Number(w[1].replace(',', '.'))
  return fallback
}

function resistanceFromRating(text, fallback = 100){
  const raw = String(text ?? '').replace(',', '.')
  const n = firstNumber(raw, fallback)
  if(/MΩ|M\s*ohm/i.test(raw)) return n * 1e6
  if(/kΩ|k\s*ohm/i.test(raw)) return n * 1e3
  if(/mΩ|m\s*ohm/i.test(raw)) return n / 1e3
  if(/Ω|ohm/i.test(raw)) return n
  return fallback
}

function voltageFromRating(text, fallback = 24){
  const raw = String(text ?? '')
  const values = [...raw.matchAll(/(\d+(?:[.,]\d+)?)\s*V(?:AC|DC)?\b/gi)].map(m=>Number(m[1].replace(',', '.')))
  return values[0] ?? fallback
}

function ratioVoltages(text, primaryFallback = 230, secondaryFallback = 24){
  const nums = [...String(text ?? '').matchAll(/\d+(?:[.,]\d+)?/g)].map(m=>Number(m[0].replace(',', '.')))
  return { primaryVoltage: nums[0] || primaryFallback, secondaryVoltage: nums[1] || secondaryFallback }
}

export function defaultParameters(part){
  const id = part?.id || ''
  const rating = part?.rating || ''
  const common = { contactResistance: 0.02, wireResistance: 0.002 }

  const dcSources=['dc-source','battery','solar','dc-bus','bench-dc-supply','usb-supply','battery-24v','pv-string']
  if(dcSources.includes(id)){
    const fallback=id==='solar'?36:id==='pv-string'?120:id==='dc-bus'?24:id==='battery-24v'?24:id==='usb-supply'?5:id==='bench-dc-supply'?30:12
    return { ...common, voltage: voltageFromRating(rating,fallback), internalResistance:['battery','battery-24v'].includes(id)?.08:.03 }
  }
  if(id==='dual-dc-supply') return { ...common, positiveVoltage:15, negativeVoltage:15, internalResistance:.05 }
  if(['ac-source','generator','ups'].includes(id)) return { ...common, voltage:voltageFromRating(rating,230), frequency:numberBeforeUnit(rating,'Hz',50)||50, internalResistance:.08 }
  if(['three-phase','three-phase-delta','three-phase-wye','three-phase-wye-grounded','three-phase-open-delta'].includes(id)) return { ...common, lineVoltage:voltageFromRating(rating,400), frequency:50, internalResistance:.08 }

  const simpleLoads=['lamp','led-lamp','heater','fan','buzzer','horn','doorbell','bell','pilot-red','pilot-green','indicating-light','annunciator','solenoid-coil','incandescent-lamp','fluorescent-lamp','emergency-light','heating-element','compressor-load','solenoid-valve','ceiling-fan','exhaust-fan','water-heater','schuko-socket']
  if(simpleLoads.includes(id)){
    const ratedVoltage=['lamp','emergency-light'].includes(id)?12:['buzzer','horn','doorbell','bell','pilot-red','pilot-green','indicating-light','annunciator','solenoid-coil','solenoid-valve'].includes(id)?24:230
    const powerDefaults={lamp:60,'incandescent-lamp':60,'led-lamp':10,'fluorescent-lamp':36,'emergency-light':12,heater:1000,'heating-element':1500,fan:80,'ceiling-fan':80,'exhaust-fan':35,'water-heater':2000,'compressor-load':1500,'solenoid-coil':10,'solenoid-valve':8,'schuko-socket':1}
    return { ...common, ratedVoltage, power:powerFromRating(rating,powerDefaults[id]||8), minimumOperatingRatio:['led-lamp','emergency-light'].includes(id)?.65:.35 }
  }

  const motors=['motor-1ph','motor-3ph','dc-motor','servo','stepper','machine-general','induction-motor','synchronous-motor','universal-motor','geared-motor','pump-motor','linear-actuator']
  if(motors.includes(id)) return {
    ...common,
    ratedVoltage:['motor-3ph','induction-motor','synchronous-motor','pump-motor'].includes(id)?400:['dc-motor','servo','stepper','linear-actuator'].includes(id)?24:230,
    power:powerFromRating(rating,['motor-3ph','induction-motor','synchronous-motor'].includes(id)?2200:['motor-1ph','pump-motor'].includes(id)?750:250),
    efficiency:.82, minimumOperatingRatio:.55
  }

  if(id==='resistor-load'||id==='resistor'||id==='potentiometer'||['field-compound','field-series','field-shunt','ntc','ptc'].includes(id)) return { ...common, resistance:resistanceFromRating(rating,id==='resistor'?1000:100) }
  if(id==='varistor') return { ...common, clampVoltage:voltageFromRating(rating,275), offResistance:1e8, onResistance:.5 }
  if(id==='capacitor') return { ...common, capacitanceUf:numberBeforeUnit(rating,'µF',100)||numberBeforeUnit(rating,'uF',100)||100 }
  if(id==='inductor') return { ...common, inductanceMh:numberBeforeUnit(rating,'mH',10)||10 }

  const currentProtection=['fuse','mcb','mccb','motor-protector','thermal-relay','circuit-breaker','power-breaker','cb-3pole-magnetic','drawout-breaker','isolator','afdd','thermal-fuse','surge-fuse-combo']
  if(currentProtection.includes(id)) return { ...common, ratedCurrent:currentFromRating(rating,id==='mccb'?100:16), tripMultiplier:1.05 }
  if(id==='earth-leakage-relay') return { ...common, monitorVoltage:230, residualTripMa:30, coilResistance:15000, contactResistance:.02 }
  if(id==='undervoltage-relay') return { ...common, monitorVoltage:230, thresholdVoltage:180, coilResistance:15000, contactResistance:.02 }
  if(id==='overvoltage-relay') return { ...common, monitorVoltage:230, thresholdVoltage:255, coilResistance:15000, contactResistance:.02 }
  if(id==='phase-sequence-relay') return { ...common, monitorVoltage:400, thresholdVoltage:320, coilResistance:20000, contactResistance:.02 }
  if(id==='rcd') return { ...common, ratedCurrent:40, residualTripMa:currentFromRating(rating,.03)*1000 }
  if(id==='rcbo') return { ...common, ratedCurrent:16, residualTripMa:30, tripMultiplier:1.05 }
  if(['spd','lightning-arrester-gap','lightning-arrester-mov'].includes(id)) return { ...common, clampVoltage:275 }

  const relays=['contactor','control-relay','timer-relay','latching-relay','safety-relay','star-delta-timer','impulse-relay','contactor-4p']
  if(relays.includes(id)) return { ...common, coilVoltage:24, coilResistance:400, pickupRatio:.7 }
  if(part?.type==='switch') return { ...common, contactResistance:.02 }

  const converters=['transformer-1ph','autotransformer','transformer-3w','transformer-3ph','pt','dc-supply','dc-dc','inverter','isolation-transformer','variac','buck-converter','boost-converter','battery-charger']
  if(converters.includes(id)){
    let r=ratioVoltages(rating,id==='transformer-3ph'?400:230,id==='inverter'?230:24)
    if(id==='dc-supply') r={primaryVoltage:230,secondaryVoltage:24}
    if(id==='variac') r={primaryVoltage:230,secondaryVoltage:115}
    if(id==='buck-converter') r={primaryVoltage:24,secondaryVoltage:12}
    if(id==='boost-converter') r={primaryVoltage:12,secondaryVoltage:24}
    if(id==='battery-charger') r={primaryVoltage:230,secondaryVoltage:24}
    return { ...common, ...r, efficiency:.92 }
  }
  if(['ct','bushing-ct'].includes(id)){
    const nums=[...String(rating).matchAll(/\d+(?:[.,]\d+)?/g)].map(m=>Number(m[0].replace(',', '.')))
    return { ...common, primaryCurrent:nums[0]||100, secondaryCurrent:nums[1]||5 }
  }
  if(['vfd','soft-starter'].includes(id)) return { ...common, inputVoltage:400, outputVoltage:400, frequency:50, outputFrequency:50, efficiency:.95 }
  if(id==='bridge') return { ...common, diodeDrop:.8, efficiency:.9 }

  if(id==='photodiode') return { ...common, forwardVoltage:.45, onResistance:20, active:false }
  if(id==='optocoupler') return { ...common, inputForwardVoltage:1.2, inputResistance:120, outputOnResistance:40, active:false }
  if(['diode','led'].includes(id)) return { ...common, forwardVoltage:id==='led'?2:.7, onResistance:id==='led'?8:1.2 }
  if(id==='zener') return { ...common, forwardVoltage:.7, zenerVoltage:voltageFromRating(rating,5.1), onResistance:1.2 }
  if(['npn','pnp'].includes(id)) return { ...common, thresholdVoltage:.65, onResistance:.18 }
  if(['mosfet-n','mosfet-p'].includes(id)) return { ...common, thresholdVoltage:3, onResistance:.05 }
  if(['scr','triac'].includes(id)) return { ...common, gateThreshold:.8, onResistance:.12 }
  if(id==='opamp') return { ...common, supplyVoltage:12, gain:1000 }
  if(['logic-and','logic-or','logic-not'].includes(id)) return { ...common, supplyVoltage:5, logicThreshold:.55 }

  if(part?.type==='meter') return { ...common, range:firstNumber(rating,600) }
  if(part?.type==='sensor') return { ...common, supplyVoltage:24, active:false, outputVoltage:24 }
  if(['plc','plc-di','plc-do','plc-ai','plc-ao','pid','remote-io','counter','encoder','plc-cpu','signal-isolator','signal-converter','io-link-master'].includes(id)) return { ...common, supplyVoltage:24, outputVoltage:24, active:false }
  if(['hmi','modbus','ethernet-switch'].includes(id)) return { ...common, supplyVoltage:24, power:id==='hmi'?12:5 }
  if(part?.type==='wire') return { ...common, wireResistance:.002 }

  // Safe generic defaults make future parts immediately configurable.
  if(part?.type==='voltage') return { ...common, voltage:voltageFromRating(rating,24), internalResistance:.05 }
  if(part?.type==='load') return { ...common, ratedVoltage:voltageFromRating(rating,230), power:powerFromRating(rating,50), minimumOperatingRatio:.35 }
  if(part?.type==='protection') return { ...common, ratedCurrent:currentFromRating(rating,16), tripMultiplier:1.05 }
  if(part?.type==='convert') return { ...common, ...ratioVoltages(rating,230,24), efficiency:.9 }
  if(part?.type==='passive') return { ...common, resistance:resistanceFromRating(rating,1000) }
  return common
}

export function getParameterFields(part){
  const id=part?.id||''
  if(['dc-source','battery','solar','dc-bus','bench-dc-supply','usb-supply','battery-24v','pv-string'].includes(id)) return [
    {key:'voltage',label:'Source voltage',unit:'V',min:0,step:.1},
    {key:'internalResistance',label:'Internal resistance',unit:'Ω',min:.001,step:.01}
  ]
  if(id==='dual-dc-supply') return [{key:'positiveVoltage',label:'Positive rail voltage',unit:'V',min:.1,step:.1},{key:'negativeVoltage',label:'Negative rail voltage',unit:'V',min:.1,step:.1}]
  if(['ac-source','generator','ups'].includes(id)) return [{key:'voltage',label:'RMS voltage',unit:'V',min:0,step:1},{key:'frequency',label:'Frequency',unit:'Hz',min:1,step:1}]
  if(['three-phase','three-phase-delta','three-phase-wye','three-phase-wye-grounded','three-phase-open-delta'].includes(id)) return [{key:'lineVoltage',label:'Line voltage',unit:'V',min:0,step:1},{key:'frequency',label:'Frequency',unit:'Hz',min:1,step:1}]

  const simpleLoads=['lamp','led-lamp','heater','fan','buzzer','horn','doorbell','bell','pilot-red','pilot-green','indicating-light','annunciator','solenoid-coil','incandescent-lamp','fluorescent-lamp','emergency-light','heating-element','compressor-load','solenoid-valve','ceiling-fan','exhaust-fan','water-heater','schuko-socket']
  if(simpleLoads.includes(id)) return [{key:'ratedVoltage',label:'Rated voltage',unit:'V',min:.1,step:1},{key:'power',label:'Rated power',unit:'W',min:.1,step:1}]
  if(['motor-1ph','motor-3ph','dc-motor','servo','stepper','machine-general','induction-motor','synchronous-motor','universal-motor','geared-motor','pump-motor','linear-actuator'].includes(id)) return [{key:'ratedVoltage',label:'Rated voltage',unit:'V',min:1,step:1},{key:'power',label:'Rated output power',unit:'W',min:1,step:10},{key:'efficiency',label:'Efficiency',unit:'0–1',min:.1,max:1,step:.01}]
  if(['resistor','resistor-load','potentiometer','field-compound','field-series','field-shunt','ntc','ptc'].includes(id)) return [{key:'resistance',label:'Resistance',unit:'Ω',min:.001,step:1}]
  if(id==='varistor') return [{key:'clampVoltage',label:'Clamp voltage',unit:'V',min:1,step:1}]
  if(id==='capacitor') return [{key:'capacitanceUf',label:'Capacitance',unit:'µF',min:.001,step:1}]
  if(id==='inductor') return [{key:'inductanceMh',label:'Inductance',unit:'mH',min:.001,step:1}]

  if(['fuse','mcb','mccb','motor-protector','thermal-relay','circuit-breaker','power-breaker','cb-3pole-magnetic','drawout-breaker','isolator','rcbo','afdd','thermal-fuse','surge-fuse-combo'].includes(id)) return [{key:'ratedCurrent',label:'Rated / trip current',unit:'A',min:.01,step:.1}]
  if(id==='earth-leakage-relay') return [{key:'monitorVoltage',label:'Monitor voltage',unit:'V',min:1,step:1},{key:'residualTripMa',label:'Residual trip',unit:'mA',min:1,step:1}]
  if(id==='undervoltage-relay') return [{key:'monitorVoltage',label:'Monitor voltage',unit:'V',min:1,step:1},{key:'thresholdVoltage',label:'Undervoltage threshold',unit:'V',min:1,step:1}]
  if(id==='overvoltage-relay') return [{key:'monitorVoltage',label:'Monitor voltage',unit:'V',min:1,step:1},{key:'thresholdVoltage',label:'Overvoltage threshold',unit:'V',min:1,step:1}]
  if(id==='phase-sequence-relay') return [{key:'monitorVoltage',label:'Monitor line voltage',unit:'V',min:1,step:1},{key:'thresholdVoltage',label:'Minimum line voltage',unit:'V',min:1,step:1}]
  if(id==='rcd') return [{key:'ratedCurrent',label:'Rated line current',unit:'A',min:1,step:1},{key:'residualTripMa',label:'Residual trip',unit:'mA',min:1,step:1}]

  if(['contactor','control-relay','timer-relay','latching-relay','safety-relay','star-delta-timer','impulse-relay','contactor-4p'].includes(id)) return [{key:'coilVoltage',label:'Coil voltage',unit:'V',min:1,step:1},{key:'coilResistance',label:'Coil resistance',unit:'Ω',min:1,step:10}]
  if(['transformer-1ph','autotransformer','transformer-3w','transformer-3ph','pt','dc-supply','dc-dc','inverter','isolation-transformer','variac','buck-converter','boost-converter','battery-charger'].includes(id)) return [{key:'primaryVoltage',label:'Primary / input voltage',unit:'V',min:.1,step:1},{key:'secondaryVoltage',label:'Secondary / output voltage',unit:'V',min:.1,step:1}]
  if(['ct','bushing-ct'].includes(id)) return [{key:'primaryCurrent',label:'Primary current',unit:'A',min:.1,step:1},{key:'secondaryCurrent',label:'Secondary current',unit:'A',min:.1,step:.1}]
  if(['vfd','soft-starter'].includes(id)) return [{key:'inputVoltage',label:'Input voltage',unit:'V',min:1,step:1},{key:'outputVoltage',label:'Output voltage',unit:'V',min:1,step:1},{key:'outputFrequency',label:'Output frequency',unit:'Hz',min:0,step:1}]
  if(id==='zener') return [{key:'zenerVoltage',label:'Zener voltage',unit:'V',min:.1,step:.1}]
  if(['diode','led','photodiode'].includes(id)) return [{key:'forwardVoltage',label:'Forward voltage',unit:'V',min:.1,step:.1}]
  if(id==='optocoupler') return [{key:'inputForwardVoltage',label:'Input forward voltage',unit:'V',min:.1,step:.1},{key:'active',label:'Optical input active',type:'boolean'}]
  if(['npn','pnp','mosfet-n','mosfet-p'].includes(id)) return [{key:'thresholdVoltage',label:'Control threshold',unit:'V',min:.1,step:.1}]
  if(part?.type==='sensor') return [{key:'supplyVoltage',label:'Supply voltage',unit:'V',min:1,step:1},{key:'active',label:'Sensor active',type:'boolean'}]
  if(['plc','plc-di','plc-do','plc-ai','plc-ao','pid','remote-io','counter','encoder','plc-cpu','signal-isolator','signal-converter','io-link-master'].includes(id)) return [{key:'supplyVoltage',label:'Supply voltage',unit:'V',min:1,step:1},{key:'active',label:'Output / logic active',type:'boolean'}]
  if(['hmi','modbus','ethernet-switch'].includes(id)) return [{key:'supplyVoltage',label:'Supply voltage',unit:'V',min:1,step:1},{key:'power',label:'Power',unit:'W',min:.1,step:1}]
  if(part?.type==='meter') return [{key:'range',label:'Measurement range',unit:'',min:.1,step:1}]
  if(part?.type==='wire') return [{key:'wireResistance',label:'Connection resistance',unit:'Ω',min:0,step:.001}]

  if(part?.type==='voltage') return [{key:'voltage',label:'Source voltage',unit:'V',min:0,step:.1}]
  if(part?.type==='load') return [{key:'ratedVoltage',label:'Rated voltage',unit:'V',min:.1,step:1},{key:'power',label:'Rated power',unit:'W',min:.1,step:1}]
  if(part?.type==='protection') return [{key:'ratedCurrent',label:'Rated / trip current',unit:'A',min:.01,step:.1}]
  if(part?.type==='switch') return [{key:'contactResistance',label:'Contact resistance',unit:'Ω',min:.001,step:.001}]
  if(part?.type==='convert') return [{key:'primaryVoltage',label:'Primary / input voltage',unit:'V',min:.1,step:1},{key:'secondaryVoltage',label:'Secondary / output voltage',unit:'V',min:.1,step:1}]
  if(part?.type==='passive') return [{key:'resistance',label:'Resistance',unit:'Ω',min:.001,step:1}]
  return []
}

export function getTerminals(part){
  const id = part?.id || ''

  if(id==='contactor-4p') return [
    {id:'A1',label:'A1',x:.32,y:0},{id:'A2',label:'A2',x:.68,y:0},
    {id:'L1',label:'L1',x:0,y:.16},{id:'L2',label:'L2',x:0,y:.36},{id:'L3',label:'L3',x:0,y:.58},{id:'L4',label:'L4',x:0,y:.8},
    {id:'T1',label:'T1',x:1,y:.16},{id:'T2',label:'T2',x:1,y:.36},{id:'T3',label:'T3',x:1,y:.58},{id:'T4',label:'T4',x:1,y:.8}
  ]
  if(id==='contactor') return [
    {id:'A1',label:'A1',x:.32,y:0},{id:'A2',label:'A2',x:.68,y:0},
    {id:'L1',label:'L1',x:0,y:.24},{id:'L2',label:'L2',x:0,y:.46},{id:'L3',label:'L3',x:0,y:.68},
    {id:'T1',label:'T1',x:1,y:.24},{id:'T2',label:'T2',x:1,y:.46},{id:'T3',label:'T3',x:1,y:.68},
    {id:'13',label:'13',x:.34,y:1},{id:'14',label:'14',x:.66,y:1}
  ]
  if(['control-relay','timer-relay','latching-relay','safety-relay','star-delta-timer','impulse-relay','earth-leakage-relay','undervoltage-relay','overvoltage-relay','phase-sequence-relay'].includes(id)) return [
    {id:'A1',label:'A1',x:.28,y:0},{id:'A2',label:'A2',x:.72,y:0},{id:'13',label:'13',x:0,y:.68},{id:'14',label:'14',x:1,y:.68}
  ]
  if(['thermal-relay','motor-protector','cb-3pole-magnetic','drawout-breaker'].includes(id)) return [
    {id:'L1',label:'L1',x:0,y:.24},{id:'L2',label:'L2',x:0,y:.5},{id:'L3',label:'L3',x:0,y:.76},
    {id:'T1',label:'T1',x:1,y:.24},{id:'T2',label:'T2',x:1,y:.5},{id:'T3',label:'T3',x:1,y:.76}
  ]
  if(['rcd','rcbo'].includes(id)) return [
    {id:'LIN',label:'L IN',x:0,y:.3},{id:'NIN',label:'N IN',x:0,y:.7},
    {id:'LOUT',label:'L OUT',x:1,y:.3},{id:'NOUT',label:'N OUT',x:1,y:.7}
  ]
  if(['vfd','soft-starter'].includes(id)) return [
    {id:'R',label:'R/L1',x:0,y:.22},{id:'S',label:'S/L2',x:0,y:.5},{id:'T',label:'T/L3',x:0,y:.78},
    {id:'U',label:'U',x:1,y:.22},{id:'V',label:'V',x:1,y:.5},{id:'W',label:'W',x:1,y:.78}
  ]
  if(id==='transformer-3ph') return [
    {id:'P1',label:'P1',x:0,y:.2},{id:'P2',label:'P2',x:0,y:.5},{id:'P3',label:'P3',x:0,y:.8},
    {id:'S1',label:'S1',x:1,y:.2},{id:'S2',label:'S2',x:1,y:.5},{id:'S3',label:'S3',x:1,y:.8}
  ]
  if(id==='dual-dc-supply') return [
    {id:'+',label:'+V',x:1,y:.2},{id:'COM',label:'COM',x:1,y:.5},{id:'-',label:'-V',x:1,y:.8}
  ]
  if(id==='phase-sequence-meter') return [
    {id:'L1',label:'L1',x:0,y:.25},{id:'L2',label:'L2',x:0,y:.5},{id:'L3',label:'L3',x:0,y:.75}
  ]
  if(id==='three-phase' || id==='three-phase-delta' || id==='three-phase-wye' || id==='three-phase-wye-grounded' || id==='three-phase-open-delta'){
    return [
      {id:'L1',label:'L1',x:1,y:.2},{id:'L2',label:'L2',x:1,y:.4},{id:'L3',label:'L3',x:1,y:.6},{id:'N',label:'N',x:1,y:.8},
    ]
  }
  if(id==='motor-3ph') return [
    {id:'U',label:'U',x:0,y:.25},{id:'V',label:'V',x:0,y:.5},{id:'W',label:'W',x:0,y:.75}
  ]
  if(id==='npn'||id==='pnp') return [
    {id:'B',label:'B',x:0,y:.5},{id:'C',label:'C',x:1,y:.25},{id:'E',label:'E',x:1,y:.75}
  ]
  if(id==='mosfet-n'||id==='mosfet-p') return [
    {id:'G',label:'G',x:0,y:.5},{id:'D',label:'D',x:1,y:.25},{id:'S',label:'S',x:1,y:.75}
  ]
  if(id==='scr') return [
    {id:'A',label:'A',x:0,y:.35},{id:'K',label:'K',x:1,y:.35},{id:'G',label:'G',x:.5,y:1}
  ]
  if(id==='triac') return [
    {id:'MT1',label:'MT1',x:0,y:.35},{id:'MT2',label:'MT2',x:1,y:.35},{id:'G',label:'G',x:.5,y:1}
  ]
  if(id==='logic-and' || id==='logic-or') return [
    {id:'A',label:'A',x:0,y:.25},{id:'B',label:'B',x:0,y:.55},{id:'Y',label:'Y',x:1,y:.4},{id:'V+',label:'V+',x:.58,y:0},{id:'GND',label:'GND',x:.58,y:1}
  ]
  if(id==='logic-not') return [
    {id:'A',label:'A',x:0,y:.4},{id:'Y',label:'Y',x:1,y:.4},{id:'V+',label:'V+',x:.58,y:0},{id:'GND',label:'GND',x:.58,y:1}
  ]
  if(id==='opamp') return [
    {id:'IN+',label:'+',x:0,y:.32},{id:'IN-',label:'−',x:0,y:.68},{id:'OUT',label:'OUT',x:1,y:.5},{id:'V+',label:'V+',x:.58,y:0},{id:'V-',label:'V−',x:.58,y:1}
  ]
  if(id==='plc' || id==='plc-di' || id==='plc-do' || id==='plc-ai' || id==='plc-ao' || id==='pid' || id==='remote-io' || id==='counter' || id==='encoder' || id==='plc-cpu' || id==='signal-isolator' || id==='signal-converter' || id==='io-link-master'){
    return [
      {id:'P+',label:'24V',x:0,y:.28},{id:'P-',label:'0V',x:0,y:.72},{id:'IO1',label:'I/O 1',x:1,y:.28},{id:'IO2',label:'I/O 2',x:1,y:.72}
    ]
  }
  if(id==='bridge') return [
    {id:'AC1',label:'~',x:0,y:.5},{id:'AC2',label:'~',x:1,y:.5},{id:'DC+',label:'+',x:.5,y:0},{id:'DC-',label:'−',x:.5,y:1}
  ]
  if(['transformer-1ph','autotransformer','transformer-3w','ct','bushing-ct','pt','dc-supply','dc-dc','inverter','isolation-transformer','variac','buck-converter','boost-converter','battery-charger'].includes(id)){
    return [
      {id:'P1',label:'P1',x:0,y:.28},{id:'P2',label:'P2',x:0,y:.72},{id:'S1',label:'S1',x:1,y:.28},{id:'S2',label:'S2',x:1,y:.72}
    ]
  }
  if(['switch-spdt','selector','two-way','rotary-selector'].includes(id)) return [
    {id:'COM',label:'C',x:0,y:.5},{id:'NO',label:'NO',x:1,y:.3},{id:'NC',label:'NC',x:1,y:.7}
  ]
  if(id==='earth' || id==='chassis-ground') return [{id:'G',label:'G',x:.5,y:0}]
  if(id==='neutral' || id==='phase' || id==='terminal' || id==='junction' || id==='busbar' || id==='short-link') return [
    {id:'1',label:'1',x:0,y:.5},{id:'2',label:'2',x:1,y:.5}
  ]
  return [{id:'1',label:'1',x:0,y:.5},{id:'2',label:'2',x:1,y:.5}]
}

export function terminalPosition(component, part, terminal){
  const width = 132, height = 88
  const cx = width/2, cy=height/2
  const localX = terminal.x*width
  const localY = terminal.y*height
  const angle = (component.rotation || 0) * Math.PI/180
  const dx = localX-cx, dy=localY-cy
  const rx = dx*Math.cos(angle)-dy*Math.sin(angle)
  const ry = dx*Math.sin(angle)+dy*Math.cos(angle)
  return {x:component.x+cx+rx,y:component.y+cy+ry}
}
