import { DataTable } from '../components/dataTable.js';
import { DynamicForm } from '../components/dynamicForm.js';
import { Modal, confirm, alert } from '../components/modal.js';
import { showToast } from '../utils/toast.js';
import authManager from '../utils/auth.js';
import router from '../utils/router.js';
import apiClient from '../api/api.js';

class ServicosPage {
    constructor() {
        this.dataTable = null;
        this.servicos = [];
        this.prestadorId = null;
        this.prestadorInfo = null;
        this.prestadores = [];
        this.init();
    }

    async init() {
        // Verificar autenticação
        if (!authManager.isAuthenticated()) {
            router.redirectToLogin();
            return;
        }

        // Verificar se está filtrando por prestador
        this.checkPrestadorFilter();

        // Carregar componentes da página
        await this.loadPageComponents();
        
        // Carregar prestadores (para o formulário)
        await this.loadPrestadores();
        
        // Configurar tabela
        this.setupDataTable();
        
        // Configurar event listeners
        this.setupEventListeners();
        
        // Carregar dados
        await this.loadServicos();
        
        // Carregar estatísticas
        await this.loadStats();
        
        // Carregar informações do prestador se aplicável
        if (this.prestadorId) {
            await this.loadPrestadorInfo();
        }
    }

    checkPrestadorFilter() {
        const urlParams = router.getURLParams();
        this.prestadorId = urlParams.get('prestador');
        
        if (this.prestadorId) {
            document.getElementById('page-description').textContent = 
                'Gerencie os serviços do prestador selecionado';
            document.getElementById('prestador-info').classList.remove('hidden');
        }
    }

    async loadPageComponents() {
        try {
            await loadHeaderFooter();
        } catch (error) {
            console.error('Erro ao carregar componentes:', error);
        }
    }

    async loadPrestadores() {
        try {
            this.prestadores = await apiClient.list('prestadores');
        } catch (error) {
            console.error('Erro ao carregar prestadores:', error);
            this.prestadores = [];
        }
    }

    async loadPrestadorInfo() {
        if (!this.prestadorId) return;
        
        try {
            this.prestadorInfo = await apiClient.get('prestadores', this.prestadorId);
            
            document.getElementById('prestador-nome').textContent = this.prestadorInfo.nome;
            document.getElementById('prestador-especializacao').textContent = 
                this.prestadorInfo.especializacao || 'Especialização não informada';
            document.getElementById('prestador-email').textContent = this.prestadorInfo.email;
        } catch (error) {
            console.error('Erro ao carregar informações do prestador:', error);
            showToast('Erro ao carregar informações do prestador', 'error');
        }
    }

    setupDataTable() {
        const columns = [
            {
                key: 'id',
                label: 'ID',
                render: (item) => `#${item.id}`
            },
            {
                key: 'nome',
                label: 'Nome'
            },
            {
                key: 'descricao',
                label: 'Descrição',
                render: (item) => {
                    const desc = item.descricao || '';
                    return desc.length > 50 ? desc.substring(0, 50) + '...' : desc;
                }
            },
            {
                key: 'preco',
                label: 'Preço',
                type: 'currency'
            }
        ];

        // Adicionar coluna do prestador apenas se não estivermos filtrando por um prestador específico
        if (!this.prestadorId) {
            columns.splice(4, 0, {
                key: 'prestadorId',
                label: 'Prestador',
                render: (item) => {
                    const prestador = this.prestadores.find(p => p.id === item.prestadorId);
                    return prestador ? prestador.nome : 'Prestador não encontrado';
                }
            });
        }

        const config = {
            columns,
            actions: [
                {
                    label: 'Editar',
                    class: 'bg-blue-500 text-white hover:bg-blue-600',
                    callback: (item) => this.editServico(item)
                },
                {
                    label: 'Excluir',
                    class: 'bg-red-500 text-white hover:bg-red-600',
                    callback: (item) => this.deleteServico(item)
                }
            ],
            pageSize: 10,
            emptyMessage: 'Nenhum serviço encontrado'
        };

        this.dataTable = new DataTable('#servicos-table-container', config);
    }

