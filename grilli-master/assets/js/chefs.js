// Chefs Page JavaScript

class ChefsPage {
  constructor() {
    this.chefs = [];
    this.init();
  }

  async init() {
    this.checkLoginStatus();
    await this.loadChefs();
    this.displayChefs();
    this.setupLogoutButton();
  }

  setupLogoutButton() {
    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) {
      logoutBtn.addEventListener('click', () => {
        this.logout();
      });
    }
  }

  checkLoginStatus() {
    const isLoggedIn = localStorage.getItem('isLoggedIn') === 'true';
    const currentUser = JSON.parse(localStorage.getItem('currentUser') || 'null');

    if (isLoggedIn && currentUser) {
      this.updateUserInfo(currentUser);
      const logoutBtn = document.getElementById('logoutBtn');
      if (logoutBtn) {
        logoutBtn.style.display = 'inline-block';
      }
    } else {
      // Don't redirect - let users browse freely
      // Just hide the logout button
      const logoutBtn = document.getElementById('logoutBtn');
      if (logoutBtn) {
        logoutBtn.style.display = 'none';
      }
    }
  }

  updateUserInfo(user) {
    // Update any user-specific elements on the page
  }

  async loadChefs() {
    try {
      const response = await fetch('/api/chefs/active');
      
      if (response.ok) {
        this.chefs = await response.json();
      } else {
        console.error('Failed to load chefs:', response.statusText);
        this.chefs = [];
      }
    } catch (error) {
      console.error('Error loading chefs:', error);
      this.chefs = [];
    }
  }

  displayChefs() {
    const chefsList = document.getElementById('chefsList');
    const noChefs = document.getElementById('noChefs');

    if (!chefsList || !noChefs) {
      console.error('Required DOM elements not found:', { chefsList, noChefs });
      return;
    }

    if (this.chefs.length === 0) {
      chefsList.style.display = 'none';
      noChefs.style.display = 'block';
      return;
    }

    chefsList.style.display = 'grid';
    noChefs.style.display = 'none';

    // Add loading animation
    chefsList.innerHTML = '<div class="loading-spinner">Loading our talented chefs...</div>';
    
    // Simulate loading delay for better UX
    setTimeout(() => {
      chefsList.innerHTML = this.chefs.map(chef => this.createChefCard(chef)).join('');
      this.addChefCardAnimations();
    }, 800);
  }

  addChefCardAnimations() {
    const chefCards = document.querySelectorAll('.chef-card');
    chefCards.forEach((card, index) => {
      card.style.opacity = '0';
      card.style.transform = 'translateY(30px)';
      
      setTimeout(() => {
        card.style.transition = 'all 0.6s cubic-bezier(0.4, 0, 0.2, 1)';
        card.style.opacity = '1';
        card.style.transform = 'translateY(0)';
      }, index * 150);
    });
  }

  createChefCard(chef) {
    const specialties = Array.isArray(chef.specialties) ? chef.specialties : [];
    const rating = chef.rating || 4.5;
    const status = chef.status || 'active';
    
    return `
      <div class="chef-card">
        <div class="chef-header">
          <img src="${chef.profilePhoto}"
               alt="Profile photo of ${chef.fullName}"
               class="chef-photo"
               loading="lazy"
               decoding="async"
               onerror="this.src='https://via.placeholder.com/96x96/ffd700/1a1a1a?text=👨‍🍳'">
          <div class="chef-info">
            <h3>${chef.fullName}</h3>
            <div class="experience">${chef.experience}</div>
            <div class="chef-rating">
              ${this.generateStarRating(rating)} ${rating}
            </div>
          </div>
        </div>

        <div class="chef-details">
          <div class="chef-specialties">
            <h4>Specialties</h4>
            <div class="specialty-tags">
              ${specialties.map(specialty => `<span class="specialty-tag">${specialty}</span>`).join('')}
            </div>
          </div>
          
          ${chef.bio ? `
            <div class="chef-bio">
              ${chef.bio}
            </div>
          ` : ''}
          
          <div class="chef-status">
            <span>Status</span>
            <span class="status-badge ${status}">${status}</span>
          </div>
        </div>
      </div>
    `;
  }

  generateStarRating(rating) {
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 >= 0.5;
    const emptyStars = 5 - fullStars - (hasHalfStar ? 1 : 0);
    
    let stars = '';
    
    // Full stars
    for (let i = 0; i < fullStars; i++) {
      stars += '★';
    }
    
    // Half star
    if (hasHalfStar) {
      stars += '☆';
    }
    
    // Empty stars
    for (let i = 0; i < emptyStars; i++) {
      stars += '☆';
    }
    
    return stars;
  }

  logout() {
    // Clear login status
    localStorage.removeItem('currentUser');
    localStorage.removeItem('isLoggedIn');
    // Redirect to main page
    window.location.href = './index.html';
  }
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  window.chefsPage = new ChefsPage();
});

// Handle preloader
window.addEventListener('load', function () {
  const preloader = document.querySelector("[data-preaload]");
  if (preloader) {
    preloader.classList.add("loaded");
    document.body.classList.add("loaded");
  }
});
