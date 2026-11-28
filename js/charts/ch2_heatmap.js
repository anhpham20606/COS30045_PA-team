/* ch2_heatmap.js | Chapter 2: calendar-style heatmap (year x month) + 2019 vs 2020 lines.
   GenAI: generated with Claude (Anthropic); reviewed by the team. */
import {C} from '../config.js';import {fmt,pct,makeFig,addTable,svgIn,tipOn,onResize} from '../utils.js';
const MON=['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
export function render(el,D){
  const rows=D.monthly,get=(y,m)=>rows.find(d=>d.year===y&&d.month_num===m)?.hospitalisations;
  const f1=makeFig(el,{title:'The April 2020 dip stands out',sub:'Hospitalisations per month, darker = more cases'});
  const f2=makeFig(el,{title:'April 2020 vs April 2019: −32%',sub:'Monthly hospitalisations, 2019 (grey) vs 2020 (orange-red)'});
  addTable(f1,['Year','Month','Cases'],rows.map(d=>[d.year,MON[d.month_num-1],fmt(d.hospitalisations)]));
  function draw(){
    const years=d3.range(2011,2022),s=svgIn(f1.box,400,{t:36,r:10,b:10,l:50},'Heatmap of monthly hospitalisations by year; March to May 2020 is the lowest');
    const x=d3.scaleBand(d3.range(1,13),[0,s.w]).padding(.06),y=d3.scaleBand(years,[0,s.h]).padding(.08);
    const col=d3.scaleSequential(d3.interpolateBlues).domain([d3.min(rows,d=>d.hospitalisations)*.85,d3.max(rows,d=>d.hospitalisations)]);
    s.g.selectAll('.mt').data(d3.range(1,13)).join('text').attr('x',d=>x(d)+x.bandwidth()/2).attr('y',-10).attr('text-anchor','middle').attr('font-size',13).text(d=>MON[d-1]);
    s.g.selectAll('.yt').data(years).join('text').attr('x',-8).attr('y',d=>y(d)+y.bandwidth()/2+5).attr('text-anchor','end').attr('font-size',14).text(d=>d);
    const cells=s.g.selectAll('rect').data(rows).join('rect').attr('x',d=>x(d.month_num)).attr('y',d=>y(d.year)).attr('width',x.bandwidth()).attr('height',y.bandwidth())
      .attr('fill',d=>col(d.hospitalisations)).attr('stroke',d=>d.year===2020&&d.month_num>=3&&d.month_num<=5?C.hi:'none').attr('stroke-width',4)
      .attr('aria-label',d=>`${MON[d.month_num-1]} ${d.year}: ${fmt(d.hospitalisations)} cases`);
    tipOn(cells,d=>{const p=get(d.year-1,d.month_num);return `<b>${MON[d.month_num-1]} ${d.year}</b><br>${fmt(d.hospitalisations)} cases`+(p?`<br>${pct((d.hospitalisations/p-1)*100)} vs ${MON[d.month_num-1]} ${d.year-1}`:'');});
    // value text inside cells when there is room
    if(x.bandwidth()>34)s.g.selectAll('.v').data(rows).join('text').attr('x',d=>x(d.month_num)+x.bandwidth()/2).attr('y',d=>y(d.year)+y.bandwidth()/2+4).attr('text-anchor','middle').attr('font-size',11)
      .style('fill',d=>d3.lab(col(d.hospitalisations)).l>55?C.ink:'#fff').style('pointer-events','none').text(d=>fmt(d.hospitalisations));
    // line pair
    const t=svgIn(f2.box,320,{t:20,r:60,b:30,l:56},'Line chart comparing monthly cases in 2019 and 2020');
    const x2=d3.scaleLinear([1,12],[0,t.w]),y2=d3.scaleLinear([1500,4200],[t.h,0]);
    t.g.append('g').attr('class','ax').attr('transform',`translate(0,${t.h})`).call(d3.axisBottom(x2).ticks(12).tickFormat(d=>MON[d-1]));
    t.g.append('g').attr('class','ax').call(d3.axisLeft(y2).ticks(5).tickFormat(d3.format(',')));
    t.g.append('text').attr('x',-t.h/2).attr('y',-42).attr('transform','rotate(-90)').attr('text-anchor','middle').attr('font-size',13).text('Cases (axis starts at 1,500)');
    [[2019,C.grey,'4 4'],[2020,C.hi,null]].forEach(([yr,c,da])=>{
      t.g.append('path').datum(d3.range(1,13)).attr('fill','none').attr('stroke',c).attr('stroke-width',4).attr('stroke-dasharray',da).attr('d',d3.line().x(m=>x2(m)).y(m=>y2(get(yr,m))));
      t.g.append('text').attr('x',x2(12)+8).attr('y',y2(get(yr,12))+5).attr('font-weight',700).text(yr);});
    t.g.append('line').attr('x1',x2(4)).attr('x2',x2(4)).attr('y1',y2(3488)).attr('y2',y2(2357)).attr('stroke',C.ink).attr('stroke-width',3);
    t.g.append('text').attr('x',x2(4)+10).attr('y',y2(2900)+5).attr('font-weight',700).text('−32% in April');
  }
  draw();onResize(draw);
}
