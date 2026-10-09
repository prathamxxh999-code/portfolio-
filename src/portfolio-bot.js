(function () {
  const projects = [
    ['core banking', 'accounts, deposits, loans, and ledgers'],
    ['internet banking', 'payments, statements, and everyday account management'],
    ['corporate banking', 'bulk payments, approvals, and cash visibility'],
    ['banking mobile', 'fast, safe everyday banking on iOS and Android'],
    ['lending', 'loan origination, underwriting, disbursal, servicing, and repayments'],
    ['gate pass', 'requests, approvals, and movement tracking'],
    ['visitor', 'pre-registration, check-in, and host alerts'],
    ['valet', 'vehicle handover, tracking, and retrieval'],
    ['asset', 'tagging, allocation, maintenance, and retirement'],
    ['helpdesk', 'ticketing, SLAs, and support workflows']
  ];
  window.answerPortfolioQuestion = function (question) {
    const q = question.toLowerCase().replace(/[^a-z0-9 ]/g, ' ');
    if (/are you (an )?ai|are you a bot|how do you answer/.test(q))
      return "I'm Prathamesh's portfolio guide. Right now I answer from facts built into this site, so I won't invent details I don't know.";
    if (/hello|\bhi\b|\bhey\b|who are you/.test(q))
      return "Hey! I'm Mini Pratham. Ask me about Prathamesh's projects, process, tools, or how to contact him. You can also try the design game.";
    if (/game|play|eagle eye|colour|color/.test(q))
      return "Open the Design game tab and spot the tile with a slightly different colour. It gets trickier as your score rises.";
    if (/email|contact|reach|phone|call|hire|opportunit/.test(q))
      return "Prathamesh is open to new opportunities. Email him at Prathamxxh999@gmail.com or call +91 91367 47166.";
    if (/resume|résumé|cv/.test(q))
      return "Use the Résumé button at the top of the portfolio to download his résumé.";
    if (/company|employer|education|degree|university|college|certif|award|salary|impact|metric/.test(q))
      return "Those details are still placeholders on the site, so I don't want to guess. Please email Prathamesh for the current information.";
    if (/tool|figma|illustrator|photoshop|miro|maze|jira|notion|software/.test(q))
      return "Figma is his main design tool. He also uses Illustrator, Photoshop, Miro, Maze, Jira, and Notion for research, design, testing, and handoff.";
    if (/process|approach|how.*work|workflow/.test(q))
      return "His process is Discover, Define, Design, Deliver: understand roles and goals, map the journey, prototype clear screens, then support engineering through handoff.";
    if (/design system|component|ui ux|ui\/ux|skill|special/.test(q))
      return "He works across product design, UI and UX, reusable Figma design systems, and complex fintech workflows. His focus is making dense enterprise products feel clear.";
    if (/orbit/.test(q))
      return "Orbit OS is a speculative spatial banking dashboard: an exploration of connected money movement, approvals, and risk signals. It is a concept, not shipped client work.";
    if (/bloom/.test(q))
      return "Bloom is a speculative mobile savings app where progress grows a digital garden. It explores making small money habits feel rewarding.";
    if (/citypulse|city pulse|city/.test(q))
      return "CityPulse is a speculative urban operations concept connecting visitors, parking, service requests, and public assets on a live map.";
    if (/concept|speculative|side project/.test(q))
      return "The Beyond the brief section has three speculative concepts: Orbit OS, Bloom, and CityPulse. They are visual explorations, not shipped client projects.";
    for (const [key, description] of projects) {
      if (q.includes(key)) return "The " + key.replace(/\b\w/g, c => c.toUpperCase()) +
        " project focuses on " + description + ". Open its card in Selected work to see the illustrative screens.";
    }
    if (/project|portfolio|work|design|bank|saas|product|experience|about/.test(q))
      return "Prathamesh has 3+ years in product design across banking, lending, hospitality, and enterprise SaaS. His portfolio covers five banking and lending products and five operational tools. Which project would you like to explore?";
    return "I can help with Prathamesh's projects, design process, tools, résumé, and contact details. Try asking about a specific project or play the design game.";
  };
})();
