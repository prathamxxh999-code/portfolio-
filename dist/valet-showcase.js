(function(){
'use strict';
var groups=[
 {title:'Arrival & parking',intro:'Capture the vehicle, guest and parking details without losing context.',screens:[
 ['home','A clear starting point','One overview for new parking entries, active sessions, retrieval and the queue.'],
 ['entry','Register the vehicle','Record guest details, the number plate, vehicle attributes and supporting images.'],
 ['entry-vip','Handle VIP arrivals','The VIP state explains the chargeable setting and queue bypass before parking.'],
 ['parking-details','Keep the car and keys connected','Record floor, zone, parking number, key box and key slot, with supporting photos.']]},
 {title:'Live operations',intro:'Follow each vehicle from the gate to its parking space and back.',screens:[
 ['parking-progress','Track parking in progress','See the vehicle, gate, assigned driver and elapsed time while parking is underway.'],
 ['parked','Find a parked vehicle','A parked record brings together the parking zone, slot, driver and key location.'],
 ['retrieval-progress','Follow active retrievals','A compact retrieval state keeps the current driver, vehicle and gate visible.'],
 ['retrieval-details','Retain the full parking context','The expanded retrieval record includes the parking and key details needed for collection.'],
 ['retrieval-queue','Keep the queue moving','Queue position and vehicle context help the team identify the next retrieval.'],
 ['queue-details','Confirm the next retrieval','The queue action stays beside the relevant vehicle and driver details.']]},
 {title:'Guest pickup & handover',intro:'Give guests a receipt, a pickup point and a clear path to handover.',screens:[
 ['guest-pickup','A useful digital receipt','Show the vehicle, visit, parking location, duration, fee and receipt number.'],
 ['pickup-status','Make waiting understandable','The pickup state shows the gate, queue position and estimated arrival time.'],
 ['handover','Verify before releasing the vehicle','The receipt-number field supports the final handover check.'],
 ['handover-submit','Complete the handover','The submission state brings the receipt check and final action together.']]},
 {title:'Team & performance',intro:'A personal workspace for valet staff, account settings and operational reporting.',screens:[
 ['driver-profile','Know the person behind the shift','A driver profile combines identity, activity summaries and account shortcuts.'],
 ['account-settings','Keep account tools within reach','Profile editing, location setup, password and support appear in one place.'],
 ['analytics','Review parking activity','Reporting presents parked vehicles, current status, trends and billing summaries.']]}
];
function screenCard(screen){var key='valet-'+screen[0];return '<figure class="valet-screen"><div class="valet-phone"><div class="valet-phone-display" tabindex="0" role="region" aria-label="'+screen[1]+' preview. Scroll inside the phone for the full screen."><img src="./showcases/'+key+'.webp" alt="'+screen[1]+' — original Valet Parking interface" loading="lazy" decoding="async"></div><img class="valet-hardware" src="./showcases/valet-phone-hardware.webp" alt="" width="710" height="1399" loading="lazy" decoding="async" aria-hidden="true"></div><figcaption><h3>'+screen[1]+'</h3><p>'+screen[2]+'</p><a href="./showcases/screens/'+key+'.png" target="_blank" rel="noopener noreferrer">View full screen</a></figcaption></figure>';}
window.renderValetShowcase=function(title,nextId,nextTitle){return '<div class="project-showcase project-showcase--valet"><div class="showcase-intro"><button class="btn back" data-b>All projects</button><div class="showcase-hero"><div class="showcase-heading"><p class="eye">Hospitality · Mobile product</p><h1>Valet Parking</h1><p class="lead">From arrival to handover. A connected workspace for parking teams, drivers and guests.</p><p class="valet-hero-detail">17 original screens · one connected journey</p></div><figure class="valet-hero-image"><picture><source media="(max-width:900px)" srcset="./showcases/valet-hero-straight-mobile.webp"><img src="./showcases/valet-hero-straight.webp" alt="Two straight iPhone mockups showing the original Valet Parking home and parking-progress screens" width="2400" height="1200" decoding="async" fetchpriority="high"></picture></figure></div></div><div class="meta showcase-meta"><div class="gl"><small>Role</small>Product Designer</div><div class="gl"><small>Platform</small>Mobile app</div><div class="gl"><small>Focus</small>Parking operations & guest pickup</div></div><div class="showcase-section-heading"><p class="eye">The complete screen flow</p><h2>Every handover, considered.</h2><p class="valet-gallery-note">Scroll inside a phone to explore a longer screen, or open the full image.</p></div>'+groups.map(function(group){return '<section class="valet-screen-group"><div class="valet-group-heading"><h2>'+group.title+'</h2><p>'+group.intro+'</p></div><div class="valet-screen-grid">'+group.screens.map(screenCard).join('')+'</div></section>';}).join('')+'<p class="note">Interface previews use sample records. On-screen figures illustrate the product and are not measured business outcomes.</p><div class="gl nx"><div><small style="color:var(--ac)">Next project</small><h3>'+nextTitle+'</h3></div><button class="btn m" data-p="'+nextId+'">Open project</button></div></div>';};
})();
