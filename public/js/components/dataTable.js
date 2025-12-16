// Componente de tabela reutilizável para listagem de dados
export class DataTable {
    constructor(container, config = {}) {
        this.container = typeof container === 'string' ? document.querySelector(container) : container;
        this.config = {
            columns: [],
            data: [],
            pageSize: 10,
            showPagination: true,
            showSearch: true,
            actions: [], // Array de ações: [{ label: 'Editar', class: 'btn-edit', callback: (item) => {} }]
            emptyMessage: 'Nenhum registro encontrado',
            ...config
        };
        
        this.currentPage = 1;
        this.filteredData = [];
        this.searchTerm = '';
        
        this.render();
    }

    render() {
        this.container.innerHTML = `
            <div class="data-table">
                ${this.config.showSearch ? this.renderSearch() : ''}
                <div class="table-container">
                    <table class="w-full bg-white rounded-lg shadow-md overflow-hidden">
                        <thead class="bg-gray-50">
                            ${this.renderHeaders()}
                        </thead>
                        <tbody id="table-body">
                            ${this.renderBody()}
                        </tbody>
                    </table>
                </div>
                ${this.config.showPagination ? this.renderPagination() : ''}
            </div>
        `;
        
        this.attachEventListeners();
    }

    renderSearch() {
        return `
            <div class="mb-4">
                <input 
                    type="text" 
                    id="search-input"
                    placeholder="Pesquisar..." 
                    class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    value="${this.searchTerm}"
                >
            </div>
        `;
    }

    renderHeaders() {
        const headers = this.config.columns.map(col => 
            `<th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">${col.label}</th>`
        ).join('');
        
        const actionsHeader = this.config.actions.length > 0 
            ? '<th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Ações</th>' 
            : '';
            
        return `<tr>${headers}${actionsHeader}</tr>`;
    }

    renderBody() {
        this.applyFilter();
        
        if (this.filteredData.length === 0) {
            const colSpan = this.config.columns.length + (this.config.actions.length > 0 ? 1 : 0);
            return `
                <tr>
                    <td colspan="${colSpan}" class="px-6 py-8 text-center text-gray-500">
                        ${this.config.emptyMessage}
                    </td>
                </tr>
            `;
        }

        const startIndex = (this.currentPage - 1) * this.config.pageSize;
        const endIndex = startIndex + this.config.pageSize;
        const pageData = this.filteredData.slice(startIndex, endIndex);

        return pageData.map(item => this.renderRow(item)).join('');
    }

    renderRow(item) {
        const cells = this.config.columns.map(col => {
            const value = this.getCellValue(item, col);
            return `<td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">${value}</td>`;
        }).join('');

        const actions = this.config.actions.length > 0 
            ? `<td class="px-6 py-4 whitespace-nowrap text-sm font-medium">
                ${this.renderActions(item)}
               </td>` 
            : '';

        return `<tr class="hover:bg-gray-50">${cells}${actions}</tr>`;
    }

    renderActions(item) {
        return this.config.actions.map(action => 
            `<button 
                class="mr-2 px-3 py-1 text-xs font-medium rounded-md ${action.class || 'bg-blue-500 text-white hover:bg-blue-600'}"
                data-action="${action.label}"
                data-item='${JSON.stringify(item)}'
            >
                ${action.label}
            </button>`
        ).join('');
    }

    renderPagination() {
        const totalPages = Math.ceil(this.filteredData.length / this.config.pageSize);
        
        if (totalPages <= 1) return '';

        const startItem = (this.currentPage - 1) * this.config.pageSize + 1;
        const endItem = Math.min(this.currentPage * this.config.pageSize, this.filteredData.length);

        return `
            <div class="flex items-center justify-between px-4 py-3 bg-white border-t border-gray-200 sm:px-6">
                <div class="flex justify-between flex-1 sm:hidden">
                    <button 
                        id="prev-mobile"
                        class="relative inline-flex items-center px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 ${this.currentPage === 1 ? 'opacity-50 cursor-not-allowed' : ''}"
                        ${this.currentPage === 1 ? 'disabled' : ''}
                    >
                        Anterior
                    </button>
                    <button 
                        id="next-mobile"
                        class="relative inline-flex items-center px-4 py-2 ml-3 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 ${this.currentPage === totalPages ? 'opacity-50 cursor-not-allowed' : ''}"
                        ${this.currentPage === totalPages ? 'disabled' : ''}
                    >
                        Próxima
                    </button>
                </div>
                <div class="hidden sm:flex sm:flex-1 sm:items-center sm:justify-between">
                    <div>
                        <p class="text-sm text-gray-700">
                            Mostrando <span class="font-medium">${startItem}</span> até <span class="font-medium">${endItem}</span>
                            de <span class="font-medium">${this.filteredData.length}</span> resultados
                        </p>
                    </div>
                    <div>
                        <nav class="relative z-0 inline-flex rounded-md shadow-sm -space-x-px">
                            <button 
                                id="prev-desktop"
                                class="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 ${this.currentPage === 1 ? 'opacity-50 cursor-not-allowed' : ''}"
                                ${this.currentPage === 1 ? 'disabled' : ''}
                            >
                                ‹
                            </button>
                            ${this.renderPageNumbers(totalPages)}
                            <button 
                                id="next-desktop"
                                class="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 ${this.currentPage === totalPages ? 'opacity-50 cursor-not-allowed' : ''}"
                                ${this.currentPage === totalPages ? 'disabled' : ''}
                            >
                                ›
                            </button>
                        </nav>
                    </div>
                </div>
            </div>
        `;
    }

