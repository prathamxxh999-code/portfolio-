export const missions={
  repair:{name:"Pay ’n’ Polish",short:'UI repair',duration:30000,goal:'Clear the design debt.',description:'Fix the screen. Lose the stars.',story:'A broken interface just rolled in.'},
  valet:{name:'Layout Valet',short:'Layout valet',duration:45000,goal:'Park every component.',description:'Pick a component, then its layout space.',story:'Six components. One clean layout.'},
  patterns:{name:'Pattern Patrol',short:'Pattern patrol',duration:45000,goal:'Clean up the dark patterns.',description:'Make the choice that respects the user.',story:'The city needs an honest designer.'}
};
export const repairCases=[
  {title:'Make the amount readable.',type:'contrast',tag:'checkout',heading:'Your total',body:'₹1,250.00',action:'Pay securely',options:['Increase text contrast','Add a glowing shadow','Make the background busier'],answer:0,fix:'Contrast restored.'},
  {title:'Give the form some breathing room.',type:'spacing',tag:'new parking entry',heading:'Vehicle details',body:'MH 02 AB 1234',action:'Save entry',options:['Add another border','Use a consistent spacing scale','Reduce the label size'],answer:1,fix:'Spacing restored.'},
  {title:'Make the action easy to tap.',type:'target',tag:'mobile checkout',heading:'Ready to continue?',body:'Your details are saved.',action:'Continue',options:['Hide it in a menu','Make the label lighter','Use a larger touch target'],answer:2,fix:'Touch target repaired.'},
  {title:'Make the next step obvious.',type:'hierarchy',tag:'booking confirmed',heading:'You’re all set.',body:'Your receipt is ready.',action:'View receipt',options:['Give the primary action priority','Make every action equally loud','Add more competing buttons'],answer:0,fix:'Hierarchy restored.'},
  {title:'Let the task take centre stage.',type:'clutter',tag:'task manager',heading:'Finish the report',body:'Due today · assigned to you',action:'Open task',options:['Animate every element','Remove unrelated distractions','Add a second banner'],answer:1,fix:'Clutter cleared.'},
  {title:'Help the user recover.',type:'error',tag:'sign in',heading:'Something went wrong',body:'Error 0x009',action:'Try again',options:['Hide the error','Blame the user','Explain the problem and next step'],answer:2,fix:'Recovery path restored.'}
];
export const patternCases=[
  {title:'The timer restarts on every visit.',type:'urgency',tag:'special offer',heading:'Only 00:09 left!',body:'Buy now before this deal disappears.',action:'Claim offer',options:['Remove the fake urgency','Make the countdown larger','Hide the normal price'],answer:0,fix:'Fake urgency removed.'},
  {title:'A decline should not shame anyone.',type:'shame',tag:'newsletter',heading:'Want 10% off?',body:'No thanks, I love wasting money.',action:'Yes, save me',options:['Make the guilt line bolder','Use a neutral “No thanks”','Remove the decline option'],answer:1,fix:'Confirm-shaming removed.'},
  {title:'The price changes at checkout.',type:'fees',tag:'order summary',heading:'₹499 advertised',body:'Final total: ₹799',action:'Pay ₹799',options:['Hide the breakdown','Use smaller numbers','Show the full price upfront'],answer:2,fix:'Hidden costs revealed.'},
  {title:'Extras were added without a choice.',type:'extras',tag:'your booking',heading:'Premium cover added',body:'✓ Add protection for ₹149',action:'Continue',options:['Ask for explicit opt-in','Keep it preselected','Move it below the fold'],answer:0,fix:'Consent restored.'},
  {title:'Leaving takes more steps than joining.',type:'cancel',tag:'manage subscription',heading:'Want to leave?',body:'Call us, complete a survey, then wait.',action:'Stay subscribed',options:['Add another confirmation','Offer a clear cancellation path','Hide account settings'],answer:1,fix:'Cancellation trap removed.'},
  {title:'The interface disguises an advertisement.',type:'ad',tag:'your dashboard',heading:'Download update',body:'Sponsored software, disguised as a system alert.',action:'Download now',options:['Make it look more official','Hide the sponsor','Label the ad clearly'],answer:2,fix:'Disguised ad exposed.'}
];
export const valetPieces=[
  {id:'brand',name:'Brand',slot:'Brand / logo',hint:'The identity goes first.'},
  {id:'nav',name:'Navigation',slot:'Primary navigation',hint:'A route through the product.'},
  {id:'search',name:'Search',slot:'Find a vehicle',hint:'A fast way to find a record.'},
  {id:'queue',name:'Parking queue',slot:'Main content',hint:'The primary task belongs in the main area.'},
  {id:'action',name:'New parking entry',slot:'Primary action',hint:'Make the next action clear.'},
  {id:'help',name:'Support',slot:'Help & support',hint:'Assistance belongs in a predictable place.'}
];
