// Main application logic for Gwent Marketplace
class GwentMarketplace {
    constructor() {
        this.currentView = 'templates';
        this.selectedTemplate = null;
        this.currentPage = 1;
        this.itemsPerPage = 10;
        this.searchQuery = '';
        this.filters = {
            faction: 'all',
            rarity: 'all',
            powerMin: 0,
            powerMax: 20
        };
        this.user = null;
        this.currentPack = null;

        this.init();
    }

    async init() {
        this.setupEventListeners();
        this.checkAuthentication();
        await this.loadInitialData();
    }

    setupEventListeners() {
        // Authentication events
        document.getElementById('login-btn').addEventListener('click', () => this.showView('login'));
        document.getElementById('register-btn').addEventListener('click', () => this.showView('register'));
        document.getElementById('logout-btn').addEventListener('click', () => this.logout());

        // Navigation events
        document.getElementById('packs-btn').addEventListener('click', () => this.showView('packs'));
        document.getElementById('collection-btn').addEventListener('click', () => this.showView('collection'));
        document.getElementById('back-to-templates').addEventListener('click', () => this.showView('templates'));
        document.getElementById('back-to-marketplace').addEventListener('click', () => this.showView('templates'));
        document.getElementById('back-from-collection').addEventListener('click', () => this.showView('templates'));
        document.getElementById('back-from-login').addEventListener('click', () => this.showView('templates'));
        document.getElementById('back-from-register').addEventListener('click', () => this.showView('templates'));
        
        // Pagination event handlers
        document.getElementById('prev-page').addEventListener('click', () => this.previousPage());
        document.getElementById('next-page').addEventListener('click', () => this.nextPage());

        // Filter events
        document.getElementById('filter-btn').addEventListener('click', () => this.toggleFilterPanel());
        document.getElementById('close-filter').addEventListener('click', () => this.hideFilterPanel());
        document.getElementById('apply-filters').addEventListener('click', () => this.applyFilters());
        document.getElementById('clear-filters').addEventListener('click', () => this.clearFilters());
        
        // Search functionality
        document.getElementById('search-input').addEventListener('input', (e) => this.handleSearch(e.target.value));
        
        // Power range sliders
        document.getElementById('power-min').addEventListener('input', (e) => this.updatePowerRange());
        document.getElementById('power-max').addEventListener('input', (e) => this.updatePowerRange());


        // Auth form events
        document.getElementById('login-form').addEventListener('submit', (e) => this.handleLogin(e));
        document.getElementById('register-form').addEventListener('submit', (e) => this.handleRegister(e));
        document.getElementById('switch-to-register').addEventListener('click', () => this.showView('register'));
        document.getElementById('switch-to-login').addEventListener('click', () => this.showView('login'));


        // User dropdown events
        document.getElementById('user-dropdown-btn').addEventListener('click', (e) => {
            e.stopPropagation();
            this.toggleUserDropdown();
        });

        // Close dropdowns when clicking outside
        document.addEventListener('click', () => {
            this.hideUserDropdown();
        });

        // Filter overlay click
        document.querySelector('.filter-overlay').addEventListener('click', () => this.hideFilterPanel());

        // Auth events from API
        window.addEventListener('auth:logout', () => this.handleAuthLogout());
    }

    checkAuthentication() {
        if (window.API.isAuthenticated()) {
            // For cookie-based auth, we need to set a basic user object
            // since we don't have a separate profile endpoint
            this.user = { username: 'User', coinBalance: 0 };
            this.updateAuthUI();
        }
    }

    async loadUserProfile() {
        // Since backend doesn't have separate profile endpoint,
        // we'll rely on login response data
        if (window.API.isAuthenticated()) {
            this.updateAuthUI();
        }
    }

    updateAuthUI() {
        const isAuthenticated = !!this.user;

        // Toggle auth sections
        document.getElementById('login-buttons').classList.toggle('hidden', isAuthenticated);
        document.getElementById('user-menu').classList.toggle('hidden', !isAuthenticated);
        document.getElementById('coin-balance').classList.toggle('hidden', !isAuthenticated);

        if (isAuthenticated && this.user) {
            document.getElementById('username').textContent = this.user.username || 'User';
            document.getElementById('balance-amount').textContent = this.user.balance ? this.user.balance.toLocaleString() : '0';
        }
    }

    async handleLogin(e) {
        e.preventDefault();
        const email = document.getElementById('login-email').value;
        const password = document.getElementById('login-password').value;
        const submitBtn = document.getElementById('login-submit');

        this.setLoading(submitBtn, true);

        try {
            const response = await window.API.auth.login(email, password);
            // Backend returns user data directly
            this.user = response;
            // Ensure balance is properly set from login response
            if (this.user && this.user.balance !== undefined) {
                this.user.balance = this.user.balance;
            }
            this.updateAuthUI();
            this.showToast('success', 'Login successful!');
            this.showView('templates');
        } catch (error) {
            this.showToast('error', error.message || 'Login failed');
        } finally {
            this.setLoading(submitBtn, false);
        }
    }

