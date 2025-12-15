import authManager from '../utils/auth.js';

class FooterManager {
    constructor() {
        this.authManager = authManager;
        this.init();
    }

    init() {
        this.updateUI();
    }

    updateUI() {
        const footerSupport = document.getElementById('footer-support');
        if (!footerSupport) return;

        if (!this.authManager.isAuthenticated()) {
            footerSupport.style.display = 'none';
            return;
        }

        const role = this.authManager.getRole();
        
        if (role === 'PRESTADOR') {
            footerSupport.style.display = 'inline-block';
            footerSupport.href = '#';
            footerSupport.textContent = 'Documentação';
            footerSupport.addEventListener('click', (e) => {
                e.preventDefault();
                alert('Acesse a documentação de serviços');
            });
        } else if (role === 'CLIENTE') {
            footerSupport.style.display = 'inline-block';
            footerSupport.textContent = 'Avaliações';
            footerSupport.href = '#';
            footerSupport.addEventListener('click', (e) => {
                e.preventDefault();
                alert('Veja suas avaliações');
            });
        } else {
            footerSupport.style.display = 'none';
        }
    }
}

document.addEventListener('DOMContentLoaded', () => {
    setTimeout(() => {
        new FooterManager();
    }, 100);
});

export { FooterManager };
