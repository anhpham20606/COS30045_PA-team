/* ch3_roaduser.js | Chapter 3: dumbbell chart (2011 vs 2021) + 100% stacked area, linked highlighting.
   GenAI: generated with Claude (Anthropic); reviewed by the team. */
import {C,KEYS,COL,ICON,group} from '../config.js';import {fmt,pct,makeFig,addTable,svgIn,tipOn,segmented,onResize,highlight} from '../utils.js';
export function render(el,D){
  const by=d3.rollup(D.share,v=>d3.sum(v,d=>d.hospitalisations),d=>group(d.road_user),d=>d.year);
  const tot=y=>d3.sum(KEYS,k=>by.get(k)?.get(y)||0);let mode='count';
  const f1=makeFig(el,{title:'Cyclists up 51%, pedestrians down 15%',sub:'Hospitalisations by road user, 2011 (grey) vs 2021 (colour)',cls:'c3'});
  const chips=f1.f.insert('div','.box').attr('class','chips').attr('role','group').attr('aria-label','Highlight a road user');
  chips.selectAll('button').data(KEYS).join('button').attr('class','chip').attr('type','button').html(k=>`<i style="background:${COL[k]}"></i>${k}`)
    .on('mouseenter focus',(e,k)=>highlight(el,k)).on('mouseleave blur',()=>highlight(el,null)).on('click',(e,k)=>{highlight(el,k);});
  segmented(f1.ctl,[['count','Cases'],['share','Share of all cases (%)']],mode,m=>{mode=m;draw();},'Dumbbell units');
  const f2=makeFig(el,{title:'The mix is shifting towards cyclists',sub:'Share of all hospitalisations by road user (100% stacked area)',cls:'c3'});
  addTable(f1,['Road user','2011','2021','Change'],KEYS.map(k=>[k,fmt(by.get(k).get(2011)),fmt(by.get(k).get(2021)),pct((by.get(k).get(2021)/by.get(k).get(2011)-1)*100)]));
  function draw(){
    const v=(k,y)=>mode==='count'?by.get(k).get(y):by.get(k).get(y)/tot(y)*100;
    const order=[...KEYS].sort((a,b)=>by.get(b).get(2021)/by.get(b).get(2011)-by.get(a).get(2021)/by.get(a).get(2011));
    const s=svgIn(f1.box,order.length*44+50,{t:30,r:70,b:20,l:Math.min(190,innerWidth*.4)},'Dumbbell chart of change in hospitalisations by road user, cyclists rose most');
    const x=d3.scaleLinear([0,d3.max(order,k=>Math.max(v(k,2011),v(k,2021)))*1.08],[0,s.w]),y=d3.scaleBand(order,[0,s.h]).padding(.3);
    s.g.append('g').attr('class','ax').call(d3.axisTop(x).ticks(5).tickFormat(d=>mode==='count'?d3.format(',')(d):d+'%'));
    const row=s.g.selectAll('g.r').data(order).join('g').attr('class','r').attr('data-g',k=>k).attr('transform',k=>`translate(0,${y(k)+y.bandwidth()/2})`);
    row.append('line').attr('x1',k=>x(v(k,2011))).attr('x2',k=>x(v(k,2021))).attr('stroke',k=>COL[k]==='#F0E442'?C.ink:COL[k]).attr('stroke-width',5);
    row.append('circle').attr('cx',k=>x(v(k,2011))).attr('r',8).attr('fill','#fff').attr('stroke',C.ink).attr('stroke-width',3);
    row.append('circle').attr('cx',k=>x(v(k,2021))).attr('r',9).attr('fill',k=>COL[k]).attr('stroke',C.ink).attr('stroke-width',3);
    row.append('text').attr('x',-34).attr('y',5).attr('text-anchor','end').attr('font-size',15).text(k=>k);
    row.filter(k=>ICON[k]).append('image').attr('href',k=>`assets/img/${ICON[k]}.png`).attr('x',-30).attr('y',-14).attr('height',28).attr('width',28).attr('preserveAspectRatio','xMidYMid meet').style('image-rendering','pixelated');
    row.append('text').attr('x',k=>x(Math.max(v(k,2011),v(k,2021)))+16).attr('y',5).attr('font-weight',700).attr('font-size',15).text(k=>pct((by.get(k).get(2021)/by.get(k).get(2011)-1)*100));
    tipOn(row,k=>`<b>${k}</b><br>2011: ${fmt(by.get(k).get(2011))} (${(by.get(k).get(2011)/tot(2011)*100).toFixed(1)}%)<br>2021: ${fmt(by.get(k).get(2021))} (${(by.get(k).get(2021)/tot(2021)*100).toFixed(1)}%)`)
      .on('mouseenter.h focus.h',(e,k)=>highlight(el,k)).on('mouseleave.h blur.h',()=>highlight(el,null));
    // stacked area
    const years=d3.range(2011,2022),data=years.map(yr=>Object.assign({year:yr},...KEYS.map(k=>({[k]:by.get(k).get(yr)}))));
    const t=svgIn(f2.box,340,{t:10,r:20,b:30,l:48},'100 percent stacked area chart of road-user shares, 2011 to 2021');
    const x2=d3.scaleLinear([2011,2021],[0,t.w]),y2=d3.scaleLinear([0,1],[t.h,0]);
    const st=d3.stack().keys(KEYS).offset(d3.stackOffsetExpand)(data);
    t.g.append('g').attr('class','ax').attr('transform',`translate(0,${t.h})`).call(d3.axisBottom(x2).ticks(Math.min(11,Math.floor(t.w/55))).tickFormat(d3.format('d')));
    t.g.append('g').attr('class','ax').call(d3.axisLeft(y2).ticks(5).tickFormat(d3.format('.0%')));
    const layers=t.g.selectAll('path').data(st).join('path').attr('data-g',d=>d.key).attr('fill',d=>COL[d.key]).attr('stroke','#fff').attr('stroke-width',1.5)
      .attr('d',d3.area().x(d=>x2(d.data.year)).y0(d=>y2(d[0])).y1(d=>y2(d[1]))).attr('aria-label',d=>d.key);
    tipOn(layers,d=>`<b>${d.key}</b><br>${(by.get(d.key).get(2011)/tot(2011)*100).toFixed(1)}% in 2011 → ${(by.get(d.key).get(2021)/tot(2021)*100).toFixed(1)}% in 2021`)
      .on('mouseenter.h focus.h',(e,d)=>highlight(el,d.key)).on('mouseleave.h blur.h',()=>highlight(el,null));
  }
  draw();onResize(draw);
}