    async handleRegister(e) {
        e.preventDefault();
        const username = document.getElementById('register-username').value;
        const email = document.getElementById('register-email').value;
        const password = document.getElementById('register-password').value;
        const confirmPassword = document.getElementById('register-confirm-password').value;
        const submitBtn = document.getElementById('register-submit');

        if (password !== confirmPassword) {
            this.showToast('error', 'Passwords do not match');
            return;
        }

        this.setLoading(submitBtn, true);

        try {
            await window.API.auth.register(username, email, password);
            this.showToast('success', 'Account created successfully! Please log in.');
            this.showView('login');
        } catch (error) {
            this.showToast('error', error.message || 'Registration failed');
        } finally {
            this.setLoading(submitBtn, false);
        }
    }

    async logout() {
        try {
            await window.API.auth.logout();
        } catch (error) {
            console.error('Logout error:', error);
        } finally {
            this.user = null;
            this.updateAuthUI();
            this.showToast('success', 'Logged out successfully');
            this.showView('templates');
        }
    }

    handleAuthLogout() {
        this.user = null;
        this.updateAuthUI();
        this.showView('templates');
    }

    async loadInitialData() {
        await this.loadTemplates();
    }

    async loadTemplates() {
        try {
            const response = await window.API.cards.getTemplates();
            this.allTemplates = response;
            this.renderCurrentPage();
        } catch (error) {
            console.error('Failed to load templates:', error);
            this.showToast('error', 'Failed to load card templates');
        }
    }

    renderCurrentPage() {
        if (!this.allTemplates) return;
        
        // Apply filters and search
        const filteredTemplates = this.applyFiltersToTemplates(this.allTemplates);
        
        const startIndex = (this.currentPage - 1) * this.itemsPerPage;
        const endIndex = startIndex + this.itemsPerPage;
        const currentPageTemplates = filteredTemplates.slice(startIndex, endIndex);
        
        this.renderTemplates(currentPageTemplates);
        this.updateTemplatesCount(filteredTemplates.length);
    }

    applyFiltersToTemplates(templates) {
        let filtered = [...templates];
        
        // Search filter
        if (this.searchQuery && this.searchQuery.trim()) {
            const query = this.searchQuery.toLowerCase();
            filtered = filtered.filter(template => 
                template.card.name.toLowerCase().includes(query) ||
                template.card.faction.toLowerCase().includes(query) ||
                template.card.type.toLowerCase().includes(query)
            );
        }
        
        // Faction filter
        if (this.filters.faction && this.filters.faction !== 'all') {
            filtered = filtered.filter(template => 
                template.card.faction.toLowerCase() === this.filters.faction.toLowerCase()
            );
        }
        
        // Rarity filter
        if (this.filters.rarity && this.filters.rarity !== 'all') {
            filtered = filtered.filter(template => 
                template.card.rarity.toLowerCase() === this.filters.rarity.toLowerCase()
            );
        }
        
        // Power range filter
        if (this.filters.powerMin !== undefined && this.filters.powerMax !== undefined) {
            filtered = filtered.filter(template => 
                template.card.power >= this.filters.powerMin && 
                template.card.power <= this.filters.powerMax
            );
        }
        
        return filtered;
    }

    handleSearch(query) {
        this.searchQuery = query;
        this.currentPage = 1; // Reset to first page
        this.renderCurrentPage();
    }

    renderTemplates(templates) {
        const grid = document.getElementById('templates-grid');
        grid.innerHTML = '';

        templates.forEach(template => {
            const card = this.createTemplateCard(template);
            grid.appendChild(card);
        });
    }

    createTemplateCard(template) {
        const cardElement = document.createElement('div');
        cardElement.className = 'card-item';
        cardElement.addEventListener('click', () => this.selectTemplate(template));

        // Backend returns {card: {...}, count: number} structure
        const cardData = template.card;
        const count = template.count;

        cardElement.innerHTML = `
            <div class="card-image-container">
                <img src="${cardData.imageUrl}" alt="${cardData.name}" class="card-image">
                <div class="card-power-badge">${cardData.power}</div>
            </div>
            <div class="card-info">
                <h3 class="card-title">${cardData.name}</h3>
                <div class="card-meta">
                    <span class="card-faction">${cardData.faction}</span>
                    <span class="card-type">${cardData.type}</span>
                </div>
                <p class="card-description">${cardData.ability || 'Hero. Immune to weather and special effects.'}</p>
                <div class="card-stats">
                    <span><i class="fas fa-users"></i> ${count} listings</span>
                    <span><i class="fas fa-coins"></i> Available for purchase</span>
                </div>
            </div>
            <div class="card-actions">
                <div class="card-badge rarity-${cardData.rarity.toLowerCase()}">${cardData.rarity}</div>
                <button class="btn btn-outline view-listings-btn" onclick="app.selectTemplate(${JSON.stringify(template).replace(/"/g, '&quot;')})">
                    View Listings <i class="fas fa-chevron-right"></i>
                </button>
            </div>
        `;

        return cardElement;
    }

