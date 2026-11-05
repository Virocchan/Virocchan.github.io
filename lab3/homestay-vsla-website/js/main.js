/* Homestay Vsla: shared motion (header, reveal on scroll, count-up, hero parallax) */
(function(){
 var rm=matchMedia('(prefers-reduced-motion: reduce)').matches,hd=document.querySelector('header'),hi=document.querySelector('.hero>img');
 function sc(){hd.classList.toggle('sc',scrollY>60);if(!rm&&scrollY<innerHeight*1.2)hi&&hi.style.setProperty('--py',Math.min(scrollY*.12,100)+'px')}
 addEventListener('scroll',sc,{passive:true});sc();
 if(!rm&&'IntersectionObserver' in window){
  document.documentElement.classList.add('js');
  var io=new IntersectionObserver(function(es){es.forEach(function(x){if(x.isIntersecting){x.target.classList.add('in');io.unobserve(x.target)}})},{threshold:.15,rootMargin:'0px 0px -6% 0px'});
  document.querySelectorAll('section:not(.hero) h2,.hl>div,.house .split>div>*,.walk .split>div>*,.pf figure,.cta .wrap>*').forEach(function(el){el.style.setProperty('--d',(Array.prototype.indexOf.call(el.parentNode.children,el)*.12)+'s');el.classList.add('rv');io.observe(el)});
  var io2=new IntersectionObserver(function(es){es.forEach(function(x){if(x.isIntersecting){var m=x.target.querySelector('.rvimg');if(m)m.classList.add('in');io2.unobserve(x.target)}})},{threshold:.2});
  document.querySelectorAll('.house .split>img,.walk .split>img').forEach(function(el){el.classList.add('rvimg');io2.observe(el.parentNode)});
  var co2=new IntersectionObserver(function(es){es.forEach(function(x){if(!x.isIntersecting)return;co2.unobserve(x.target);var el=x.target,to=parseInt(el.textContent,10),t0=null;el.textContent='0';(function f(t){if(!t0)t0=t;var p=Math.min((t-t0)/1500,1);el.textContent=Math.round(to*(1-Math.pow(1-p,3)));if(p<1)requestAnimationFrame(f)})(performance.now())})},{threshold:.8});
  document.querySelectorAll('.facts b').forEach(function(el){co2.observe(el)});
 }
 // Video background playback, sound toggle & visibility pause
 var hv=document.querySelector('.hero-video'),st=document.getElementById('soundToggle');
 if(hv){
  if(rm){
   hv.pause();
  }else{
   var pp=hv.play();
   if(pp&&pp.catch){
    pp.catch(function(){hv.muted=true;hv.play();});
   }
   if('IntersectionObserver' in window){
    var vio=new IntersectionObserver(function(es){
     es.forEach(function(x){
      if(x.isIntersecting){
       if(!rm&&hv.paused)hv.play();
      }else{
       if(!hv.paused)hv.pause();
      }
     });
    },{threshold:0.1});
    vio.observe(hv);
   }
  }
  if(st){
   st.addEventListener('click',function(){
    hv.muted=!hv.muted;
    var isMuted=hv.muted;
    var icnM=st.querySelector('.icon-muted');
    var icnU=st.querySelector('.icon-unmuted');
    var lbl=st.querySelector('.btn-text');
    if(icnM)icnM.style.display=isMuted?'block':'none';
    if(icnU)icnU.style.display=isMuted?'none':'block';
    if(lbl)lbl.textContent=isMuted?'Sound on':'Sound off';
    st.setAttribute('aria-label',isMuted?'Turn sound on':'Mute sound');
    if(!isMuted&&hv.paused)hv.play();
   });
  }
 }
})();