    setupEventListeners() {
        // Botão novo serviço
        document.getElementById('add-servico-btn').addEventListener('click', () => {
            this.showServicoForm();
        });

        // Botão voltar
        document.getElementById('back-btn').addEventListener('click', () => {
            if (this.prestadorId) {
                router.navigateTo('prestadores');
            } else {
                window.history.back();
            }
        });

        // Filtros de busca
        const searchInputs = ['search-nome', 'search-descricao', 'filter-preco-min', 'filter-preco-max'];
        searchInputs.forEach(inputId => {
            const input = document.getElementById(inputId);
            input.addEventListener('input', () => this.applyFilters());
        });

        // Botão limpar filtros
        document.getElementById('clear-filters-btn').addEventListener('click', () => {
            this.clearFilters();
        });
    }

    async loadServicos() {
        try {
            let query = '';
            if (this.prestadorId) {
                query = `prestadorId=${this.prestadorId}`;
            }
            
            this.servicos = await apiClient.list('servicos', query);
            this.dataTable.setData(this.servicos);
            
            showToast('Serviços carregados com sucesso', 'success');
        } catch (error) {
            console.error('Erro ao carregar serviços:', error);
            showToast('Erro ao carregar serviços: ' + error.message, 'error');
            this.servicos = [];
            this.dataTable.setData([]);
        }
    }

    async loadStats() {
        try {
            const totalServicos = this.servicos.length;
            
            if (totalServicos === 0) {
                document.getElementById('total-servicos').textContent = '0';
                document.getElementById('preco-medio').textContent = 'R$ 0,00';
                document.getElementById('maior-preco').textContent = 'R$ 0,00';
                document.getElementById('menor-preco').textContent = 'R$ 0,00';
                return;
            }

            const precos = this.servicos.map(s => s.preco || 0);
            const precoMedio = precos.reduce((sum, preco) => sum + preco, 0) / totalServicos;
            const maiorPreco = Math.max(...precos);
            const menorPreco = Math.min(...precos);

            // Atualizar UI
            document.getElementById('total-servicos').textContent = totalServicos;
            document.getElementById('preco-medio').textContent = this.formatCurrency(precoMedio);
            document.getElementById('maior-preco').textContent = this.formatCurrency(maiorPreco);
            document.getElementById('menor-preco').textContent = this.formatCurrency(menorPreco);
        } catch (error) {
            console.error('Erro ao calcular estatísticas:', error);
        }
    }

    showServicoForm(servico = null) {
        const isEdit = !!servico;
        
        const prestadorOptions = this.prestadores.map(prestador => ({
            value: prestador.id,
            label: prestador.nome
        }));

        const formConfig = {
            title: isEdit ? 'Editar Serviço' : 'Novo Serviço',
            fields: [
                {
                    name: 'nome',
                    label: 'Nome do serviço',
                    type: 'text',
                    required: true,
                    placeholder: 'Ex: Corte de cabelo, Manicure'
                },
                {
                    name: 'descricao',
                    label: 'Descrição',
                    type: 'textarea',
                    required: true,
                    placeholder: 'Descreva detalhadamente o serviço...',
                    rows: 4
                },
                {
                    name: 'preco',
                    label: 'Preço (R$)',
                    type: 'number',
                    required: true,
                    placeholder: '0,00',
                    min: 0,
                    max: 10000
                },
                ...(this.prestadorId ? [] : [{
                    name: 'prestadorId',
                    label: 'Prestador',
                    type: 'select',
                    required: true,
                    options: prestadorOptions
                }])
            ],
            validationRules: {
                preco: (value) => {
                    if (value !== null && value !== undefined && value < 0) {
                        return 'Preço não pode ser negativo';
                    }
                    if (value > 10000) {
                        return 'Preço não pode ser maior que R$ 10.000,00';
                    }
                }
            },
            onSubmit: async (data) => {
                try {
                    // Se estamos filtrando por prestador, definir o prestadorId
                    if (this.prestadorId) {
                        data.prestadorId = parseInt(this.prestadorId);
                    } else if (data.prestadorId) {
                        data.prestadorId = parseInt(data.prestadorId);
                    }
                    
                    if (isEdit) {
                        await this.updateServico(servico.id, data);
                    } else {
                        await this.createServico(data);
                    }
                } catch (error) {
                    showToast('Erro ao salvar serviço: ' + error.message, 'error');
                }
            }
        };

        const modal = new Modal({
            title: formConfig.title,
            content: '<div id="servico-form-container"></div>',
            size: 'large',
            closeOnBackdropClick: false,
            onOpen: (modal) => {
                const formContainer = modal.element.querySelector('#servico-form-container');
                const form = new DynamicForm(formContainer, formConfig);
                
                if (isEdit && servico) {
                    form.setData(servico);
                }
            }
        });

        modal.open();
    }

