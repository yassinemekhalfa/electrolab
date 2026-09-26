import { getTerminals, defaultParameters } from './electricalModel.js'

const EPS = 1e-9
const clamp=(v,min,max)=>Math.max(min,Math.min(max,v))

export function parseNumber(text, fallback=0){
  if(typeof text==='number') return Number.isFinite(text)?text:fallback
  const s=String(text??'').replace(',', '.').trim()
  const m=s.match(/[-+]?\d*\.?\d+/)
  return m?Number(m[0]):fallback
}

export function defaultState(part){
  if(['push-no','momentary-no','limit-switch','float-switch','flow-switch','level-switch-no','pressure-switch','pressure-vac-switch-no','temperature-switch','torque-switch','relay-contact-no','timed-contact-no','reed','motion-sensor','smoke-detector','proximity-ind','proximity-cap','photoelectric','ultrasonic','hall','thermostat','key-switch','foot-switch','rotary-selector','magnetic-proximity'].includes(part.id)) return 'open'
  if(['plc','plc-do','plc-ao','pid','remote-io','counter','encoder'].includes(part.id)) return 'open'
  if(['contactor','control-relay','timer-relay','latching-relay','safety-relay','star-delta-timer','impulse-relay','contactor-4p','earth-leakage-relay','undervoltage-relay','overvoltage-relay','phase-sequence-relay','diode','zener','led','npn','pnp','mosfet-n','mosfet-p','scr','triac','opamp','logic-and','logic-or','logic-not'].includes(part.id)) return 'auto'
  return 'closed'
}

function cfg(component, part){
  return {...defaultParameters(part), ...(component.params||{})}
}

class UF{
  constructor(){this.p=new Map()}
  add(x){if(!this.p.has(x))this.p.set(x,x)}
  find(x){this.add(x); const p=this.p.get(x); if(p!==x)this.p.set(x,this.find(p)); return this.p.get(x)}
  union(a,b){a=this.find(a);b=this.find(b);if(a!==b)this.p.set(b,a)}
}

function solveLinear(A,b){
  const n=b.length
  if(!n) return []
  const M=A.map((r,i)=>[...r,b[i]])
  for(let col=0;col<n;col++){
    let pivot=col
    for(let r=col+1;r<n;r++) if(Math.abs(M[r][col])>Math.abs(M[pivot][col])) pivot=r
    if(Math.abs(M[pivot][col])<1e-12) continue
    ;[M[col],M[pivot]]=[M[pivot],M[col]]
    const d=M[col][col]
    for(let c=col;c<=n;c++) M[col][c]/=d
    for(let r=0;r<n;r++){
      if(r===col)continue
      const f=M[r][col]
      if(Math.abs(f)<1e-15)continue
      for(let c=col;c<=n;c++)M[r][c]-=f*M[col][c]
    }
  }
  return M.map(r=>Number.isFinite(r[n])?r[n]:0)
}

