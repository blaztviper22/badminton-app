import { io } from 'socket.io-client';
import '../../../css/components/navBarUser.css';
import '../../../css/components/preloader.css';
import '../../../css/pages/help/help.css';
import { startSessionChecks, validateSessionAndNavigate } from '../../../utils/sessionUtils.js';
import { setupLogoutListener } from '../../global/logout.js';

setupLogoutListener();

// start session checks on page load
startSessionChecks();

var acc = document.getElementsByClassName("accordion");
var i;

for (i = 0; i < acc.length; i++) {
    acc[i].addEventListener("click", function () {
        this.classList.toggle("active");
        this.parentElement.classList.toggle("active");

        var panel = this.nextElementSibling;

        // Check if the panel is currently displayed
        if (panel.style.display === "block") {
            panel.style.display = "none"; // Hide it
        } else {
            panel.style.display = "block"; // Show it
            // Ensure all other panels are closed
            var allPanels = document.querySelectorAll('.pannel');
            allPanels.forEach(function(p) {
                if (p !== panel) {
                    p.style.display = 'none'; // Hide other panels
                }
            });
        }
    });
}
