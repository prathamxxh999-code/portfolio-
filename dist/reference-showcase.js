(function(){
  'use strict';
  var source='https://ashleshgavas.vercel.app/';
  var collections={
    0:{key:'core-banking',label:'Core banking · Desktop web',intro:'A staff-facing workspace for everyday banking operations. An analytics overview connects with focused screens for maintaining branch and industry records.',
      screens:[
        ['cbs-dash','Banking dashboard','A shared overview of assets, deposits, advances and service activity.'],
        ['cbs-branch','Branch master','A structured table for reviewing branch records and their details.'],
        ['cbs-industry','Industry master','A consistent master-data workspace for industry records.']
      ],details:[['Operational overview','Financial summaries, activity charts and navigation share one dashboard.'],['Consistent master screens','Branch and industry records use a predictable table-based structure.']]},
    1:{key:'internet-banking',label:'Retail banking · Desktop web',intro:'A retail internet banking workspace that brings the account overview, debit card controls and statements into one consistent interface.',
      screens:[
        ['net-dash','Account dashboard','Account context, spending summaries and everyday banking actions.'],
        ['net-cards','Card management','A dedicated workspace for reviewing cards and their controls.'],
        ['net-stmt1','Card statement','A statement view organized around transactions and account details.'],
        ['net-stmt2','Statement details','A second statement view with additional transaction information.']
      ],details:[['Account context','Balances and spending information stay connected to the next banking action.'],['Detailed statements','Separate statement views make the transaction-level information available without crowding the overview.']]},
    2:{key:'corporate-banking',label:'Business banking · Desktop web',intro:'A banking workspace for businesses to review balances and alerts, find accounts and inspect account statements.',
      screens:[
        ['corp-dash','Corporate dashboard','A business banking overview with account balances and alerts.'],
        ['corp-acc','Accounts overview','An organized view of the business’s banking accounts.'],
        ['corp-stmt','Account statement','Transaction details presented in a dedicated account statement.']
      ],details:[['Business overview','Account information and alerts are brought into a common workspace.'],['From overview to detail','Account lists and statements support progressively more detailed review.']]},
    3:{key:'mobile-banking',label:'Retail banking · Mobile app',mobile:true,intro:'Everyday banking on a smaller screen. An account balance card, quick actions, transaction history and a statement period picker form the core experience.',
      screens:[
        ['m-home','Mobile banking home','Balance, payment shortcuts and recent transactions in one continuous view.'],
        ['m-quick','Quick actions','A mobile workspace for reaching common banking and payment actions.'],
        ['m-period','Select a statement period','A focused period picker for reviewing account activity.']
      ],details:[['Everyday actions','Payment and service shortcuts sit close to the account overview.'],['Progressive detail','Transaction history and period selection support deeper account review.']]},
    14:{key:'banners-posters',label:'Visual design · Reference collection',visual:true,intro:'A collection of campaign banners and posters across banking, travel, automotive and product themes. Explore the original artwork in its supplied proportions.',
      screens:[
        ['g-cbs1','Core banking campaign','Wide campaign banner for a core banking product.'],
        ['g-cbs2','Core banking campaign — alternate','An alternate wide-format banking composition.'],
        ['g-cbs3','Core banking campaign — product story','A third banking campaign banner.'],
        ['g-post1','Business finance','A portrait-format business finance campaign.'],
        ['g-post2','Growth campaign','A visual campaign built around a growth message.'],
        ['g-post4','Vendor loans','A poster focused on vendor lending.'],
        ['g-post7','Corporate banking','A portrait-format corporate banking campaign.'],
        ['g-kerala','Kerala travel','A destination-led travel poster.'],
        ['g-post10','Maharashtra travel','A travel composition centered on Maharashtra.'],
        ['g-post5','Automotive','An automotive-themed visual poster.'],
        ['g-post6','Motivational poster','A typography and imagery-led motivational composition.'],
        ['g-post8','Product poster','A product-focused portrait composition.']
      ],details:[['Campaign banners','Three wide-format designs with a clear message and focal point.'],['Portrait posters','Nine designs exploring type, imagery and color across different themes.']]}
  };
  function escape(value){return String(value).replace(/[&<>"']/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]})}
  function screenHTML(p,screen){
    var a=window.referenceAssets[screen[0]],title=escape(screen[1]),long=a.height/a.width>1.2;
    var image='<img src="'+a.src+'" alt="'+title+' — original '+(p.visual?'artwork':'interface')+'" width="'+a.width+'" height="'+a.height+'" loading="lazy" decoding="async">';
    var display=p.mobile?'<div class="reference-phone"><div class="reference-phone-display" tabindex="0" role="region" aria-label="Scroll '+title+' screen">'+image+'</div><img class="reference-phone-plate" src="./showcases/references/phone-hardware.webp" alt="" aria-hidden="true" width="1419" height="2796" loading="lazy" decoding="async"></div>':
      '<div class="reference-screen-viewport'+(p.visual?' reference-artwork':'')+'"'+(!p.visual&&long?' tabindex="0" role="region" aria-label="Scroll '+title+' screen"':'')+'>'+image+'</div>';
    return '<figure class="reference-screen-card'+(p.mobile?' reference-screen-card--phone':'')+'" data-reference-screen="'+screen[0]+'">'+display+'<figcaption><h3>'+title+'</h3><p>'+escape(screen[2])+'</p>'+
      (!p.visual&&long?'<p class="reference-scroll-note">Scroll inside the preview for the complete screen.</p>':'')+
      '<a class="reference-full" href="'+a.src+'" target="_blank" rel="noopener noreferrer" aria-label="View full-resolution '+title+'">View full '+(p.visual?'artwork':'screen')+'</a></figcaption></figure>';
  }
  window.referenceCollections=collections;
  window.renderReferenceShowcase=function(id,title,nextId,nextTitle){
    var p=collections[id];if(!p)return '';
    var sourceLabel=p.visual?'Artwork by':'Screen references from';
    return '<article class="reference-project reference-project--'+p.key+'"><button class="btn back" data-b>← All projects</button>'+
      '<header class="reference-hero"><div class="reference-heading"><p class="eye">'+p.label+'</p><h1>'+escape(title)+'</h1><p class="lead">'+p.intro+'</p><p class="reference-credit">'+sourceLabel+' <a href="'+source+'" target="_blank" rel="noopener noreferrer">Ashlesh Gavas</a></p><button class="reference-gallery-link" type="button" data-reference-gallery>Explore '+p.screens.length+' '+(p.visual?'designs':'screens')+'</button></div>'+
      '<figure class="reference-hero-art"><img src="./showcases/references/'+p.key+'-hero.webp" alt="'+(p.visual?'A composition of original campaign posters':escape(title)+' displayed in photographic device mockups')+'" width="1800" height="1120" decoding="async" fetchpriority="high"></figure></header>'+
      '<div class="reference-summary"><div><small>Format</small><strong>'+(p.visual?'Banners & posters':p.mobile?'Mobile app':'Desktop web app')+'</strong></div><div><small>Collection</small><strong>'+p.screens.length+' original '+(p.visual?'designs':'screens')+'</strong></div><div><small>Presentation</small><strong>'+(p.visual?'Original artwork':'Actual interface screens')+'</strong></div></div>'+
      '<div class="reference-section-heading" id="reference-gallery"><p class="eye">'+(p.visual?'The visual collection':'Inside the product')+'</p><h2>'+(p.visual?'Every format. Its own story.':'A closer look at every screen.')+'</h2><p>'+(p.visual?'Select any artwork to see the original full-resolution design.':'Original layouts and proportions, with a description of each screen’s purpose.')+'</p></div>'+
      '<div class="reference-gallery'+(p.mobile?' reference-gallery--phones':'')+(p.visual?' reference-gallery--artwork':'')+'">'+p.screens.map(function(screen){return screenHTML(p,screen)}).join('')+'</div>'+
      '<div class="reference-details">'+p.details.map(function(d){return '<section><h3>'+escape(d[0])+'</h3><p>'+escape(d[1])+'</p></section>'}).join('')+'</div>'+
      '<p class="note reference-provenance">'+(p.visual?'Artwork is credited to Ashlesh Gavas and presented as a reference collection.':'Screens sourced from Ashlesh Gavas’s portfolio. Values shown belong to the interface designs and are not claimed as project performance results.')+'</p>'+
      '<div class="gl nx"><div><small>Next project</small><h3>'+escape(nextTitle)+'</h3></div><button class="btn m" data-p="'+nextId+'">Open project</button></div></article>';
  };
  document.addEventListener('click',function(event){
    if(!event.target.closest('[data-reference-gallery]'))return;
    var section=document.getElementById('reference-gallery');if(!section)return;
    var heading=section.querySelector('h2');heading.tabIndex=-1;heading.focus({preventScroll:true});
    section.scrollIntoView({behavior:matchMedia('(prefers-reduced-motion: reduce)').matches?'instant':'smooth',block:'start'});
  });
})();