function componentBranches(c,p,controlState,frequency=50){
  const id=p.id
  const t=getTerminals(p).map(x=>x.id)
  const s=cfg(c,p)
  const branch=(a,b,r,kind='resistor',extra={})=>({uid:c.uid,a,b,r:Math.max(Number(r)||0,1e-6),kind,...extra})
  const state=c.state||defaultState(p)
  const closed=state==='closed'||state==='on'||state==='pressed'

  if(['dc-source','battery','solar','dc-bus','bench-dc-supply','usb-supply','battery-24v','pv-string'].includes(id)) return [{uid:c.uid,a:t[0],b:t[1],kind:'vsource',voltage:Number(s.voltage)||0}]
  if(id==='dual-dc-supply') return [
    {uid:c.uid,a:'+',b:'COM',kind:'vsource',voltage:Number(s.positiveVoltage)||15},
    {uid:c.uid,a:'COM',b:'-',kind:'vsource',voltage:Number(s.negativeVoltage)||15}
  ]
  if(['ac-source','generator','ups'].includes(id)) return [{uid:c.uid,a:t[0],b:t[1],kind:'vsource',voltage:Number(s.voltage)||0,frequency:Number(s.frequency)||frequency}]
  if(['three-phase','three-phase-delta','three-phase-wye','three-phase-wye-grounded','three-phase-open-delta'].includes(id)){
    const line=Number(s.lineVoltage)||400
    const phase=line/Math.sqrt(3)
    return [
      {uid:c.uid,a:'L1',b:'N',kind:'vsource',voltage:phase,frequency},
      {uid:c.uid,a:'L2',b:'N',kind:'vsource',voltage:-phase/2,frequency},
      {uid:c.uid,a:'L3',b:'N',kind:'vsource',voltage:-phase/2,frequency},
    ]
  }

  if(id==='transformer-3ph'){
    const gain=(Number(s.secondaryVoltage)||230)/Math.max(.1,Number(s.primaryVoltage)||400)
    return [
      branch('P1','P2',50000,'device'),branch('P2','P3',50000,'device'),
      {uid:c.uid,a:'S1',b:'S2',kind:'vcvs',cp:'P1',cn:'P2',gain},
      {uid:c.uid,a:'S2',b:'S3',kind:'vcvs',cp:'P2',cn:'P3',gain}
    ]
  }
  if(['transformer-1ph','autotransformer','transformer-3w','pt','dc-supply','dc-dc','inverter','isolation-transformer','variac','buck-converter','boost-converter','battery-charger'].includes(id)){
    const gain=(Number(s.secondaryVoltage)||24)/Math.max(.1,Number(s.primaryVoltage)||230)
    return [branch('P1','P2',50000,'device'),{uid:c.uid,a:'S1',b:'S2',kind:'vcvs',cp:'P1',cn:'P2',gain}]
  }
  if(['ct','bushing-ct'].includes(id)){
    const gain=(Number(s.primaryCurrent)||100)/Math.max(.1,Number(s.secondaryCurrent)||5)
    return [branch('P1','P2',.02,'device'),branch('S1','S2',Math.max(1,gain),'device')]
  }
  if(id==='bridge') return [branch('AC1','AC2',50000,'device'),{uid:c.uid,a:'DC+',b:'DC-',kind:'vcvs',cp:'AC1',cn:'AC2',gain:Number(s.efficiency)||.9}]
  if(['vfd','soft-starter'].includes(id)){
    const gain=(Number(s.outputVoltage)||400)/Math.max(1,Number(s.inputVoltage)||400)
    return [
      branch('R','S',50000,'device'),branch('S','T',50000,'device'),
      {uid:c.uid,a:'U',b:'V',kind:'vcvs',cp:'R',cn:'S',gain},
      {uid:c.uid,a:'V',b:'W',kind:'vcvs',cp:'S',cn:'T',gain}
    ]
  }

  if(id==='contactor-4p'){
    const autoClosed=controlState?.[c.uid]===true
    const contactClosed=state==='closed'||(state==='auto'&&autoClosed)
    return [branch('A1','A2',Number(s.coilResistance)||400,'coil'),...(contactClosed?[
      branch('L1','T1',s.contactResistance,'contact'),branch('L2','T2',s.contactResistance,'contact'),branch('L3','T3',s.contactResistance,'contact'),branch('L4','T4',s.contactResistance,'contact')
    ]:[])]
  }
  if(id==='contactor'){
    const autoClosed=controlState?.[c.uid]===true
    const contactClosed=state==='closed'||(state==='auto'&&autoClosed)
    return [
      branch('A1','A2',Number(s.coilResistance)||400,'coil'),
      ...(contactClosed?[
        branch('L1','T1',s.contactResistance,'contact'),branch('L2','T2',s.contactResistance,'contact'),branch('L3','T3',s.contactResistance,'contact'),branch('13','14',s.contactResistance,'contact')
      ]:[])
    ]
  }
  if(['control-relay','timer-relay','latching-relay','safety-relay','star-delta-timer','impulse-relay'].includes(id)){
    const autoClosed=controlState?.[c.uid]===true
    const contactClosed=state==='closed'||(state==='auto'&&autoClosed)
    return [branch('A1','A2',Number(s.coilResistance)||400,'coil'),...(contactClosed?[branch('13','14',s.contactResistance,'contact')]:[])]
  }

  if(['earth-leakage-relay','undervoltage-relay','overvoltage-relay','phase-sequence-relay'].includes(id)){
    const contactClosed=controlState?.[c.uid]===true
    return [branch('A1','A2',Number(s.coilResistance)||15000,'monitor'),...(contactClosed?[branch('13','14',s.contactResistance||.02,'contact')]:[])]
  }
  if(['thermal-relay','motor-protector','cb-3pole-magnetic','drawout-breaker','afdd','thermal-fuse','surge-fuse-combo'].includes(id)){
    if(state==='open') return []
    return [branch('L1','T1',s.contactResistance,'protection'),branch('L2','T2',s.contactResistance,'protection'),branch('L3','T3',s.contactResistance,'protection')]
  }
  if(['rcd','rcbo'].includes(id)){
    if(state==='open') return []
    return [branch('LIN','LOUT',s.contactResistance,'protection'),branch('NIN','NOUT',s.contactResistance,'protection')]
  }

  if(['switch-spdt','two-way','selector','rotary-selector'].includes(id)){
    if(state==='open') return []
    if(state==='nc') return [branch('COM','NC',s.contactResistance,'switch')]
    return [branch('COM','NO',s.contactResistance,'switch')]
  }
  if(['switch-spst','wall-switch','isolator','knife-switch','line-switch','push-no','push-nc','momentary-no','momentary-nc','emergency-stop','float-switch','flow-switch','level-switch-no','level-switch-nc','pressure-switch','pressure-vac-switch-no','pressure-vac-switch-nc','temperature-switch','torque-switch','limit-switch','relay-contact-no','relay-contact-nc','timed-contact-no','timed-contact-nc','solid-state-relay','contactor-home','dimmer','reed','thermostat','motion-sensor','smoke-detector','proximity-ind','proximity-cap','photoelectric','ultrasonic','hall','key-switch','foot-switch','magnetic-proximity','mcb','mccb','circuit-breaker','power-breaker','fuse','hv-fuse-cutout','afdd','thermal-fuse','surge-fuse-combo'].includes(id)){
    const normallyClosed=['push-nc','momentary-nc','emergency-stop','level-switch-nc','pressure-vac-switch-nc','relay-contact-nc','timed-contact-nc'].includes(id)
    const conducts=closed||(normallyClosed&&state!=='open')
    return conducts?[branch(t[0],t[1],s.contactResistance||.02,id.includes('fuse')?'protection':'switch')]:[]
  }

  if(['earth','chassis-ground','terminal','neutral','phase','busbar','junction','short-link','cable-2','cable-3','cable-5','polarity-positive','polarity-negative','fused-terminal','disconnect-terminal','earth-terminal','test-point'].includes(id)) return t.length>1?[branch(t[0],t[1],Number(s.wireResistance)||.002,'wire')]:[]

  if(['resistor','potentiometer','resistor-load','field-compound','field-series','field-shunt','ntc','ptc'].includes(id)) return [branch(t[0],t[1],Number(s.resistance)||100,'resistor')]
  if(id==='varistor'){
    const on=controlState?.[c.uid]===true
    return [branch(t[0],t[1],on?(Number(s.onResistance)||.5):(Number(s.offResistance)||1e8),'semiconductor')]
  }
  if(id==='capacitor'){
    const cap=Math.max(1e-12,(Number(s.capacitanceUf)||100)*1e-6)
    const x=1/(2*Math.PI*Math.max(1,frequency)*cap)
    return [branch(t[0],t[1],x,'reactive')]
  }
  if(id==='inductor'){
    const L=Math.max(1e-9,(Number(s.inductanceMh)||10)*1e-3)
    return [branch(t[0],t[1],Math.max(.001,2*Math.PI*Math.max(1,frequency)*L),'reactive')]
  }

  if(id==='photodiode'){
    const on=Boolean(s.active)||controlState?.[c.uid]===true
    return [branch(t[0],t[1],on?(Number(s.onResistance)||20):1e9,'diode',{mode:on?'forward':false})]
  }
  if(id==='optocoupler'){
    const on=Boolean(s.active)||controlState?.[c.uid]===true
    return [branch(t[0],t[1],on?(Number(s.outputOnResistance)||40):1e9,'semiconductor')]
  }
  if(['diode','zener','led'].includes(id)){
    const mode=controlState?.[c.uid]
    const on=mode==='forward'||mode==='reverse'
    return [branch(t[0],t[1],on?(Number(s.onResistance)||1.2):1e9,'diode',{mode})]
  }
  if(id==='npn'||id==='pnp'){
    const on=controlState?.[c.uid]===true
    return [branch('B','E',100000,'device'),branch('C','E',on?(Number(s.onResistance)||.18):1e9,'semiconductor')]
  }
  if(id==='mosfet-n'||id==='mosfet-p'){
    const on=controlState?.[c.uid]===true
    return [branch('G','S',1e9,'device'),branch('D','S',on?(Number(s.onResistance)||.05):1e9,'semiconductor')]
  }
  if(id==='scr'){
    const on=controlState?.[c.uid]===true
    return [branch('G','K',100000,'device'),branch('A','K',on?(Number(s.onResistance)||.12):1e9,'semiconductor')]
  }
  if(id==='triac'){
    const on=controlState?.[c.uid]===true
    return [branch('G','MT1',100000,'device'),branch('MT1','MT2',on?(Number(s.onResistance)||.12):1e9,'semiconductor')]
  }
  if(id==='opamp'){
    const out=Number(controlState?.[c.uid]||0)
    return [branch('IN+','V-',10e6,'device'),branch('IN-','V-',10e6,'device'),{uid:c.uid,a:'OUT',b:'V-',kind:'vsource',voltage:out}]
  }
  if(id==='logic-and'||id==='logic-or'||id==='logic-not'){
    const on=controlState?.[c.uid]===true
    return [branch('A','GND',1e6,'device'),...(id==='logic-not'?[]:[branch('B','GND',1e6,'device')]),{uid:c.uid,a:'Y',b:'GND',kind:'vcvs',cp:'V+',cn:'GND',gain:on?1:0}]
  }

  if(['lamp','led-lamp','heater','fan','buzzer','horn','doorbell','bell','pilot-red','pilot-green','indicating-light','annunciator','solenoid-coil','incandescent-lamp','fluorescent-lamp','emergency-light','heating-element','compressor-load','solenoid-valve','ceiling-fan','exhaust-fan','water-heater'].includes(id)){
    const ratedV=Math.max(.1,Number(s.ratedVoltage)||24)
    const watts=Math.max(.1,Number(s.power)||10)
    const r=(ratedV*ratedV)/watts
    return [branch(t[0],t[1],Math.max(.02,r),'load')]
  }
  if(['socket','schuko-socket'].includes(id)) return [branch(t[0],t[1],10e6,'device')]
  if(['motor-1ph','dc-motor','servo','stepper','machine-general','universal-motor','geared-motor','linear-actuator'].includes(id)){
    const ratedV=Math.max(1,Number(s.ratedVoltage)||230)
    const watts=Math.max(1,Number(s.power)||750)/Math.max(.1,Number(s.efficiency)||.82)
    return [branch(t[0],t[1],Math.max(.05,(ratedV*ratedV)/watts),'motor')]
  }
  if(['motor-3ph','induction-motor','synchronous-motor','pump-motor'].includes(id)){
    const ratedV=Math.max(1,Number(s.ratedVoltage)||400)
    const inputPower=Math.max(1,Number(s.power)||2200)/Math.max(.1,Number(s.efficiency)||.82)
    const r=Math.max(.05,3*ratedV*ratedV/inputPower)
    return [branch('U','V',r,'motor'),branch('V','W',r,'motor'),branch('W','U',r,'motor')]
  }

  if(id==='voltmeter'||id==='multimeter'||id==='oscilloscope'||id==='frequency-meter'||id==='power-factor'||id==='ohmmeter') return [branch(t[0],t[1],10e6,'meter')]
  if(id==='ammeter'||id==='clamp-meter'||id==='wattmeter'||id==='energy-meter') return [branch(t[0],t[1],.002,'meter')]
  if(p.type==='meter') return t.length>=2?[branch(t[0],t[1],10e6,'meter')]:[]

  if(['spd','lightning-arrester-gap','lightning-arrester-mov'].includes(id)) return [branch(t[0],t[1],1e9,'protection')]
  if(id==='field-pm') return [branch(t[0],t[1],1e9,'device')]

  if(id==='temperature') return [branch(t[0],t[1],100,'sensor')]
  if(id==='thermocouple') return [{uid:c.uid,a:t[0],b:t[1],kind:'vsource',voltage:.01}]
  if(id==='ldr') return [branch(t[0],t[1],10000,'sensor')]
  if(id==='level-sensor'||id==='pressure-transmitter') return [{uid:c.uid,a:t[0],b:t[1],kind:'isource',current:.012}]
  if(id==='flow-sensor') return [branch(t[0],t[1],100000,'sensor')]

  if(['plc','plc-do','plc-ao','pid','remote-io','counter','encoder','plc-cpu','signal-isolator','signal-converter','io-link-master'].includes(id)){
    const on=Boolean(s.active)||state==='closed'||state==='on'
    const supply=Number(s.supplyVoltage)||24
    const output=Number(s.outputVoltage)||supply
    const gain=(id==='plc-ao'||id==='pid')?(on?Math.min(1,10/supply):0):(on?Math.min(1,output/supply):0)
    const outputPort=id==='encoder'?'IO1':(id==='plc'?'IO2':'IO1')
    return [branch('P+','P-',1200,'device'),branch(id==='encoder'?'IO2':'IO1','P-',1e6,'device'),{uid:c.uid,a:outputPort,b:'P-',kind:'vcvs',cp:'P+',cn:'P-',gain}]
  }
  if(id==='plc-di'||id==='plc-ai') return [branch('P+','P-',2400,'device'),branch('IO1','P-',1e6,'device'),branch('IO2','P-',1e6,'device')]
  if(['hmi','modbus','ethernet-switch'].includes(id)){
    const watts=Math.max(.1,Number(s.power)||5), supply=Math.max(1,Number(s.supplyVoltage)||24)
    return [branch(t[0],t[1],(supply*supply)/watts,'device')]
  }

  if(p.type==='voltage'&&t.length>=2) return [{uid:c.uid,a:t[0],b:t[1],kind:'vsource',voltage:Number(s.voltage)||24}]
  if(p.type==='load'&&t.length>=2){
    const ratedV=Math.max(.1,Number(s.ratedVoltage)||230),watts=Math.max(.1,Number(s.power)||50)
    return [branch(t[0],t[1],Math.max(.02,(ratedV*ratedV)/watts),'load')]
  }
  if(p.type==='protection'&&t.length>=2) return state==='open'?[]:[branch(t[0],t[1],s.contactResistance||.02,'protection')]
  if(p.type==='switch'&&t.length>=2) return closed?[branch(t[0],t[1],s.contactResistance||.02,'switch')]:[]
  if(p.type==='convert'&&t.length>=4){
    const gain=(Number(s.secondaryVoltage)||24)/Math.max(.1,Number(s.primaryVoltage)||230)
    return [branch(t[0],t[1],50000,'device'),{uid:c.uid,a:t[2],b:t[3],kind:'vcvs',cp:t[0],cn:t[1],gain}]
  }
  if(p.type==='sensor'&&t.length>=2) return [branch(t[0],t[1],100000,'sensor')]
  if(p.type==='logic'&&t.length>=2) return [branch(t[0],t[1],100000,'device')]
  if(p.type==='passive'&&t.length>=2) return [branch(t[0],t[1],Math.max(.001,Number(s.resistance)||1000),'resistor')]
  if(t.length>=2) return [branch(t[0],t[1],1e6,'device')]
  return []
}