    renderPageNumbers(totalPages) {
        const pages = [];
        const maxVisiblePages = 5;
        
        let startPage = Math.max(1, this.currentPage - Math.floor(maxVisiblePages / 2));
        let endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);
        
        if (endPage - startPage < maxVisiblePages - 1) {
            startPage = Math.max(1, endPage - maxVisiblePages + 1);
        }

        for (let i = startPage; i <= endPage; i++) {
            const isActive = i === this.currentPage;
            pages.push(`
                <button 
                    class="page-btn relative inline-flex items-center px-4 py-2 border text-sm font-medium ${
                        isActive 
                            ? 'z-10 bg-blue-50 border-blue-500 text-blue-600' 
                            : 'bg-white border-gray-300 text-gray-500 hover:bg-gray-50'
                    }"
                    data-page="${i}"
                >
                    ${i}
                </button>
            `);
        }

        return pages.join('');
    }

    attachEventListeners() {
        // Search input
        const searchInput = this.container.querySelector('#search-input');
        if (searchInput) {
            searchInput.addEventListener('input', (e) => {
                this.searchTerm = e.target.value;
                this.currentPage = 1;
                this.updateTable();
            });
        }

        // Action buttons
        this.container.addEventListener('click', (e) => {
            if (e.target.hasAttribute('data-action')) {
                e.preventDefault();
                const actionName = e.target.getAttribute('data-action');
                const item = JSON.parse(e.target.getAttribute('data-item'));
                const action = this.config.actions.find(a => a.label === actionName);
                if (action && action.callback) {
                    action.callback(item);
                }
            }

            // Pagination
            if (e.target.id === 'prev-mobile' || e.target.id === 'prev-desktop') {
                this.previousPage();
            } else if (e.target.id === 'next-mobile' || e.target.id === 'next-desktop') {
                this.nextPage();
            } else if (e.target.classList.contains('page-btn')) {
                const page = parseInt(e.target.getAttribute('data-page'));
                this.goToPage(page);
            }
        });
    }

    getCellValue(item, column) {
        if (column.render && typeof column.render === 'function') {
            return column.render(item, item[column.key]);
        }
        
        const value = item[column.key];
        
        if (value === null || value === undefined) {
            return '-';
        }
        
        // Format dates
        if (column.type === 'date' && value) {
            try {
                return new Date(value).toLocaleDateString('pt-BR');
            } catch (e) {
                return value;
            }
        }
        
        // Format currency
        if (column.type === 'currency' && typeof value === 'number') {
            return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
        }

        return value.toString();
    }

    applyFilter() {
        if (!this.searchTerm) {
            this.filteredData = [...this.config.data];
            return;
        }

        const searchLower = this.searchTerm.toLowerCase();
        this.filteredData = this.config.data.filter(item => {
            return this.config.columns.some(col => {
                const value = this.getCellValue(item, col);
                return value.toString().toLowerCase().includes(searchLower);
            });
        });
    }

    updateTable() {
        const tableBody = this.container.querySelector('#table-body');
        if (tableBody) {
            tableBody.innerHTML = this.renderBody();
        }
        
        const pagination = this.container.querySelector('.flex.items-center.justify-between');
        if (pagination && this.config.showPagination) {
            pagination.outerHTML = this.renderPagination();
            this.attachEventListeners();
        }
    }

    // Public methods
    setData(data) {
        this.config.data = data;
        this.currentPage = 1;
        this.updateTable();
    }

    addRow(item) {
        this.config.data.push(item);
        this.updateTable();
    }

    updateRow(id, updatedItem) {
        const index = this.config.data.findIndex(item => item.id === id);
        if (index !== -1) {
            this.config.data[index] = { ...this.config.data[index], ...updatedItem };
            this.updateTable();
        }
    }

    removeRow(id) {
        this.config.data = this.config.data.filter(item => item.id !== id);
        // Adjust current page if necessary
        const totalPages = Math.ceil(this.config.data.length / this.config.pageSize);
        if (this.currentPage > totalPages && totalPages > 0) {
            this.currentPage = totalPages;
        }
        this.updateTable();
    }

    previousPage() {
        if (this.currentPage > 1) {
            this.currentPage--;
            this.updateTable();
        }
    }

    nextPage() {
        const totalPages = Math.ceil(this.filteredData.length / this.config.pageSize);
        if (this.currentPage < totalPages) {
            this.currentPage++;
            this.updateTable();
        }
    }

    goToPage(page) {
        const totalPages = Math.ceil(this.filteredData.length / this.config.pageSize);
        if (page >= 1 && page <= totalPages) {
            this.currentPage = page;
            this.updateTable();
        }
    }

    refresh() {
        this.updateTable();
    }
}