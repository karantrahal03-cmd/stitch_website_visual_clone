
  document.addEventListener("DOMContentLoaded", () => {
    const sections = document.querySelectorAll("main[id], section[id]");
    const navLinks = document.querySelectorAll(".nav-link");
    const header = document.getElementById("header-wrapper") || document.querySelector("header");
    
    function onScroll() {
      const scrollPos = window.scrollY;
      const headerHeight = header.offsetHeight;
      let currentSectionId = "home";

      sections.forEach((section) => {
        const sectionTop = section.offsetTop - headerHeight - 100;

        if (scrollPos >= sectionTop) {
          currentSectionId = section.getAttribute("id");
        }
      });

      if ((window.innerHeight + Math.round(window.scrollY)) >= document.body.offsetHeight - 20) {
         currentSectionId = "contact";
      }

      navLinks.forEach((link) => {
        link.classList.remove("active", "text-white");
        link.classList.add("text-gray-200");
        
        if (link.getAttribute("href") === `#${currentSectionId}`) {
          link.classList.add("active", "text-white");
          link.classList.remove("text-gray-200");
        }
      });
    }

    navLinks.forEach(link => {
      link.addEventListener("click", function(e) {
        e.preventDefault();
        const targetId = this.getAttribute("href").substring(1);
        const targetElement = document.getElementById(targetId);
        
        if (targetElement) {
          window.scrollTo({
            top: targetElement.offsetTop - header.offsetHeight - 20,
            behavior: "smooth"
          });
        }
      });
    });

    window.addEventListener("scroll", onScroll);
    onScroll();

    // Market Analysis Tabs
    const tabWeekly = document.getElementById('tab-weekly');
    const tabHot = document.getElementById('tab-hot');
    const contentWeekly = document.getElementById('content-weekly');
    const contentHot = document.getElementById('content-hot');

    if (tabWeekly && tabHot) {
      tabWeekly.addEventListener('click', () => {
        tabWeekly.classList.add('text-arkGreen', 'border-arkGreen');
        tabWeekly.classList.remove('text-gray-500', 'border-transparent');
        tabHot.classList.remove('text-arkGreen', 'border-arkGreen');
        tabHot.classList.add('text-gray-500', 'border-transparent');
        
        contentWeekly.classList.remove('hidden');
        contentWeekly.classList.add('flex');
        contentHot.classList.add('hidden');
      });

      tabHot.addEventListener('click', () => {
        tabHot.classList.add('text-arkGreen', 'border-arkGreen');
        tabHot.classList.remove('text-gray-500', 'border-transparent');
        tabWeekly.classList.remove('text-arkGreen', 'border-arkGreen');
        tabWeekly.classList.add('text-gray-500', 'border-transparent');
        
        contentHot.classList.remove('hidden');
        contentWeekly.classList.add('hidden');
        contentWeekly.classList.remove('flex');
      });
    }
  });