    getLowestPrice(count) {
        // Mock pricing based on count - you can replace with real data
        return count > 10 ? '8,500' : count > 5 ? '12,000' : '15,000';
    }

    updateTemplatesCount(total) {
        const countElement = document.getElementById('templates-count');
        const start = (this.currentPage - 1) * this.itemsPerPage + 1;
        const end = Math.min(start + this.itemsPerPage - 1, total);
        countElement.textContent = `Showing ${start}-${end} of ${total} cards`;
        
        // Update pagination controls
        this.updatePaginationControls(total);
    }

    updatePaginationControls(total) {
        const totalPages = Math.ceil(total / this.itemsPerPage);
        const prevBtn = document.getElementById('prev-page');
        const nextBtn = document.getElementById('next-page');
        const pageInfo = document.getElementById('page-info');
        
        prevBtn.disabled = this.currentPage <= 1;
        nextBtn.disabled = this.currentPage >= totalPages;
        pageInfo.textContent = `Page ${this.currentPage} of ${totalPages}`;
    }

    applyFilters() {
        // Get filter values
        this.filters.faction = document.getElementById('faction-filter').value;
        this.filters.rarity = document.getElementById('rarity-filter').value;
        this.filters.powerMin = parseInt(document.getElementById('power-min').value);
        this.filters.powerMax = parseInt(document.getElementById('power-max').value);
        
        this.currentPage = 1; // Reset to first page
        this.renderCurrentPage();
        this.hideFilterPanel();
    }

    clearFilters() {
        // Reset filter values
        document.getElementById('faction-filter').value = 'all';
        document.getElementById('rarity-filter').value = 'all';
        document.getElementById('power-min').value = 0;
        document.getElementById('power-max').value = 20;
        
        this.filters = {
            faction: 'all',
            rarity: 'all',
            powerMin: 0,
            powerMax: 20
        };
        
        this.searchQuery = '';
        document.getElementById('search-input').value = '';
        
        this.currentPage = 1;
        this.renderCurrentPage();
        this.updatePowerRange();
    }

    previousPage() {
        if (this.currentPage > 1) {
            this.currentPage--;
            this.renderCurrentPage();
        }
    }

    nextPage() {
        const filteredTemplates = this.applyFiltersToTemplates(this.allTemplates);
        const totalPages = Math.ceil(filteredTemplates.length / this.itemsPerPage);
        if (this.currentPage < totalPages) {
            this.currentPage++;
            this.renderCurrentPage();
        }
    }

    async selectTemplate(template) {
        this.selectedTemplate = template;
        this.showView('listings');
        await this.loadListings();
    }

    async loadListings() {
        if (!this.selectedTemplate) return;

        try {
            this.showLoading(true);
            const response = await window.API.listings.getCardListings(
                this.selectedTemplate.card.name
            );

            this.renderCardDetails();
            this.renderListings(response);
        } catch (error) {
            console.error('Failed to load listings:', error);
            this.showToast('error', 'Failed to load listings');
        } finally {
            this.showLoading(false);
        }
    }

    renderCardDetails() {
        const container = document.getElementById('selected-card-details');
        const cardData = this.selectedTemplate.card;

        container.innerHTML = `
            <div class="card-details-content">
                <div class="card-details-image-container">
                    <img src="${cardData.imageUrl}" alt="${cardData.name}" class="card-details-image">
                    <div class="card-power-badge">${cardData.power}</div>
                </div>
                <div class="card-details-info">
                    <h1 class="card-details-title">${cardData.name}</h1>
                    <div class="card-details-badges">
                        <div class="card-badge badge-${cardData.rarity.toLowerCase()}">${cardData.rarity}</div>
                        <span class="card-set">Set: ${cardData.set || 'Base Set'}</span>
                        <span class="card-category">Category: ${cardData.category}</span>
                    </div>
                    <div class="card-details-stats">
                        <div class="stat-row">
                            <span class="stat-label">Faction:</span>
                            <span class="stat-value faction-value">${cardData.faction}</span>
                        </div>
                        <div class="stat-row">
                            <span class="stat-label">Type:</span>
                            <span class="stat-value">${cardData.type}</span>
                        </div>
                        <div class="stat-row">
                            <span class="stat-label">Power:</span>
                            <span class="stat-value">${cardData.power}</span>
                        </div>
                        <div class="stat-row">
                            <span class="stat-label">Provision:</span>
                            <span class="stat-value">${cardData.provision}</span>
                        </div>
                    </div>
                    <div class="card-details-description">
                        <div class="stat-label">Ability:</div>
                        <p class="ability-text">${cardData.ability || 'Hero. Immune to weather and special effects.'}</p>
                        ${cardData.flavor ? `
                            <div class="stat-label">Flavor:</div>
                            <p class="flavor-text">${cardData.flavor}</p>
                        ` : ''}
                    </div>
                </div>
            </div>
        `;
    }

