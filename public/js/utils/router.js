class Router {
    constructor() {
        this.basePath = this.getBasePath();
    }

    getBasePath() {
        const currentPath = globalThis.location.pathname;
        
        if (currentPath.includes('/pages/')) {
            return '';
        }
        
        return '/pages';
    }

    getPageUrl(page) {
        const pageName = page.endsWith('.html') ? page : `${page}.html`;
        
        if (this.basePath) {
            return `${this.basePath}/${pageName}`;
        }
        
        return pageName;
    }

    navigateTo(page, replace = false) {
        const url = this.getPageUrl(page);
        
        if (replace) {
            globalThis.location.replace(url);
        } else {
            globalThis.location.href = url;
        }
    }

    redirectToLogin() {
        this.navigateTo('login', true);
    }

    redirectToDashboard(user) {
        if (!user || !user.tipo) {
            this.redirectToLogin();
            return;
        }

        switch (user.tipo) {
            case 'CLIENTE':
                this.navigateTo('dashboardCliente', true);
                break;
            case 'PRESTADOR':
                this.navigateTo('dashboardPrestador', true);
                break;
            case 'ADMIN':
                this.navigateTo('dashboardCliente', true);
                break;
            default:
                this.redirectToLogin();
        }
    }

    isCurrentPage(page) {
        const currentPath = globalThis.location.pathname;
        const pageName = page.endsWith('.html') ? page : `${page}.html`;
        
        return currentPath.includes(pageName);
    }

    getURLParams() {
        return new URLSearchParams(globalThis.location.search);
    }

    navigateToWithParams(page, params = {}) {
        const url = this.getPageUrl(page);
        const urlParams = new URLSearchParams(params);
        const fullUrl = urlParams.toString() ? `${url}?${urlParams.toString()}` : url;
        
        globalThis.location.href = fullUrl;
    }

    reload() {
        globalThis.location.reload();
    }

    goBack() {
        globalThis.history.back();
    }

    static PAGES = {
        LOGIN: 'login',
        REGISTER: 'register',
        DASHBOARD_CLIENTE: 'dashboardCliente',
        DASHBOARD_PRESTADOR: 'dashboardPrestador',
        CLIENTES: 'clientes',
        PRESTADORES: 'prestadores',
        SERVICOS: 'servicos',
        AGENDAMENTOS: 'agendamentos',
        AGENDA: 'agenda',
        PROFILE: 'profile',
        APPOINTMENTS: 'appointments',
        PROVIDERS: 'providers'
    };
}

const router = new Router();

export function resolvePath(page) {
    return router.getPageUrl(page);
}

export function dashboardForUser(user) {
    if (!user) return router.getPageUrl(Router.PAGES.LOGIN);
    
    const userType = user.tipo || user.role;
    switch (userType) {
        case 'PRESTADOR':
        case 'prestador':
            return router.getPageUrl(Router.PAGES.DASHBOARD_PRESTADOR);
        case 'CLIENTE':
        case 'cliente':
            return router.getPageUrl(Router.PAGES.DASHBOARD_CLIENTE);
        default:
            return router.getPageUrl(Router.PAGES.DASHBOARD_CLIENTE);
    }
}

export { Router };
export default router;