(function(){
  'use strict';
  function escape(value){return String(value).replace(/[&<>"']/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]})}
  function screenHTML(screen){
    return '<figure class="merchant-screen" data-merchant-screen="'+screen.key+'"><a class="merchant-screen-image" href="'+screen.src+'" target="_blank" rel="noopener noreferrer" aria-label="Open full-resolution '+escape(screen.title)+'">'+
      '<img src="'+screen.mockup+'" alt="'+escape(screen.title)+' on a photographed desktop monitor" width="1920" height="1200" loading="lazy" decoding="async"></a>'+
      '<figcaption><h3>'+escape(screen.title)+'</h3><p>'+escape(screen.description)+'</p><a href="'+screen.src+'" target="_blank" rel="noopener noreferrer">View complete screen</a></figcaption></figure>';
  }
  window.renderMerchantShowcase=function(title,nextId,nextTitle){
    var data=window.merchantShowcaseAssets;if(!data)return '';
    return '<article class="merchant-project"><div class="merchant-hero-surface"><button class="btn back" data-b>← All projects</button>'+
      '<header class="merchant-hero"><div class="merchant-copy"><p class="eye">'+escape(title)+'</p><h1>PaySphere</h1><p class="merchant-subtitle">Merchant operations, connected.</p><p class="lead">One workspace for merchant onboarding, KYC, payment traces, settlements and operational review.</p><button type="button" class="merchant-explore" data-merchant-gallery>Explore '+data.screenCount+' interface views</button></div>'+
      '<figure class="showcase-film merchant-film"><video autoplay muted loop playsinline preload="metadata" poster="./showcases/merchant-poster.jpg" aria-label="PaySphere — silent merchant operations showcase"><source src="./showcases/merchant-showcase-film.mp4" type="video/mp4">Your browser cannot play this film. <a href="./showcases/merchant-showcase-film.mp4">Download the showcase</a>.</video></figure></header></div>'+
      '<div class="merchant-facts"><div><small>Role</small><strong>Lead Product Designer</strong></div><div><small>Format</small><strong>Desktop web prototype</strong></div><div><small>Coverage</small><strong>'+data.screenCount+' screens &amp; workflow states</strong></div></div>'+
      '<section class="merchant-design-intro"><div><p class="eye">From an overview to the next action</p><h2>A connected view of the whole merchant.</h2></div><p>Merchant identity, payment activity, product setup and service history stay connected. Evidence, permissions and independent reviews remain visible when an operational decision needs more care.</p></section>'+
      '<section class="merchant-gallery" id="merchant-screen-gallery"><div class="merchant-gallery-heading"><div><p class="eye">The complete interface collection</p><h2>Every workflow, in focus.</h2><p>Explore the actual prototype screens by function. Open any preview for its complete original capture.</p></div><button class="merchant-expand" type="button" data-merchant-expand aria-expanded="false" aria-controls="merchant-screen-groups">Expand all groups</button></div>'+
      '<div id="merchant-screen-groups">'+data.groups.map(function(group,index){return '<details class="merchant-group"'+(index===0?' open':'')+'><summary><span>'+escape(group.title)+'</span><span class="merchant-group-count">'+group.screens.length+' views</span></summary><div class="merchant-group-body"><p class="merchant-group-intro">'+escape(group.intro)+'</p><div class="merchant-screen-grid">'+group.screens.map(screenHTML).join('')+'</div></div></details>'}).join('')+'</div></section>'+
      '<p class="merchant-source-note">Actual PaySphere interfaces using sample records. Copilot responses and workflow actions are local prototype demonstrations; live AI, authentication and banking services are not connected. Photographed hardware by <a href="https://unsplash.com/photos/a-computer-monitor-sitting-on-top-of-a-white-desk-gVpXbCGG6jI" target="_blank" rel="noopener noreferrer">Teddy GR / Unsplash</a>. The mockup previews show the initial viewport; full-resolution links retain the complete captures.</p>'+
      '<div class="gl nx merchant-next"><div><small>Next project</small><h3>'+escape(nextTitle)+'</h3></div><button class="btn m" data-p="'+nextId+'">Open project</button></div></article>';
  };
  function syncGroups(){
    var root=document.querySelector('.merchant-project');if(!root)return;
    var groups=[].slice.call(root.querySelectorAll('.merchant-group')),all=groups.length>0&&groups.every(function(g){return g.open});
    var button=root.querySelector('[data-merchant-expand]');if(button){button.textContent=all?'Collapse groups':'Expand all groups';button.setAttribute('aria-expanded',String(all));}
  }
  document.addEventListener('click',function(event){
    var jump=event.target.closest('[data-merchant-gallery]');
    if(jump){var target=document.getElementById('merchant-screen-gallery');if(target){var heading=target.querySelector('h2');heading.tabIndex=-1;heading.focus({preventScroll:true});target.scrollIntoView({block:'start',behavior:matchMedia('(prefers-reduced-motion: reduce)').matches?'instant':'smooth'});}return;}
    var expand=event.target.closest('[data-merchant-expand]');if(!expand)return;
    var groups=[].slice.call(document.querySelectorAll('.merchant-project .merchant-group')),all=groups.every(function(g){return g.open});
    groups.forEach(function(group){group.open=!all});syncGroups();
  });
  document.addEventListener('toggle',function(event){if(event.target.classList&&event.target.classList.contains('merchant-group'))syncGroups()},true);
})();