    renderListings(listings) {
        const container = document.getElementById('listings-list');
        container.innerHTML = '';

        if (!listings || listings.length === 0) {
            container.innerHTML = '<div class="no-listings">No listings available for this card.</div>';
            return;
        }

        // Create listings header
        const headerElement = document.createElement('div');
        headerElement.className = 'listings-header';
        headerElement.innerHTML = `
            <div class="listings-title">
                <h3>Available Listings (${listings.length})</h3>
                <p>Choose from the available cards below</p>
            </div>
        `;
        container.appendChild(headerElement);

        // Create listings table
        const tableElement = document.createElement('div');
        tableElement.className = 'listings-table';
        
        // Table header
        tableElement.innerHTML = `
            <div class="listings-table-header">
                <div class="listing-col-seller">Seller</div>
                <div class="listing-col-card">Card #</div>
                <div class="listing-col-condition">Condition</div>
                <div class="listing-col-price">Price</div>
                <div class="listing-col-actions">Action</div>
            </div>
        `;

        listings.forEach((listing, index) => {
            console.log('Listing object:', listing); // Debug log to see actual structure
            const listingElement = document.createElement('div');
            listingElement.className = 'listing-row';
            
            listingElement.innerHTML = `
                <div class="listing-col-seller">
                    <div class="seller-info">
                        <i class="fas fa-${listing.seller ? 'user-circle' : 'store'}"></i>
                        <span>${listing.seller ? listing.seller.username : 'System Store'}</span>
                        ${!listing.seller ? '<small class="system-sale">First-time sale</small>' : ''}
                    </div>
                </div>
                <div class="listing-col-card">
                    <span class="card-number">#${listing.card.number || (1000 + index)}</span>
                </div>
                <div class="listing-col-condition">
                    <span class="condition-badge condition-mint">Mint</span>
                </div>
                <div class="listing-col-price">
                    <div class="price-info">
                        <i class="fas fa-coins"></i>
                        <span>${listing.price || this.generatePrice(index)}</span>
                    </div>
                </div>
                <div class="listing-col-actions">
                    <button class="btn btn-primary buy-btn" onclick="app.buyCard('${listing.card.cardTemplate.name}', ${parseInt(listing.card.number)}, ${listing.price || this.generatePrice(index)})">
                        <i class="fas fa-shopping-cart"></i>
                        Buy Now
                    </button>
                </div>
            `;
            
            tableElement.appendChild(listingElement);
        });

        container.appendChild(tableElement);
    }

    generatePrice(index) {
        const basePrices = ['8,500', '9,200', '8,750', '10,100', '9,800', '8,900', '11,500', '9,600'];
        return basePrices[index % basePrices.length];
    }

    async buyCard(cardName, cardNumber, price) {
        if (!this.user) {
            this.showToast('error', 'Please log in to purchase cards');
            return;
        }

        try {
            this.showLoading(true);
            await window.API.listings.buyCard(cardName, parseInt(cardNumber));

            // Update user balance from backend
            await this.updateBalance();

            this.showToast('success', 'Card purchased successfully!');
            await this.loadListings(); // Reload listings
        } catch (error) {
            console.error('Purchase failed:', error);
            this.showToast('error', error.message || 'Purchase failed');
        } finally {
            this.showLoading(false);
        }
    }

    async loadPacks() {
        try {
            this.showLoading(true);
            const response = await window.API.packs.getPacks();
            this.renderPacks(response.data || response);
        } catch (error) {
            console.error('Failed to load packs:', error);
            this.showToast('error', 'Failed to load packs');
        } finally {
            this.showLoading(false);
        }
    }

    renderPacks(packs) {
        const grid = document.getElementById('packs-grid');
        grid.innerHTML = '';

        if (!packs || packs.length === 0) {
            grid.innerHTML = '<div class="no-packs">No packs available.</div>';
            return;
        }

        packs.forEach(pack => {
            const packElement = document.createElement('div');
            packElement.className = 'pack-card';
            packElement.addEventListener('click', () => this.openPack(pack.name));

            packElement.innerHTML = `
                <div class="pack-header">
                    <div class="pack-title-section">
                        <h3 class="pack-title">${pack.name} Pack</h3>
                        <p class="pack-subtitle">${pack.description || 'Premium card collection'}</p>
                    </div>
                </div>
                
                <div class="pack-content">
                    <div class="pack-stats">
                        <div class="pack-stat">
                            <div class="stat-icon">
                                <i class="fas fa-layer-group"></i>
                            </div>
                            <div class="stat-info">
                                <span class="stat-value">${pack.numberOfCards || 5}</span>
                                <span class="stat-label">Cards</span>
                            </div>
                        </div>
                        <div class="pack-stat">
                            <div class="stat-icon">
                                <i class="fas fa-coins"></i>
                            </div>
                            <div class="stat-info">
                                <span class="stat-value">${pack.price || 1000}</span>
                                <span class="stat-label">Coins</span>
                            </div>
                        </div>
                    </div>

                    <div class="pack-probabilities">
                        <h4 class="probabilities-title">Drop Rates</h4>
                        <div class="probabilities-list">
                            ${pack.probabilities ? this.formatProbabilitiesWithBadges(pack.probabilities) : this.getDefaultProbabilitiesWithBadges()}
                        </div>
                    </div>
                </div>

                <div class="pack-footer">
                    <button class="btn btn-primary pack-buy-btn" onclick="event.stopPropagation(); app.buyPack('${pack.name}', ${pack.price})">
                        <i class="fas fa-shopping-cart"></i>
                        Open Pack
                    </button>
                </div>
            `;

            grid.appendChild(packElement);
        });
    }