    async createServico(data) {
        try {
            const novoServico = await apiClient.create('servicos', data);
            this.servicos.push(novoServico);
            this.dataTable.addRow(novoServico);
            await this.loadStats();
            
            showToast('Serviço criado com sucesso!', 'success');
        } catch (error) {
            throw error;
        }
    }

    async updateServico(id, data) {
        try {
            const servicoAtualizado = await apiClient.update('servicos', id, data);
            
            // Atualizar na lista local
            const index = this.servicos.findIndex(s => s.id === id);
            if (index !== -1) {
                this.servicos[index] = servicoAtualizado;
                this.dataTable.updateRow(id, servicoAtualizado);
            }
            
            await this.loadStats();
            showToast('Serviço atualizado com sucesso!', 'success');
        } catch (error) {
            throw error;
        }
    }

    async editServico(servico) {
        this.showServicoForm(servico);
    }

    async deleteServico(servico) {
        const confirmed = await confirm(
            `Tem certeza que deseja excluir o serviço "${servico.nome}"? Esta ação não pode ser desfeita.`,
            {
                title: 'Confirmar Exclusão',
                confirmText: 'Excluir',
                cancelText: 'Cancelar',
                confirmClass: 'bg-red-600 text-white hover:bg-red-700'
            }
        );

        if (confirmed) {
            try {
                await apiClient.delete('servicos', servico.id);
                
                // Remover da lista local
                this.servicos = this.servicos.filter(s => s.id !== servico.id);
                this.dataTable.removeRow(servico.id);
                
                await this.loadStats();
                showToast('Serviço excluído com sucesso!', 'success');
            } catch (error) {
                showToast('Erro ao excluir serviço: ' + error.message, 'error');
            }
        }
    }

    applyFilters() {
        const nomeFilter = document.getElementById('search-nome').value.toLowerCase();
        const descricaoFilter = document.getElementById('search-descricao').value.toLowerCase();
        const precoMinFilter = parseFloat(document.getElementById('filter-preco-min').value) || 0;
        const precoMaxFilter = parseFloat(document.getElementById('filter-preco-max').value) || Infinity;

        const filteredServicos = this.servicos.filter(servico => {
            const nomeMatch = !nomeFilter || servico.nome.toLowerCase().includes(nomeFilter);
            const descricaoMatch = !descricaoFilter || 
                (servico.descricao && servico.descricao.toLowerCase().includes(descricaoFilter));
            const precoMatch = (servico.preco || 0) >= precoMinFilter && (servico.preco || 0) <= precoMaxFilter;

            return nomeMatch && descricaoMatch && precoMatch;
        });

        this.dataTable.setData(filteredServicos);
    }

    clearFilters() {
        document.getElementById('search-nome').value = '';
        document.getElementById('search-descricao').value = '';
        document.getElementById('filter-preco-min').value = '';
        document.getElementById('filter-preco-max').value = '';
        this.dataTable.setData(this.servicos);
    }

    // Utility methods
    formatCurrency(value) {
        if (value === null || value === undefined) return 'R$ 0,00';
        return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
    }
}

// Inicializar quando o DOM estiver carregado
document.addEventListener('DOMContentLoaded', () => {
    new ServicosPage();
});