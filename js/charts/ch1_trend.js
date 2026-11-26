/* ch1_trend.js | Chapter 1: indexed line / area with series-break annotations.
   GenAI: generated with Claude (Anthropic); reviewed by the team. */
import {C} from '../config.js';import {fmt,makeFig,addTable,svgIn,tipOn,segmented,onResize} from '../utils.js';
export function render(el,D){
  const rows=D.summary;let mode='index';
  const fig=makeFig(el,{title:'Cases climbed 16% over eleven years',sub:'Hospitalised road-crash injuries per year, Australia'});
  segmented(fig.ctl,[['index','Index (2011 = 100)'],['count','Cases']],mode,m=>{mode=m;draw();},'Chart units');
  addTable(fig,['Year','Cases','Index (2011=100)','% change vs previous year'],rows.map(d=>[d.year,fmt(d.hospitalisations),d.index_2011.toFixed(1),d.pct_change==null?'-':d.pct_change.toFixed(1)+'%']));
  function draw(){
    const s=svgIn(fig.box,380,{t:44,r:64,b:34,l:62},'Line chart of yearly hospitalisations, 2011 to 2021, rising 16 percent');
    const val=d=>mode==='index'?d.index_2011:d.hospitalisations;
    const x=d3.scaleLinear([2011,2021],[0,s.w]);
    const y=d3.scaleLinear(mode==='index'?[92,d3.max(rows,val)+4]:[0,d3.max(rows,val)*1.1],[s.h,0]);
    s.g.append('g').attr('class','ax').attr('transform',`translate(0,${s.h})`).call(d3.axisBottom(x).ticks(Math.min(11,Math.floor(s.w/55))).tickFormat(d3.format('d')));
    s.g.append('g').attr('class','ax').call(d3.axisLeft(y).ticks(6).tickFormat(mode==='index'?d3.format('d'):d3.format(',')));
    s.g.append('text').attr('x',-s.h/2).attr('y',-48).attr('transform','rotate(-90)').attr('text-anchor','middle').attr('font-size',14).text(mode==='index'?'Index (2011 = 100)':'Hospitalisations');
    if(mode==='index')s.g.append('line').attr('x1',0).attr('x2',s.w).attr('y1',y(100)).attr('y2',y(100)).attr('stroke','#6b6b85').attr('stroke-dasharray','4 4');
    else s.g.append('path').datum(rows).attr('fill',C.hi).attr('opacity',.15).attr('d',d3.area().x(d=>x(d.year)).y0(s.h).y1(d=>y(val(d))));
    // Annotations: counting-rule changes (series breaks)
    [[2012,'2012: Victoria counting change',0],[2017,'2017: NSW counting change',16]].forEach(([yr,t,dy])=>{
      s.g.append('line').attr('x1',x(yr)).attr('x2',x(yr)).attr('y1',-6).attr('y2',s.h).attr('stroke',C.ink).attr('stroke-dasharray','3 4');
      s.g.append('text').attr('x',x(yr)+6).attr('y',-18+dy*0).attr('font-size',13).attr('dy',dy?'-0.2em':0).text(t).attr('transform',dy?'translate(0,-14)':null);});
    const path=s.g.append('path').datum(rows).attr('fill','none').attr('stroke',C.hi).attr('stroke-width',4).attr('d',d3.line().x(d=>x(d.year)).y(d=>y(val(d))));
    if(!matchMedia('(prefers-reduced-motion: reduce)').matches){const L=path.node().getTotalLength();path.attr('stroke-dasharray',L).attr('stroke-dashoffset',L).transition().duration(1200).ease(d3.easeLinear).attr('stroke-dashoffset',0);}
    const dots=s.g.selectAll('circle').data(rows).join('circle').attr('cx',d=>x(d.year)).attr('cy',d=>y(val(d))).attr('r',6).attr('fill','#fff').attr('stroke',C.hi).attr('stroke-width',3)
      .attr('aria-label',d=>`${d.year}: ${fmt(d.hospitalisations)} cases`);
    tipOn(dots,d=>`<b>${d.year}</b><br>${fmt(d.hospitalisations)} cases<br>${d.pct_change==null?'Baseline year':(d.pct_change>0?'+':'')+d.pct_change.toFixed(1)+'% vs previous year'}`);
    const last=rows[rows.length-1];s.g.append('text').attr('x',x(2021)+10).attr('y',y(val(last))+5).attr('font-weight',700).attr('fill',C.hi).text(mode==='index'?'+16%':fmt(last.hospitalisations)).style('fill',C.hi);
  }
  draw();onResize(draw);
}