    formatProbabilities(probabilities) {
        if (Array.isArray(probabilities)) {
            const rarities = ['Common', 'Rare', 'Epic', 'Legendary'];
            return probabilities.map((prob, index) => {
                const rarity = rarities[index] || `Rarity ${index + 1}`;
                const percentage = (prob * 100).toFixed(1);
                return `<div class="probability-item rarity-${rarity.toLowerCase()}">
                    <span class="probability-rarity">${rarity}</span>
                    <span class="probability-value">${percentage}%</span>
                </div>`;
            }).join('');
        }
        
        return Object.entries(probabilities).map(([rarity, prob]) => {
            const percentage = (prob * 100).toFixed(1);
            return `<div class="probability-item rarity-${rarity.toLowerCase()}">
                <span class="probability-rarity">${rarity}</span>
                <span class="probability-value">${percentage}%</span>
            </div>`;
        }).join('');
    }

    formatProbabilitiesWithBadges(probabilities) {
        if (Array.isArray(probabilities)) {
            const rarities = ['Common', 'Rare', 'Epic', 'Legendary'];
            return probabilities.map((prob, index) => {
                const rarity = rarities[index] || `Rarity ${index + 1}`;
                const percentage = prob.toFixed(1);
                return `<div class="probability-item-with-badge rarity-${rarity.toLowerCase()}">
                    <div class="rarity-badge rarity-${rarity.toLowerCase()}">${rarity}</div>
                    <span class="probability-value">${percentage}%</span>
                </div>`;
            }).join('');
        }
        
        return Object.entries(probabilities).map(([rarity, prob]) => {
            const percentage = (prob * 100).toFixed(1);
            return `<div class="probability-item-with-badge rarity-${rarity.toLowerCase()}">
                <div class="rarity-badge rarity-${rarity.toLowerCase()}">${rarity}</div>
                <span class="probability-value">${percentage}%</span>
            </div>`;
        }).join('');
    }

    getDefaultProbabilities() {
        return `
            <div class="probability-item rarity-common">
                <span class="probability-rarity">Common</span>
                <span class="probability-value">60.0%</span>
            </div>
            <div class="probability-item rarity-rare">
                <span class="probability-rarity">Rare</span>
                <span class="probability-value">25.0%</span>
            </div>
            <div class="probability-item rarity-epic">
                <span class="probability-rarity">Epic</span>
                <span class="probability-value">12.0%</span>
            </div>
            <div class="probability-item rarity-legendary">
                <span class="probability-rarity">Legendary</span>
                <span class="probability-value">3.0%</span>
            </div>
        `;
    }

    getDefaultProbabilitiesWithBadges() {
        return `
            <div class="probability-item-with-badge rarity-common">
                <div class="rarity-badge rarity-common">Common</div>
                <span class="probability-value">60.0%</span>
            </div>
            <div class="probability-item-with-badge rarity-rare">
                <div class="rarity-badge rarity-rare">Rare</div>
                <span class="probability-value">25.0%</span>
            </div>
            <div class="probability-item-with-badge rarity-epic">
                <div class="rarity-badge rarity-epic">Epic</div>
                <span class="probability-value">12.0%</span>
            </div>
            <div class="probability-item-with-badge rarity-legendary">
                <div class="rarity-badge rarity-legendary">Legendary</div>
                <span class="probability-value">3.0%</span>
            </div>
        `;
    }

    async buyPack(packId, price) {
        if (!this.user) {
            this.showToast('error', 'Please log in to purchase packs');
            return;
        }

        try {
            this.showLoading(true);
            const response = await window.API.packs.buyPack(packId);

            // Update user balance from backend
            await this.updateBalance();

            this.showToast('success', 'Pack purchased successfully!');
            
            // Show pack opening results
            this.renderPackResults(response.cards || response);
            this.showView('pack-opening');
        } catch (error) {
            console.error('Pack purchase failed:', error);
            this.showToast('error', error.message || 'Pack purchase failed');
        } finally {
            this.showLoading(false);
        }
    }

    async openPack(packName) {
        try {
            this.showLoading(true);
            const response = await window.API.packs.openPack(packName);
            
            // Update balance after pack opening
            await this.updateBalance();
            
            this.currentPack = packName;
            this.showView('pack-opening');
            this.renderPackResults(response);
        } catch (error) {
            console.error('Failed to open pack:', error);
            this.showToast('error', error.message || 'Failed to open pack');
        } finally {
            this.showLoading(false);
        }
    }

