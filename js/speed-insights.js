// Vercel Speed Insights
// This script will automatically track web vitals when deployed on Vercel
(function() {
  // Queue for speed insights before library loads
  window.siq = window.siq || [];
  
  // Load the Speed Insights script
  var script = document.createElement('script');
  script.src = 'https://va.vercel-scripts.com/v1/speed-insights/script.js';
  script.defer = true;
  
  // Insert the script into the page
  var firstScript = document.getElementsByTagName('script')[0];
  if (firstScript && firstScript.parentNode) {
    firstScript.parentNode.insertBefore(script, firstScript);
  } else {
    document.head.appendChild(script);
  }
})();
