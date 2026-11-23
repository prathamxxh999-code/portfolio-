(function () {
  'use strict';
  var projects = {
    4: {
      key: 'cashbell', label: 'Loan origination & management', platform: 'Mobile app',
      intro: 'From finding a loan to staying on top of repayments. A connected lending experience designed to make the next step clear.',
      screens: [
        ['cashbell-home', 'Your money, at a glance', 'An overview of the loan balance, upcoming EMI and next actions.'],
        ['cashbell-offers', 'Compare before you commit', 'Loan options with their estimated repayments and costs in one view.'],
        ['cashbell-loan', 'Stay in control', 'A dedicated loan account with the repayment schedule and amount breakdown.']
      ],
      details: [['Origination', 'A guided journey from amount and tenure to comparing loan options.'], ['Management', 'A clear view of the outstanding balance, upcoming EMI and repayment details.']]
    },
    12: {
      key: 'crm', label: 'Client relationships & operations', platform: 'Desktop web app',
      intro: 'One workspace for the people behind every client relationship. Bringing customer records, follow-ups, tasks and reporting into focus.',
      screens: [
        ['crm-overview', 'The bigger picture', 'A shared overview of clients, billing and the team’s next actions.'],
        ['crm-clients', 'A connected client workspace', 'Customer records and account context, organized for everyday work.'],
        ['crm-tasks', 'Keep the work moving', 'Task ownership, priorities and follow-ups in one workspace.'],
        ['crm-reports', 'See what needs attention', 'Reporting views that bring account and operational activity together.']
      ],
      details: [['Client context', 'A consistent workspace for customer records and the activity around them.'], ['Team coordination', 'Connected tasks and reports help teams see what to work on next.']]
    }
  };
  window.showcaseProjectData = projects;
  window.projectShowcase = function (id, title, nextId, nextTitle) {
    if(id===7&&window.renderValetShowcase)return window.renderValetShowcase(title,nextId,nextTitle);
    if(id===13&&window.renderMerchantShowcase)return window.renderMerchantShowcase(title,nextId,nextTitle);
    var p = projects[id];
    if (!p) return '';
    var film = p.key === 'crm' ? 'crm-reference-mint-film' : 'cashbell-motion-film';
    var poster = p.key === 'cashbell' ? 'cashbell-motion-poster' : p.key + '-poster';
    return '<div class="project-showcase project-showcase--' + p.key + '">' +
      '<div class="showcase-intro"><button class="btn back" data-b>← All projects</button>' +
      '<div class="showcase-hero"><div class="showcase-heading"><p class="eye">' + p.label + '</p><h1>' + title + '</h1>' +
      '<p class="lead">' + p.intro + '</p></div>' +
      '<figure class="showcase-film"><video id="showcase-film-'+p.key+'" autoplay muted loop playsinline preload="metadata" poster="./showcases/' + poster + '.jpg" aria-label="' + title + ' — silent interface showcase">' +
      '<source src="./showcases/' + film + '.mp4" type="video/mp4">Your browser cannot play this video. <a href="./showcases/' + film + '.mp4">Download the showcase</a>.</video>' +
      '</figure></div></div>' +
      '<div class="meta showcase-meta"><div class="gl"><small>Role</small>Lead Product Designer</div><div class="gl"><small>Platform</small>' + p.platform + '</div><div class="gl"><small>Focus</small>' + p.label + '</div></div>' +
      '<div class="showcase-section-heading"><p class="eye">A closer look</p><h2>Every screen has a purpose.</h2></div>' +
      '<div class="showcase-gallery">' + p.screens.map(function (screen, index) {
        return '<figure class="showcase-screen rv"><a href="./showcases/screens/' + screen[0] + '.png" target="_blank" rel="noopener noreferrer" aria-label="Open full-resolution ' + screen[1] + ' screen">' +
          '<img src="./showcases/' + screen[0] + '-mockup.webp" alt="' + screen[1] + ', shown on a ' + (id === 4 ? 'phone' : 'desktop monitor') + '" loading="lazy" decoding="async" width="' + (id === 4 ? '1024' : '2560') + '" height="1600">' +
          '<span class="showcase-expand" aria-hidden="true">↗</span></a><figcaption><span class="showcase-number">0' + (index + 1) + '</span><div><h3>' + screen[1] + '</h3><p>' + screen[2] + '</p></div></figcaption></figure>';
      }).join('') + '</div>' +
      '<div class="txt showcase-details">' + p.details.map(function (detail) { return '<div class="gl rv"><h3>' + detail[0] + '</h3><p>' + detail[1] + '</p></div>'; }).join('') + '</div>' +
      '<p class="note">Actual project interfaces shown with sample records. Select a screen to view it at full resolution.</p>' +
      '<div class="gl nx rv"><div><small style="color:var(--ac)">Next project</small><h3>' + nextTitle + '</h3></div><button class="btn m" data-p="' + nextId + '">Open →</button></div></div>';
  };
  window.initProjectShowcase=function(root){
    var video=root.querySelector('.showcase-film video');
    if(!video)return;
    video.controls=false;
    video.muted=true;
    if(matchMedia('(prefers-reduced-motion: reduce)').matches){video.autoplay=false;video.pause();return;}
    var observer=new IntersectionObserver(function(entries){
      entries.forEach(function(entry){
        if(!video.isConnected){observer.disconnect();return;}
        if(entry.isIntersecting&&!document.hidden)video.play().catch(function(){});
        else video.pause();
      });
    },{threshold:.15});
    observer.observe(video);
  };
  document.addEventListener('visibilitychange', function () {
    if (document.hidden) document.querySelectorAll('.showcase-film video').forEach(function (video) { video.pause(); });
    else if(!matchMedia('(prefers-reduced-motion: reduce)').matches)document.querySelectorAll('.showcase-film video').forEach(function(video){var r=video.getBoundingClientRect();if(video.offsetParent&&r.bottom>0&&r.top<innerHeight)video.play().catch(function(){});});
  });
})();