    showPackOpening() {
        document.getElementById('pack-name').textContent = this.currentPack.name;
        document.getElementById('pack-opening-modal').classList.remove('hidden');
        document.getElementById('pack-unopened').classList.remove('hidden');
        document.getElementById('pack-opened').classList.add('hidden');
    }

    async loadCollection() {
        try {
            const response = await window.API.user.getCollection();
            this.renderCollection(response.cards || response);
        } catch (error) {
            console.error('Failed to load collection:', error);
            this.showToast('error', 'Failed to load collection');
        }
    }

    renderCollection(cards) {
        const grid = document.getElementById('collection-grid');
        grid.innerHTML = '';

        if (!cards || cards.length === 0) {
            grid.innerHTML = '<p class="text-center">Your collection is empty. Purchase some packs to get started!</p>';
            return;
        }

        cards.forEach(card => {
            const cardElement = this.createCollectionCard(card);
            grid.appendChild(cardElement);
        });
    }

    createCollectionCard(card) {
        const element = document.createElement('div');
        element.className = 'card-item';

        // Use the cardTemplate structure from API response
        const cardTemplate = card.cardTemplate;
        const cardNumber = card.number || 'N/A';
        const rarity = cardTemplate.rarity || 'Common';
        const power = cardTemplate.power !== undefined ? cardTemplate.power : 'N/A';
        const faction = cardTemplate.faction || 'Neutral';
        const type = cardTemplate.type || 'Unit';
        const name = cardTemplate.name || 'Unknown Card';
        const description = cardTemplate.ability || cardTemplate.description || 'No description available.';
        const image = cardTemplate.imageUrl || cardTemplate.image || 'https://via.placeholder.com/200x280/1f2937/ffffff?text=Card';

        element.innerHTML = `
            <div class="card-image-container">
                <img src="${image}" alt="${name}" class="card-image">
                <div class="card-power-badge">${power}</div>
            </div>
            <div class="card-content">
                <div class="card-info">
                    <h3 class="card-name">${name}</h3>
                    <p class="card-details">${faction} • ${type}</p>
                    <p class="card-description">${description}</p>
                    <div class="card-stats">
                        <span class="card-number">Card #${cardNumber}</span>
                    </div>
                </div>
                <div class="card-actions">
                    <div class="card-badge rarity-${rarity.toLowerCase()}">${rarity}</div>
                    <button class="btn btn-outline btn-sm" onclick="app.showSellCardModal('${name}', ${cardNumber})">
                        <i class="fas fa-tag"></i>
                        Sell Card
                    </button>
                    <button class="btn btn-secondary btn-sm" onclick="app.quicksellCard('${name}', ${cardNumber})">
                        <i class="fas fa-bolt"></i>
                        Quick Sell
                    </button>
                </div>
            </div>
        `;

        return element;
    }

    async updateBalance() {
        try {
            const balance = await window.API.user.getBalance();
            if (this.user && balance !== undefined) {
                this.user.balance = balance;
                this.updateAuthUI();
            }
        } catch (error) {
            console.error('Failed to update balance:', error);
        }
    }

    async quicksellCard(cardName, cardNumber) {
        if (!this.user) {
            this.showToast('error', 'Please log in to sell cards');
            return;
        }

        try {
            this.showLoading(true);
            await window.API.user.quicksellCard(cardName, parseInt(cardNumber));
            
            this.showToast('success', 'Card sold successfully!');
            
            // Remove the sold card from collection display immediately
            this.removeSoldCardFromDisplay(cardName, cardNumber);
            
            // Update balance from backend
            await this.updateBalance();
            
            // Also reload collection to ensure consistency
            setTimeout(() => this.loadCollection(), 500);
        } catch (error) {
            console.error('Failed to quicksell card:', error);
            this.showToast('error', error.message || 'Failed to sell card');
        } finally {
            this.showLoading(false);
        }
    }

    renderPackResults(cards) {
        const grid = document.getElementById('pack-results-grid');
        grid.innerHTML = '';

        if (!cards || cards.length === 0) {
            grid.innerHTML = '<p class="text-center">No cards found in pack.</p>';
            return;
        }

        cards.forEach(card => {
            const cardElement = this.createPackResultCard(card);
            grid.appendChild(cardElement);
        });
    }

