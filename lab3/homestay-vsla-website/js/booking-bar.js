/* Homestay Vsla: home page booking bar (dates and guests, no price shown) */

(function(){
 var $=function(i){return document.getElementById(i)},ci=$('ci'),co=$('co'),gs=$('gs'),msg=$('msg');
 for(var i=1;i<=15;i++){var o=document.createElement('option');o.value=i;o.textContent=i+(i===1?' guest':' guests');if(i===4)o.selected=true;gs.appendChild(o)}
 function iso(d){return d.toISOString().slice(0,10)}
 var t=new Date();ci.min=iso(t);co.min=iso(t);
 ci.addEventListener('change',function(){var n=new Date(ci.value);n.setDate(n.getDate()+1);co.min=iso(n);if(co.value&&co.value<=ci.value)co.value=''});
 $('bar').addEventListener('submit',function(e){
  e.preventDefault();
  if(!ci.value||!co.value){msg.textContent='Choose your check-in and check-out dates to continue.';return}
  var n=Math.round((new Date(co.value)-new Date(ci.value))/864e5);
  var text='Hi, I\u2019d like to book Homestay Vsla from '+ci.value+' to '+co.value+' for '+gs.value+' guests.';
  msg.innerHTML=n+(n===1?' night':' nights')+', '+gs.value+' guests. <a href="book.html">Continue to see your total</a> or <a href="https://wa.me/60146671916?text='+encodeURIComponent(text)+'">book on WhatsApp</a>.';
 });
})();
