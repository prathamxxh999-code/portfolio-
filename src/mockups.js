(function () {
  const screens = [
    { nav: ['Overview', 'Accounts', 'Deposits', 'Loans'], titles: ['Account overview', 'Ledger activity', 'Loan servicing'], rows: ['Current accounts', 'Savings deposits', 'Term deposits'], stats: ['₹8.4M', '1,248', '99.2%'] },
    { nav: ['Home', 'Payments', 'Statements', 'Cards'], titles: ['Your money at a glance', 'Recent payments', 'Monthly statements'], rows: ['Salary account', 'Electricity bill', 'Card payment'], stats: ['₹2.48L', '18', '4'] },
    { nav: ['Dashboard', 'Bulk payments', 'Approvals', 'Reports'], titles: ['Cash position', 'Approval queue', 'Payment batches'], rows: ['Payroll batch', 'Vendor payment', 'Tax transfer'], stats: ['₹12.6M', '24', '8'] },
    { nav: ['Home', 'Transfer', 'Cards', 'Activity'], titles: ['Good morning', 'Send money', 'Card controls'], rows: ['Coffee House', 'Monthly rent', 'Grocery Store'], stats: ['₹48,920', '12', '3'] },
    { nav: ['Overview', 'Applications', 'Repayments', 'Reports'], titles: ['Loan overview', 'Application review', 'Repayment plan'], rows: ['Application 1042', 'Application 1043', 'Application 1044'], stats: ['₹4.2M', '36', '92%'] },
    { nav: ['Overview', 'Requests', 'Approvals', 'Gate log'], titles: ['Movement overview', 'Pending passes', 'Gate activity'], rows: ['Material dispatch', 'Vendor entry', 'Returnable item'], stats: ['128', '14', '98%'] },
    { nav: ['Overview', 'Visitors', 'Check-in', 'Hosts'], titles: ['Front desk today', 'Upcoming visitors', 'Check-in activity'], rows: ['Guest arrival', 'Interview visit', 'Vendor meeting'], stats: ['46', '12', '4'] },
    { nav: ['Overview', 'Vehicles', 'Tickets', 'Reports'], titles: ['Valet queue', 'Vehicle handover', 'Ready for pickup'], rows: ['Ticket V-204', 'Ticket V-205', 'Ticket V-206'], stats: ['28', '6', '4 min'] },
    { nav: ['Overview', 'Inventory', 'Maintenance', 'People'], titles: ['Asset overview', 'Maintenance queue', 'Allocation history'], rows: ['Laptop fleet', 'Office equipment', 'Network devices'], stats: ['1,842', '32', '96%'] },
    { nav: ['Overview', 'Tickets', 'SLA', 'Knowledge'], titles: ['Support overview', 'Ticket queue', 'Service performance'], rows: ['Login issue', 'Access request', 'Device support'], stats: ['142', '18', '94%'] }
  ];

  function escapeXml(value) {
    return String(value).replace(/[&<>"']/g, c => ({
      '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&apos;'
    })[c]);
  }
  function rect(x, y, w, h, fill, radius, stroke) {
    return '<rect x="' + x + '" y="' + y + '" width="' + w + '" height="' + h +
      '" rx="' + (radius || 0) + '" fill="' + fill + '"' +
      (stroke ? ' stroke="' + stroke + '"' : '') + '/>';
  }
  function label(x, y, value, size, color, weight) {
    return '<text x="' + x + '" y="' + y + '" fill="' + (color || '#f4f5f1') +
      '" font-family="Arial,sans-serif" font-size="' + (size || 12) +
      '" font-weight="' + (weight || 400) + '">' + escapeXml(value) + '</text>';
  }
  function background(project, id) {
    const hue = project[5], accent = 'hsl(' + hue + ',90%,62%)';
    return '<svg viewBox="0 0 640 400" preserveAspectRatio="xMidYMid meet" role="img" aria-label="Illustrative ' +
      escapeXml(project[0]) + ' interface mockup"><defs><linearGradient id="' + id +
      '" x1="0" y1="0" x2="1" y2="1"><stop stop-color="hsl(' + hue +
      ',42%,17%)"/><stop offset="1" stop-color="#080d18"/></linearGradient><filter id="' +
      id + 'b"><feGaussianBlur stdDeviation="38"/></filter></defs>' +
      rect(0, 0, 640, 400, 'url(#' + id + ')') +
      '<g filter="url(#' + id + 'b)" opacity=".3"><circle cx="95" cy="355" r="115" fill="' +
      accent + '"/><circle cx="560" cy="50" r="120" fill="#c6ff3d"/></g>';
  }
  function browser(config, project, mode) {
    const lime = '#c6ff3d', accent = 'hsl(' + project[5] + ',90%,62%)';
    let svg = rect(18, 18, 604, 364, '#0c121b', 20, '#455464') +
      rect(18, 18, 604, 34, '#171e28', 20) + rect(18, 42, 604, 10, '#171e28');
    ['#ff736b', '#f5c756', '#8dd66a'].forEach((color, i) => {
      svg += '<circle cx="' + (38 + i * 14) + '" cy="35" r="4" fill="' + color + '"/>';
    });
    svg += label(90, 39, 'WORKSPACE / ' + project[0], 10, '#acb8c2', 700) +
      label(535, 39, 'CONCEPT UI', 9, lime, 700) +
      rect(18, 52, 130, 330, '#111b25') + rect(34, 70, 28, 28, lime, 8) +
      label(42, 89, 'P', 16, '#0a1118', 700);
    config.nav.forEach((item, i) => {
      const y = 128 + i * 37;
      if (i === mode) svg += rect(29, y - 19, 108, 30, '#2b3c3c', 8);
      svg += label(42, y, item, 11, i === mode ? '#d9ff93' : '#96a6b4', i === mode ? 700 : 400);
    });
    svg += label(36, 352, 'SAMPLE DATA', 8, '#72818e', 700) +
      label(170, 86, config.titles[mode], 22, '#f5f7f2', 700) +
      label(171, 105, 'A clearer view of what matters now', 10, '#9caab5') +
      rect(532, 72, 67, 23, lime, 11) +
      label(546, 88, mode === 1 ? 'Review' : 'Explore', 9, '#101823', 700);
    for (let i = 0; i < 3; i++) {
      const x = 170 + i * 143;
      svg += rect(x, 122, 132, 68, i === 0 ? '#223a37' : '#1a2732', 12, '#34444b') +
        label(x + 13, 145, ['TOTAL', 'IN PROGRESS', 'ON TRACK'][i], 8, '#aebfc5', 700) +
        label(x + 13, 174, config.stats[i], 20, i === 0 ? lime : '#f5f7f2', 700);
    }
    if (mode === 0) {
      svg += rect(170, 204, 268, 153, '#17232e', 13, '#33424b') +
        label(187, 230, 'Activity trend', 12, '#e8f0ee', 700);
      for (let i = 0; i < 4; i++) svg += '<path d="M188 ' + (251 + i * 27) + ' H421" stroke="#2d3c48"/>';
      const values = [326, 303, 312, 273, 285, 248, 261, 231, 243];
      svg += '<path d="' + values.map((y, i) => (i ? 'L' : 'M') + (188 + i * 29) + ' ' + y).join(' ') +
        '" fill="none" stroke="' + lime + '" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/>';
      svg += rect(450, 204, 149, 153, '#17232e', 13, '#33424b') +
        label(465, 230, 'Quick view', 12, '#e8f0ee', 700);
      config.rows.forEach((row, i) => {
        svg += rect(464, 246 + i * 32, 17, 17, i === 0 ? lime : '#30444a', 5) +
          label(490, 259 + i * 32, row, 9, '#bdcbd0');
      });
    } else if (mode === 1) {
      svg += rect(170, 204, 429, 153, '#17232e', 13, '#33424b') +
        label(186, 230, 'Needs attention', 12, '#e8f0ee', 700);
      config.rows.forEach((row, i) => {
        const y = 252 + i * 34;
        svg += rect(186, y - 11, 397, 29, i % 2 ? '#192a34' : '#20303a', 7) +
          rect(196, y - 4, 14, 14, i === 0 ? lime : accent, 4) +
          label(222, y + 6, row, 10, '#dce7e7') +
          label(475, y + 6, i === 0 ? 'Review' : 'View details', 9, i === 0 ? lime : '#a8b8bf', 700);
      });
    } else {
      svg += label(170, 225, 'WORKFLOW', 9, '#9cabb4', 700);
      for (let i = 0; i < 3; i++) {
        const x = 170 + i * 144;
        svg += rect(x, 239, 132, 118, '#17232e', 12, '#33424b') +
          label(x + 12, 261, ['New', 'In progress', 'Complete'][i], 10, i === 2 ? lime : '#dce7e7', 700) +
          rect(x + 11, 274, 110, 26, i === 1 ? '#2b3e43' : '#263640', 6) +
          label(x + 18, 291, config.rows[i], 8, '#dce7e7') +
          rect(x + 11, 307, 82, 5, i === 2 ? lime : '#55716b', 3) +
          rect(x + 11, 320, 102, 5, '#344751', 3);
      }
    }
    return svg;
  }
  function phone(config, project, x, y, w, h, mode, front) {
    const accent = front ? '#c6ff3d' : 'hsl(' + project[5] + ',90%,62%)';
    let svg = rect(x, y, w, h, '#080c14', 25, '#66727e') +
      rect(x + 5, y + 5, w - 10, h - 10, '#101823', 21) +
      rect(x + w / 2 - 17, y + 9, 34, 5, '#020408', 3) +
      label(x + 14, y + 31, '9:41', 9, '#b9c6cd', 700) +
      label(x + w - 28, y + 31, '●', 8, accent, 700) +
      label(x + 14, y + 57, config.titles[mode], front ? 12 : 11, '#f4f5f1', 700) +
      rect(x + 12, y + 70, w - 24, 82, front ? '#233b35' : '#202a36', 14) +
      label(x + 23, y + 92, mode === 1 ? 'Available now' : 'Your overview', 9, '#b9c6cd') +
      label(x + 23, y + 123, config.stats[mode], front ? 22 : 19, '#fff', 700) +
      rect(x + w - 47, y + 86, 24, 24, accent, 8) +
      label(x + w - 41, y + 103, '↗', 13, '#101823', 700);
    for (let i = 0; i < 3; i++) {
      const cx = x + 25 + i * (w - 50) / 2;
      svg += rect(cx, y + 170, 25, 25, i === 1 ? accent : '#263440', 8) +
        label(cx + 8, y + 187, i === 1 ? '↗' : '•', 11, i === 1 ? '#101823' : '#d6e2e2', 700);
    }
    svg += label(x + 13, y + 224, mode === 2 ? 'Upcoming' : 'Recent activity', 10, '#f4f5f1', 700);
    for (let i = 0; i < 3; i++) {
      const yy = y + 242 + i * 29;
      svg += rect(x + 13, yy - 11, 20, 20, i === 0 ? '#314238' : '#26303b', 6) +
        label(x + 40, yy + 2, config.rows[(i + mode) % 3], 8, '#d7dee3') +
        label(x + w - 34, yy + 2, i === 0 ? '↗' : '•', 9, accent, 700);
    }
    return svg + rect(x + 12, y + h - 28, w - 24, 17, '#1a2630', 8) +
      rect(x + 18, y + h - 22, (w - 36) / 3, 5, accent, 3);
  }
  window.makeProjectMockup = function (project, index, variant) {
    const config = screens[index], mode = variant % 3;
    let svg = background(project, 'preview' + index + '-' + variant);
    if (project[3] === 'm') {
      svg += phone(config, project, 80, 42, 170, 328, (mode + 1) % 3, false) +
        phone(config, project, 246, 18, 190, 360, mode, true) +
        phone(config, project, 430, 68, 142, 290, (mode + 2) % 3, false);
    } else svg += browser(config, project, mode);
    return svg + '</svg>';
  };
})();
