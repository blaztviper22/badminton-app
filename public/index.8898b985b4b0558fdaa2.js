(()=>{"use strict";var n=document,t=(console.log,console.error,function(t){return n.querySelector(t)});n.addEventListener("DOMContentLoaded",(function(){var n=t(".button-container button:first-of-type"),e=t(".button-container button:last-of-type");n&&n.addEventListener("click",(function(n){n.preventDefault(),window.location.href="/signup"})),e&&e.addEventListener("click",(function(n){n.preventDefault(),window.location.href="/signin"}))}))})();