    createPackResultCard(card) {
        const element = document.createElement('div');
        element.className = 'card-item';

        // Use the cardTemplate structure from API response
        const cardTemplate = card.cardTemplate;
        const cardNumber = card.number || 'N/A';
        const rarity = cardTemplate.rarity || 'Common';
        const power = cardTemplate.power !== undefined ? cardTemplate.power : 'N/A';
        const faction = cardTemplate.faction || 'Neutral';
        const type = cardTemplate.type || 'Unit';
        const name = cardTemplate.name || 'Unknown Card';
        const description = cardTemplate.ability || cardTemplate.description || 'No description available.';
        const image = cardTemplate.imageUrl || cardTemplate.image || 'https://via.placeholder.com/200x280/1f2937/ffffff?text=Card';

        element.innerHTML = `
            <div class="card-image-container">
                <img src="${image}" alt="${name}" class="card-image">
                <div class="power-badge">${power}</div>
            </div>
            <div class="card-content">
                <div class="card-info">
                    <h3 class="card-name">${name}</h3>
                    <p class="card-details">${faction} • ${type}</p>
                    <p class="card-description">${description}</p>
                    <div class="card-stats">
                        <span class="card-number">Card #${cardNumber}</span>
                    </div>
                </div>
                <div class="card-actions">
                    <div class="card-badge rarity-${rarity.toLowerCase()}">${rarity}</div>
                </div>
            </div>
        `;

        return element;
    }

    closePack() {
        document.getElementById('pack-opening-modal').classList.add('hidden');
        this.currentPack = null;
        this.showView('packs');
    }

    showView(viewName) {
        // Hide all views
        document.querySelectorAll('.view').forEach(view => {
            view.classList.add('hidden');
        });

        // Show selected view
        document.getElementById(`${viewName}-view`).classList.remove('hidden');

        // Update search visibility
        const searchSection = document.getElementById('search-section');
        const showSearch = viewName === 'templates' || viewName === 'listings';
        searchSection.classList.toggle('hidden', !showSearch);

        this.currentView = viewName;

        // Load data for the view
        switch (viewName) {
            case 'templates':
                this.currentPage = 1;
                this.loadTemplates();
                break;
            case 'packs':
                this.currentPage = 1;
                this.loadPacks();
                break;
            case 'collection':
                this.loadCollection();
                break;
            case 'pack-opening':
                // Pack opening view - no data loading needed
                break;
        }
    }

    showSellCardModal(cardName, cardNumber) {
        this.selectedCardForSale = { name: cardName, number: cardNumber };
        document.getElementById('sell-card-modal').classList.remove('hidden');
        document.getElementById('sell-card-name').textContent = cardName;
        document.getElementById('sell-card-number').textContent = `#${cardNumber}`;
        document.getElementById('sell-price-input').value = '';
        document.getElementById('sell-price-input').focus();
    }

    hideSellCardModal() {
        document.getElementById('sell-card-modal').classList.add('hidden');
        this.selectedCardForSale = null;
    }

    async sellCard() {
        if (!this.selectedCardForSale) {
            this.showToast('error', 'No card selected for sale');
            return;
        }

        const price = parseInt(document.getElementById('sell-price-input').value);
        if (!price || price <= 0) {
            this.showToast('error', 'Please enter a valid price');
            return;
        }

        // Store card info before clearing selectedCardForSale
        const cardToSell = {
            name: this.selectedCardForSale.name,
            number: this.selectedCardForSale.number
        };

        try {
            this.showLoading(true);
            await window.API.listings.createListing(
                cardToSell.name, 
                cardToSell.number, 
                price
            );
            
            this.showToast('success', 'Card listed for sale successfully!');
            this.hideSellCardModal();
            
            // Remove the sold card from collection display immediately
            this.removeSoldCardFromDisplay(cardToSell.name, cardToSell.number);
            
            // Also reload collection to ensure consistency with backend
            setTimeout(() => this.loadCollection(), 500);
        } catch (error) {
            console.error('Failed to list card:', error);
            this.showToast('error', error.message || 'Failed to list card for sale');
        } finally {
            this.showLoading(false);
        }
    }

    removeSoldCardFromDisplay(cardName, cardNumber) {
        const collectionGrid = document.getElementById('collection-grid');
        const cardElements = collectionGrid.querySelectorAll('.card-item');
        
        cardElements.forEach(element => {
            const nameElement = element.querySelector('.card-name');
            const numberElement = element.querySelector('.card-number');
            
            if (nameElement && numberElement) {
                const displayedName = nameElement.textContent;
                const displayedNumber = numberElement.textContent.replace('Card #', '');
                
                if (displayedName === cardName && displayedNumber === cardNumber.toString()) {
                    element.style.transition = 'opacity 0.3s ease';
                    element.style.opacity = '0';
                    setTimeout(() => element.remove(), 300);
                }
            }
        });
    }

    updateCollectionCount(total) {
        document.getElementById('collection-count').textContent = `${total} cards in your collection`;
    }

    toggleFilterPanel() {
        document.getElementById('filter-panel').classList.toggle('hidden');
    }

    hideFilterPanel() {
        document.getElementById('filter-panel').classList.add('hidden');
    }