function stampConductance(A,nodeIndex,a,b,g){
  const ia=nodeIndex.get(a), ib=nodeIndex.get(b)
  if(ia!==undefined) A[ia][ia]+=g
  if(ib!==undefined) A[ib][ib]+=g
  if(ia!==undefined&&ib!==undefined){A[ia][ib]-=g;A[ib][ia]-=g}
}

function sourceTerminalPairs(part){
  const id=part?.id||''
  if(id==='dual-dc-supply') return [['+','COM'],['COM','-']]
  if(['three-phase','three-phase-delta','three-phase-wye','three-phase-wye-grounded','three-phase-open-delta'].includes(id)) return [['L1','N'],['L2','N'],['L3','N']]
  const ts=getTerminals(part)
  return ts.length>=2?[[ts[0].id,ts[1].id]]:[]
}

export function simulateCircuit(components,wires,parts,{frequency=50,applyProtection=true}={}){
  const byId=new Map(parts.map(p=>[p.id,p]))
  const uf=new UF()
  for(const c of components){
    const p=byId.get(c.partId); if(!p)continue
    for(const t of getTerminals(p)) uf.add(`${c.uid}:${t.id}`)
  }
  for(const w of wires){
    const a=typeof w.a==='string'?`${w.a}:2`:`${w.a.uid}:${w.a.port}`
    const b=typeof w.b==='string'?`${w.b}:1`:`${w.b.uid}:${w.b.port}`
    uf.union(a,b)
  }

  const terminalNode=new Map()
  for(const c of components){
    const p=byId.get(c.partId); if(!p)continue
    for(const t of getTerminals(p)) terminalNode.set(`${c.uid}:${t.id}`,uf.find(`${c.uid}:${t.id}`))
  }

  let groundRoot=null
  for(const c of components){
    const p=byId.get(c.partId); if(!p)continue
    if(['earth','chassis-ground','neutral','earth-terminal'].includes(p.id)){
      const t=getTerminals(p)[0]
      groundRoot=terminalNode.get(`${c.uid}:${t.id}`); if(groundRoot)break
    }
  }
  if(!groundRoot){
    const source=components.find(c=>byId.get(c.partId)?.type==='voltage')
    if(source){
      const p=byId.get(source.partId), ts=getTerminals(p)
      const preferred=ts.find(t=>t.id==='N')||ts[1]||ts[0]
      groundRoot=terminalNode.get(`${source.uid}:${preferred.id}`)
    }
  }

  const nodeRoots=[...new Set(terminalNode.values())]
  if(!groundRoot) groundRoot=nodeRoots[0]||'GND'
  const nonGround=nodeRoots.filter(n=>n!==groundRoot)
  const nodeIndex=new Map(nonGround.map((n,i)=>[n,i]))

  const directShortSources=[]
  for(const c of components){
    const p=byId.get(c.partId); if(p?.type!=='voltage') continue
    for(const [a,b] of sourceTerminalPairs(p)){
      const na=terminalNode.get(`${c.uid}:${a}`), nb=terminalNode.get(`${c.uid}:${b}`)
      if(na && nb && na===nb){directShortSources.push(c.uid);break}
    }
  }

  let controlState={}
  let final=null
  for(let iteration=0;iteration<10;iteration++){
    const branches=[]
    for(const c of components){const p=byId.get(c.partId); if(p)branches.push(...componentBranches(c,p,controlState,frequency))}
    const sources=branches.filter(b=>b.kind==='vsource'||b.kind==='vcvs')
    const N=nonGround.length,M=sources.length,size=N+M
    const A=Array.from({length:size},()=>Array(size).fill(0)), z=Array(size).fill(0)
    for(let i=0;i<N;i++) A[i][i]+=EPS

    const root=(uid,port)=>terminalNode.get(`${uid}:${port}`)
    for(const br of branches){
      if(br.kind==='vsource'||br.kind==='vcvs') continue
      const a=root(br.uid,br.a), b=root(br.uid,br.b)
      if(a===undefined||b===undefined)continue
      if(br.kind==='isource'){
        const ia=nodeIndex.get(a), ib=nodeIndex.get(b)
        if(ia!==undefined) z[ia]-=br.current
        if(ib!==undefined) z[ib]+=br.current
      } else stampConductance(A,nodeIndex,a,b,1/br.r)
    }
    sources.forEach((br,k)=>{
      const row=N+k, a=root(br.uid,br.a), b=root(br.uid,br.b), ia=nodeIndex.get(a), ib=nodeIndex.get(b)
      if(ia!==undefined){A[ia][row]+=1;A[row][ia]+=1}
      if(ib!==undefined){A[ib][row]-=1;A[row][ib]-=1}
      if(br.kind==='vsource') z[row]=br.voltage
      else{
        const cp=root(br.uid,br.cp), cn=root(br.uid,br.cn), icp=nodeIndex.get(cp), icn=nodeIndex.get(cn)
        if(icp!==undefined) A[row][icp]-=br.gain
        if(icn!==undefined) A[row][icn]+=br.gain
      }
    })
    const x=solveLinear(A,z)
    const V=(n)=>n===groundRoot?0:(x[nodeIndex.get(n)]||0)
    const componentResults={}

    for(const c of components){
      const p=byId.get(c.partId); if(!p)continue
      const settings=cfg(c,p)
      const ts=getTerminals(p)
      const terminalVoltages={}
      ts.forEach(t=>terminalVoltages[t.id]=V(terminalNode.get(`${c.uid}:${t.id}`)))
      const own=branches.filter(b=>b.uid===c.uid)
      let current=0,power=0
      for(const br of own){
        const va=terminalVoltages[br.a]??0,vb=terminalVoltages[br.b]??0
        let i=0
        if(br.kind==='vsource'||br.kind==='vcvs'){
          const si=sources.indexOf(br); i=si>=0?-(x[N+si]||0):0
        } else if(br.kind==='isource') i=br.current
        else i=(va-vb)/br.r
        if(Math.abs(i)>Math.abs(current))current=i
        power+=Math.abs((va-vb)*i)
      }
      const vals=Object.values(terminalVoltages)
      const voltage=vals.length>=2?Math.max(...vals)-Math.min(...vals):(vals[0]||0)
      const terminalPotential=vals.length?Math.max(...vals.map(v=>Math.abs(v))):0
      const coilV=Math.abs((terminalVoltages.A1||0)-(terminalVoltages.A2||0))
      const currentFlow=Math.abs(current)>.0005
      const powered=Math.abs(voltage)>.5 || terminalPotential>.5 || currentFlow || coilV>5
      let operating=false,level=0,stateLabel='IDLE'
      if(p.type==='voltage'){
        operating=Math.abs(voltage)>.1||terminalPotential>.1; level=operating?1:0; stateLabel=operating?'SOURCE READY':'SOURCE OFF'
      } else if(p.type==='load'){
        const rated=Math.max(.1,Number(settings.ratedVoltage)||12)
        const ratio=Math.abs(voltage)/rated
        level=clamp(ratio,0,1)
        operating=ratio>=(Number(settings.minimumOperatingRatio)||.35)&&currentFlow
        if(['motor-1ph','motor-3ph','dc-motor','servo','stepper','machine-general','induction-motor','synchronous-motor','universal-motor','geared-motor','pump-motor','linear-actuator','compressor-load'].includes(p.id)) stateLabel=operating?'RUNNING':powered?'POWER PRESENT':'STOPPED'
        else if(['lamp','led-lamp','pilot-red','pilot-green','indicating-light','incandescent-lamp','fluorescent-lamp','emergency-light'].includes(p.id)) stateLabel=operating?'LIT':powered?'POWER PRESENT':'OFF'
        else if(['buzzer','horn','doorbell','bell'].includes(p.id)) stateLabel=operating?'SOUNDING':powered?'POWER PRESENT':'OFF'
        else if(['heater','heating-element','water-heater'].includes(p.id)) stateLabel=operating?'HEATING':powered?'POWER PRESENT':'OFF'
        else if(['fan','ceiling-fan','exhaust-fan'].includes(p.id)) stateLabel=operating?'SPINNING':powered?'POWER PRESENT':'OFF'
        else stateLabel=operating?'WORKING':powered?'POWER PRESENT':'OFF'
      } else if(['contactor','control-relay','timer-relay','latching-relay','safety-relay','star-delta-timer','impulse-relay','contactor-4p','earth-leakage-relay','undervoltage-relay','overvoltage-relay','phase-sequence-relay'].includes(p.id)){
        operating=Boolean(controlState[c.uid]); level=operating?1:0; stateLabel=operating?'COIL ENERGIZED':powered?'POWER PRESENT':'COIL OFF'
      } else if(p.type==='switch'||p.type==='protection'){
        const closed=c.state!=='open'
        operating=closed&&powered; level=operating?1:0
        stateLabel=closed?(operating?'POWERED • CLOSED':'CLOSED'):'OPEN'
      } else if(p.type==='sensor'){
        const triggered=Boolean(settings.active)||c.state==='closed'
        operating=powered&&(triggered||['temperature','thermocouple','ldr','level-sensor','pressure-transmitter','flow-sensor'].includes(p.id))
        level=operating?1:0; stateLabel=operating?(triggered?'SENSING • ACTIVE':'SENSING'):powered?'POWERED':'IDLE'
      } else if(p.type==='meter'){
        operating=powered; level=operating?1:0; stateLabel=operating?'MEASURING':'READY'
      } else if(p.type==='drive'){
        operating=powered; level=operating?1:0; stateLabel=operating?'DRIVE ACTIVE':'IDLE'
      } else if(p.type==='convert'){
        operating=powered; level=operating?1:0; stateLabel=operating?'CONVERTING':'IDLE'
      } else if(p.type==='logic'){
        operating=powered; level=operating?1:0; stateLabel=operating?(Boolean(settings.active)||controlState[c.uid]?'OUTPUT ACTIVE':'PROCESSING'):'IDLE'
      } else if(p.type==='semiconductor'){
        operating=currentFlow; level=operating?1:0; stateLabel=operating?'CONDUCTING':powered?'BIASED':'OFF'
      } else if(p.type==='passive'){
        operating=currentFlow; level=operating?1:0; stateLabel=operating?'CONDUCTING':powered?'ENERGIZED':'IDLE'
      } else if(p.type==='wire'){
        operating=currentFlow; level=operating?1:0; stateLabel=operating?'CONDUCTING':powered?'LIVE':'IDLE'
      } else {
        operating=powered; level=operating?1:0; stateLabel=operating?'WORKING':'IDLE'
      }
      const energized=powered
      componentResults[c.uid]={terminalVoltages,voltage:Math.abs(voltage),current,power,energized,operating,level,stateLabel,coilV,contactClosed:controlState[c.uid]||false}
    }

    const nextControl={...controlState}
    let changed=false
    for(const c of components){
      const p=byId.get(c.partId); if(!p)continue
      const r=componentResults[c.uid]; if(!r)continue
      const s=cfg(c,p), tv=r.terminalVoltages
      let next=nextControl[c.uid]
      if(['contactor','control-relay','timer-relay','latching-relay','safety-relay','star-delta-timer','impulse-relay','contactor-4p'].includes(c.partId)){
        next=r.coilV>=(Number(s.coilVoltage)||24)*(Number(s.pickupRatio)||.7)
      } else if(c.partId==='undervoltage-relay'){
        const sensed=Math.abs((tv.A1||0)-(tv.A2||0)); next=sensed>=(Number(s.thresholdVoltage)||180)
      } else if(c.partId==='overvoltage-relay'){
        const sensed=Math.abs((tv.A1||0)-(tv.A2||0)); next=sensed>0&&sensed<=(Number(s.thresholdVoltage)||255)
      } else if(c.partId==='phase-sequence-relay'){
        const sensed=Math.abs((tv.A1||0)-(tv.A2||0)); next=sensed>=(Number(s.thresholdVoltage)||320)
      } else if(c.partId==='earth-leakage-relay'){
        const sensed=Math.abs((tv.A1||0)-(tv.A2||0)); next=sensed>10
      } else if(c.partId==='varistor'){
        const a=tv['1']||0,b=tv['2']||0; next=Math.abs(a-b)>=(Number(s.clampVoltage)||275)
      } else if(c.partId==='photodiode'||c.partId==='optocoupler'){
        next=Boolean(s.active)
      } else if(c.partId==='diode'||c.partId==='led'){
        const a=tv['1']||0,k=tv['2']||0,threshold=Number(s.forwardVoltage)||.7
        next=(a-k)>=threshold?'forward':false
      } else if(c.partId==='zener'){
        const a=tv['1']||0,k=tv['2']||0,z=Number(s.zenerVoltage)||5.1
        next=(a-k)>=(Number(s.forwardVoltage)||.7)?'forward':((k-a)>=z?'reverse':false)
      } else if(c.partId==='npn') next=((tv.B||0)-(tv.E||0))>=(Number(s.thresholdVoltage)||.65)
      else if(c.partId==='pnp') next=((tv.E||0)-(tv.B||0))>=(Number(s.thresholdVoltage)||.65)
      else if(c.partId==='mosfet-n') next=((tv.G||0)-(tv.S||0))>=(Number(s.thresholdVoltage)||3)
      else if(c.partId==='mosfet-p') next=((tv.S||0)-(tv.G||0))>=(Number(s.thresholdVoltage)||3)
      else if(c.partId==='scr'){
        const trigger=((tv.G||0)-(tv.K||0))>=(Number(s.gateThreshold)||.8), forward=((tv.A||0)-(tv.K||0))>.2
        next=(nextControl[c.uid]===true&&forward)||trigger
      } else if(c.partId==='triac') next=Math.abs((tv.G||0)-(tv.MT1||0))>=(Number(s.gateThreshold)||.8)
      else if(c.partId==='opamp'){
        const vp=tv['V+']||0, vm=tv['V-']||0, diff=(tv['IN+']||0)-(tv['IN-']||0), span=Math.max(0,vp-vm)
        next=clamp(span/2+diff*(Number(s.gain)||1000),0,span)
      } else if(c.partId==='logic-and'||c.partId==='logic-or'||c.partId==='logic-not'){
        const g=tv.GND||0, supply=Math.max(.1,(tv['V+']||0)-g), high=supply*(Number(s.logicThreshold)||.55)
        const A=(tv.A||0)-g>high, B=(tv.B||0)-g>high
        next=c.partId==='logic-and'?(A&&B):c.partId==='logic-or'?(A||B):!A
      } else continue
      if(nextControl[c.uid]!==next){nextControl[c.uid]=next;changed=true}
    }
    final={x,V,componentResults,branches,sources,terminalNode,groundRoot,nodeIndex,controlState:nextControl}
    controlState=nextControl
    if(!changed)break
  }

  const componentResults=final?.componentResults||{}
  const trips=[]
  const overcurrentIds=['fuse','mcb','mccb','rcbo','motor-protector','thermal-relay','circuit-breaker','power-breaker','cb-3pole-magnetic','drawout-breaker','afdd','thermal-fuse','surge-fuse-combo']
  for(const c of components){
    const p=byId.get(c.partId); if(!p||!overcurrentIds.includes(p.id))continue
    const s=cfg(c,p), rated=Math.max(.001,Number(s.ratedCurrent)||16), amps=Math.abs(componentResults[c.uid]?.current||0)
    if(amps>rated*(Number(s.tripMultiplier)||1.05)) trips.push({uid:c.uid,name:p.name,current:amps,rated})
  }

  const sourcesCount=components.filter(c=>byId.get(c.partId)?.type==='voltage').length
  const loadsCount=components.filter(c=>byId.get(c.partId)?.type==='load').length
  const protections=components.filter(c=>byId.get(c.partId)?.type==='protection').length
  const meters=components.filter(c=>byId.get(c.partId)?.type==='meter').length
  const activeLoads=components.filter(c=>byId.get(c.partId)?.type==='load'&&componentResults[c.uid]?.operating).length
  const maxV=Math.max(0,...Object.values(componentResults).map(r=>r.voltage||0))
  const totalLoadPower=components.reduce((sum,c)=>sum+(byId.get(c.partId)?.type==='load'?(componentResults[c.uid]?.power||0):0),0)
  const sourceCurrent=Math.max(0,...components.filter(c=>byId.get(c.partId)?.type==='voltage').map(c=>Math.abs(componentResults[c.uid]?.current||0)))
  const shortCircuit=directShortSources.length>0||sourceCurrent>500

  if(applyProtection && trips.length){
    const trippedIds=new Set(trips.map(t=>t.uid))
    const opened=components.map(c=>trippedIds.has(c.uid)?{...c,state:'open'}:c)
    const after=simulateCircuit(opened,wires,parts,{frequency,applyProtection:false})
    return {...after,trips,trippedUids:[...trippedIds],preTripCurrent:sourceCurrent,status:'Protection tripped'}
  }

  let status='Ready'
  if(!components.length) status='Ready'
  else if(sourcesCount===0) status='No power source'
  else if(shortCircuit) status='SHORT CIRCUIT'
  else if(sourceCurrent>.001) status='Circuit energized'
  else if(maxV>.1) status='Source present • circuit open'
  else status='Open circuit / no current'

  const wireResults={}
  for(const w of wires){
    const ae=typeof w.a==='string'?{uid:w.a,port:'2'}:w.a
    const be=typeof w.b==='string'?{uid:w.b,port:'1'}:w.b
    const n=terminalNode.get(`${ae.uid}:${ae.port}`)
    const v=n===groundRoot?0:(final?.V(n)||0)
    const endpointCurrent=Math.max(Math.abs(componentResults[ae.uid]?.current||0),Math.abs(componentResults[be.uid]?.current||0))
    wireResults[w.uid]={voltage:v,current:endpointCurrent,energized:Math.abs(v)>.5||endpointCurrent>.001,returnPath:Math.abs(v)<=.5&&endpointCurrent>.001}
  }

  return {status,componentResults,wireResults,trips,shortCircuit,directShortSources,sources:sourcesCount,loads:loadsCount,activeLoads,protections,meters,voltage:maxV,current:sourceCurrent,watts:totalLoadPower,frequency}
}

export function meterDisplay(part,result,frequency=50){
  if(!part||!result)return {value:0,unit:''}
  const id=part.id
  if(id==='voltmeter'||id==='multimeter'||id==='oscilloscope') return {value:result.voltage,unit:'V'}
  if(id==='ammeter'||id==='clamp-meter') return {value:Math.abs(result.current),unit:'A'}
  if(id==='wattmeter') return {value:result.power,unit:'W'}
  if(id==='energy-meter') return {value:result.power/1000,unit:'kW'}
  if(id==='frequency-meter') return {value:frequency,unit:'Hz'}
  if(id==='power-factor') return {value:1,unit:'cosφ'}
  if(id==='ohmmeter') return {value:result.current?result.voltage/Math.abs(result.current):Infinity,unit:'Ω'}
  return {value:result.voltage,unit:'V'}
}
