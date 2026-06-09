// Theme Toggle Functionality
(function() {
  // Get theme from localStorage or default to light
  const currentTheme = localStorage.getItem('theme') || 'light';
  const html = document.documentElement;
  
  // Apply theme immediately to prevent flash
  html.setAttribute('data-theme', currentTheme);
  
  // Update theme icon
  const updateThemeIcon = (theme) => {
    const themeIcon = document.querySelector('.theme-icon');
    if (themeIcon) {
      themeIcon.textContent = theme === 'dark' ? '☀️' : '🌙';
    }
  };

  // Dynamic Contrast Detection Function
  const adjustContrast = () => {
    const theme = document.documentElement.getAttribute('data-theme') || 'light';
    const elements = document.querySelectorAll('.sec1, .lang, .projectcard, .leftcont');
    
    elements.forEach(el => {
      // If we are in light mode, we might want to ensure black text on light bg
      // If we are in dark mode, we generally want white text
      if (theme === 'dark') {
        el.style.color = '#ffffff';
      } else {
        // Calculate brightness of the element's background to decide text color
        const bgColor = window.getComputedStyle(el).backgroundColor;
        const rgb = bgColor.match(/\d+/g);
        if (rgb) {
          const brightness = (Number(rgb[0]) * 299 + Number(rgb[1]) * 587 + Number(rgb[2]) * 114) / 1000;
          el.style.color = brightness > 128 ? '#000000' : '#ffffff';
        }
      }
    });
  };
  
  // Initialize theme icon
  updateThemeIcon(currentTheme);
  
  // Theme toggle button functionality
  document.addEventListener('DOMContentLoaded', () => {
    adjustContrast();
    const themeToggle = document.getElementById('themeToggle');
    
    if (themeToggle) {
      themeToggle.addEventListener('click', () => {
        const currentTheme = html.getAttribute('data-theme');
        const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
        
        // Update theme
        html.setAttribute('data-theme', newTheme);
        localStorage.setItem('theme', newTheme);
        
        // Update icon
        updateThemeIcon(newTheme);
        adjustContrast();
      });
    }
  });
})();

// Scroll to top button functionality
const slidupButton = document.querySelector(".slidup");

// Show or hide the button based on scroll position
window.addEventListener("scroll", () => {
  if (window.scrollY > 300) {
    slidupButton.classList.add("visible");
  } else {
    slidupButton.classList.remove("visible");
  }
});

// Scroll to top when the button is clicked
slidupButton.addEventListener("click", () => {
  window.scrollTo({
    top: 0,
    behavior: "smooth",
  });
});

// Mobile menu functionality
const hamburger = document.querySelector(".hamburger");
const closeBtn = document.querySelector(".close");
const navMenu = document.querySelector(".ul");
const navLinks = document.querySelectorAll(".ul .bar");

// Open menu
if (hamburger) {
  hamburger.addEventListener("click", (e) => {
    e.stopPropagation();
    navMenu.classList.add("active");
  });
}

// Close menu
if (closeBtn) {
  closeBtn.addEventListener("click", () => {
    navMenu.classList.remove("active");
  });
}

// Close menu when clicking on a link
navLinks.forEach(link => {
  link.addEventListener("click", () => {
    navMenu.classList.remove("active");
  });
});

// Close menu when clicking outside
document.addEventListener("click", (e) => {
  if (navMenu && navMenu.classList.contains("active")) {
    if (!navMenu.contains(e.target) && !hamburger.contains(e.target)) {
      navMenu.classList.remove("active");
    }
  }
});

// Prevent menu from closing when clicking inside it
if (navMenu) {
  navMenu.addEventListener("click", (e) => {
    e.stopPropagation();
  });
}


document.getElementById('contactForm').addEventListener('submit', async (e) => {
  e.preventDefault();

  const formData = {
    first_name: document.getElementById('first-name').value,
    last_name: document.getElementById('last-name').value,
    email: document.getElementById('email').value,
    phone: document.getElementById('phone').value,
    service: document.getElementById('service').value,
    message: document.getElementById('message').value
  };

  try {
    const response = await fetch('/api/contact', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(formData)
    });

    const ct = response.headers.get('content-type') || '';
    const data = ct.includes('application/json')
      ? await response.json()
      : null;

    if (data === null) {
      alert(
        'The contact API is not available. Run the site with: npm start (from the project folder), or open the page from a host that serves /api/contact.'
      );
      return;
    }

    if (response.ok) {
      alert('Message sent successfully!');
      document.getElementById('contactForm').reset();
      const successMessage = document.getElementById('successMessage');
      if (successMessage) {
        successMessage.style.display = 'block';
        setTimeout(() => {
          successMessage.style.display = 'none';
        }, 5000);
      }
    } else {
      console.error('Error response:', data);
      alert(`Failed to send message: ${data.error || data.message || 'Unknown error'}`);
    }
  } catch (error) {
    console.error('Fetch error:', error);
    alert(`Failed to send message: ${error.message}. Please check your connection and try again.`);
  }
});


// Intersection Observer for scroll animations
const observerOptions = {
  threshold: 0.1,
  rootMargin: "0px 0px -50px 0px",
};

const observer = new IntersectionObserver((entries) => {
  entries.forEach((entry) => {
    if (entry.isIntersecting) {
      entry.target.style.opacity = "1";
      entry.target.style.transform = "translateY(0)";
      observer.unobserve(entry.target);
    }
  });
}, observerOptions);

// Observe sections for scroll animations
document.addEventListener("DOMContentLoaded", () => {
  const sections = document.querySelectorAll(".Education, .skill, .projects, .contact, .sec1, .lang, .contact-list, .projectcard");
  sections.forEach((section) => {
    section.style.opacity = "0";
    section.style.transform = "translateY(30px)";
    section.style.transition = "opacity 0.6s ease-out, transform 0.6s ease-out";
    observer.observe(section);
  });
});