    updatePowerRange() {
        const minSlider = document.getElementById('power-min');
        const maxSlider = document.getElementById('power-max');
        const minValue = parseInt(minSlider.value);
        const maxValue = parseInt(maxSlider.value);

        // Ensure min doesn't exceed max
        if (minValue > maxValue) {
            minSlider.value = maxValue;
        }
        // Ensure max doesn't go below min
        if (maxValue < minValue) {
            maxSlider.value = minValue;
        }

        document.getElementById('power-min-value').textContent = minSlider.value;
        document.getElementById('power-max-value').textContent = maxSlider.value;
    }

    applyFilters() {
        // Get filter values
        this.filters.faction = document.getElementById('faction-filter').value;
        this.filters.minPower = parseInt(document.getElementById('power-min').value);
        this.filters.maxPower = parseInt(document.getElementById('power-max').value);

        // Get rarity checkboxes
        this.filters.rarities = Array.from(document.querySelectorAll('.rarity-checkbox:checked'))
            .map(cb => cb.value);

        // Get type checkboxes
        this.filters.types = Array.from(document.querySelectorAll('.type-checkbox:checked'))
            .map(cb => cb.value);

        this.currentPage = 1;
        this.hideFilterPanel();
        this.loadTemplates();
    }

    clearFilters() {
        this.filters = {
            search: '',
            faction: 'All',
            rarities: [],
            types: [],
            maxPower: 15
        };

        // Reset UI
        document.getElementById('faction-filter').value = 'All';
        document.getElementById('power-range').value = 15;
        document.getElementById('power-value').textContent = 15;
        document.getElementById('search-input').value = '';

        // Clear checkboxes
        document.querySelectorAll('.rarity-checkbox, .type-checkbox').forEach(cb => {
            cb.checked = false;
        });

        this.currentPage = 1;
        this.loadTemplates();
    }

    debounceSearch() {
        clearTimeout(this.searchTimeout);
        this.searchTimeout = setTimeout(() => {
            this.currentPage = 1;
            this.loadTemplates();
        }, 300);
    }

    toggleUserDropdown() {
        document.getElementById('user-dropdown').classList.toggle('hidden');
    }

    hideUserDropdown() {
        document.getElementById('user-dropdown').classList.add('hidden');
    }

    setLoading(button, loading) {
        if (loading) {
            button.disabled = true;
            button.dataset.originalText = button.textContent;
            button.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Loading...';
        } else {
            button.disabled = false;
            button.textContent = button.dataset.originalText;
        }
    }

    showLoading(show) {
        document.getElementById('loading-overlay').classList.toggle('hidden', !show);
    }

    showToast(type, message) {
        const container = document.getElementById('toast-container');
        const toast = document.createElement('div');
        toast.className = `toast ${type}`;

        const icons = {
            success: 'fas fa-check-circle',
            error: 'fas fa-exclamation-circle',
            warning: 'fas fa-exclamation-triangle',
            info: 'fas fa-info-circle'
        };

        toast.innerHTML = `
            <i class="${icons[type]} toast-icon"></i>
            <div class="toast-content">
                <div class="toast-message">${message}</div>
            </div>
            <button class="toast-close">
                <i class="fas fa-times"></i>
            </button>
        `;

        // Add close functionality
        toast.querySelector('.toast-close').addEventListener('click', () => {
            toast.remove();
        });

        container.appendChild(toast);

        // Auto remove after 5 seconds
        setTimeout(() => {
            toast.remove();
        }, 5000);
    }
}

// Initialize the application
document.addEventListener('DOMContentLoaded', () => {
    window.app = new GwentMarketplace();

    // Setup power range slider
    const powerRange = document.getElementById('power-range');
    const powerValue = document.getElementById('power-value');

    if (powerRange && powerValue) {
        powerRange.addEventListener('input', (e) => {
            powerValue.textContent = e.target.value;
        });
    }

    // Setup password toggles
    document.querySelectorAll('.password-toggle').forEach(toggle => {
        toggle.addEventListener('click', (e) => {
            const input = e.target.closest('.password-input').querySelector('input');
            const icon = e.target.closest('button').querySelector('i');

            if (input.type === 'password') {
                input.type = 'text';
                icon.className = 'fas fa-eye-off';
            } else {
                input.type = 'password';
                icon.className = 'fas fa-eye';
            }
        });
    });

    // Setup password requirements checker
    const registerPassword = document.getElementById('register-password');
    const requirements = document.getElementById('password-requirements');

    if (registerPassword && requirements) {
        registerPassword.addEventListener('input', (e) => {
            const password = e.target.value;

            if (password) {
                requirements.classList.remove('hidden');

                // Check each requirement
                const checks = {
                    length: password.length >= 8,
                    uppercase: /[A-Z]/.test(password),
                    lowercase: /[a-z]/.test(password),
                    number: /\d/.test(password)
                };

                Object.entries(checks).forEach(([requirement, met]) => {
                    const element = requirements.querySelector(`[data-requirement="${requirement}"]`);
                    const icon = element.querySelector('i');

                    element.classList.toggle('met', met);
                    icon.className = met ? 'fas fa-check' : 'fas fa-times';
                });
            } else {
                requirements.classList.add('hidden');
            }
        });
    }
});