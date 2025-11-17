import { ApiClient } from '../api/api.js';
import authManager from '../utils/auth.js';
import router from '../utils/router.js';
import { DataTable } from '../components/dataTable.js';
import { DynamicForm } from '../components/dynamicForm.js';
import { Modal } from '../components/modal.js';
import { showToast } from '../components/toast.js';
import { loadHeaderFooter } from '../components-loader.js';

class AgendamentosPage {
    constructor() {
        this.dataTable = null;
        this.authManager = authManager;
        this.apiClient = new ApiClient();
        this.init();
    }

    async init() {
        try {
            // Verificar autenticação
            if (!this.authManager.isAuthenticated()) {
                router.redirectToLogin();
                return;
            }

            await this.loadComponents();
            this.setupEventListeners();
            await this.loadData();
        } catch (error) {
            console.error('Erro ao inicializar página de agendamentos:', error);
            showToast('Erro ao carregar página', 'error');
        }
    }

    async loadComponents() {
        try {
            await loadHeaderFooter();
        } catch (error) {
            console.error('Erro ao carregar componentes:', error);
        }
    }

    setupEventListeners() {
        // Botão de novo agendamento
        document.getElementById('add-agendamento-btn').addEventListener('click', () => {
            this.openFormModal();
        });

        // Filtros
        document.getElementById('filter-status').addEventListener('change', () => {
            this.applyFilters();
        });
        
        document.getElementById('filter-cliente').addEventListener('input', () => {
            this.applyFilters();
        });
        
        document.getElementById('filter-prestador').addEventListener('input', () => {
            this.applyFilters();
        });
        
        document.getElementById('filter-servico').addEventListener('input', () => {
            this.applyFilters();
        });
        
        document.getElementById('filter-data').addEventListener('change', () => {
            this.applyFilters();
        });

        // Botão limpar filtros
        document.getElementById('clear-filters-btn').addEventListener('click', () => {
            this.clearFilters();
        });
    }

    async loadData() {
        try {
            const user = authManager.getCurrentUser();
            if (!user || !user.id) {
                throw new Error('Usuário não encontrado');
            }
            
            // Construir query string com os parâmetros necessários
            const queryParams = new URLSearchParams({
                usuarioId: user.id,
                tipoUsuario: user.tipo || 'CLIENTE'
            });
            
            const agendamentos = await this.apiClient.list('agendamentos', queryParams.toString());
            await this.updateStatistics(agendamentos);
            this.renderTable(agendamentos);
        } catch (error) {
            console.error('Erro ao carregar agendamentos:', error);
            showToast('Erro ao carregar agendamentos', 'error');
        }
    }

    async updateStatistics(agendamentos) {
        const stats = {
            total: agendamentos.length,
            pendentes: agendamentos.filter(a => a.status === 'PENDENTE').length,
            confirmados: agendamentos.filter(a => a.status === 'CONFIRMADO').length,
            concluidos: agendamentos.filter(a => a.status === 'CONCLUIDO').length,
            cancelados: agendamentos.filter(a => a.status === 'CANCELADO').length
        };

        document.getElementById('total-agendamentos').textContent = stats.total;
        document.getElementById('agendamentos-pendentes').textContent = stats.pendentes;
        document.getElementById('agendamentos-confirmados').textContent = stats.confirmados;
        document.getElementById('agendamentos-concluidos').textContent = stats.concluidos;
        document.getElementById('agendamentos-cancelados').textContent = stats.cancelados;
    }

    renderTable(agendamentos) {
        const columns = [
            { 
                key: 'id', 
                label: 'ID', 
                sortable: true 
            },
            { 
                key: 'cliente', 
                label: 'Cliente', 
                sortable: true,
                render: (item) => {
                    return item.cliente ? item.cliente.nome : 'N/A';
                }
            },
            { 
                key: 'prestador', 
                label: 'Prestador', 
                sortable: true,
                render: (item) => {
                    return item.prestador ? item.prestador.nome : 'N/A';
                }
            },
            { 
                key: 'servico', 
                label: 'Serviço', 
                sortable: true,
                render: (item) => {
                    const servico = item.servico;
                    if (!servico) return 'N/A';
                    
                    const preco = servico.preco ? `R$ ${parseFloat(servico.preco).toFixed(2)}` : '';
                    return `
                        <div>
                            <div class="font-medium">${servico.nome}</div>
                            ${preco ? `<div class="text-sm text-gray-500">${preco}</div>` : ''}
                        </div>
                    `;
                }
            },
            { 
                key: 'dataHora', 
                label: 'Data/Hora', 
                sortable: true,
                render: (item) => {
                    if (!item.dataHora) return 'N/A';
                    const date = new Date(item.dataHora);
                    return `
                        <div>
                            <div class="font-medium">${date.toLocaleDateString('pt-BR')}</div>
                            <div class="text-sm text-gray-500">${date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}</div>
                        </div>
                    `;
                }
            },
            { 
                key: 'status', 
                label: 'Status', 
                sortable: true,
                render: (item) => {
                    const statusColors = {
                        'PENDENTE': 'bg-yellow-100 text-yellow-800',
                        'CONFIRMADO': 'bg-green-100 text-green-800',
                        'CONCLUIDO': 'bg-blue-100 text-blue-800',
                        'CANCELADO': 'bg-red-100 text-red-800'
                    };
                    
                    const colorClass = statusColors[item.status] || 'bg-gray-100 text-gray-800';
                    return `<span class="px-2 py-1 rounded-full text-xs font-medium ${colorClass}">${item.status}</span>`;
                }
            }
        ];

        const actions = [
            {
                label: 'Editar',
                icon: 'edit',
                className: 'text-blue-600 hover:text-blue-800',
                onClick: (item) => this.editAgendamento(item)
            }
        ];

        // Adicionar ação de alterar status se não for concluído ou cancelado
        const statusActions = [
            {
                label: 'Confirmar',
                icon: 'check',
                className: 'text-green-600 hover:text-green-800',
                onClick: (item) => this.updateStatus(item, 'CONFIRMADO'),
                condition: (item) => ['PENDENTE'].includes(item.status)
            },
            {
                label: 'Concluir',
                icon: 'check-circle',
                className: 'text-blue-600 hover:text-blue-800',
                onClick: (item) => this.updateStatus(item, 'CONCLUIDO'),
                condition: (item) => ['CONFIRMADO'].includes(item.status)
            },
            {
                label: 'Cancelar',
                icon: 'x-circle',
                className: 'text-red-600 hover:text-red-800',
                onClick: (item) => this.updateStatus(item, 'CANCELADO'),
                condition: (item) => ['PENDENTE', 'CONFIRMADO'].includes(item.status)
            }
        ];

        actions.push(...statusActions);

        // Adicionar ação de excluir
        actions.push({
            label: 'Excluir',
            icon: 'trash',
            className: 'text-red-600 hover:text-red-800 ml-2',
            onClick: (item) => this.deleteAgendamento(item)
        });

        this.dataTable = new DataTable({
            container: document.getElementById('agendamentos-table-container'),
            data: agendamentos,
            columns: columns,
            actions: actions,
            pagination: {
                enabled: true,
                pageSize: 10
            },
            search: {
                enabled: true,
                placeholder: 'Pesquisar agendamentos...'
            }
        });

        this.dataTable.render();
    }

    applyFilters() {
        if (!this.dataTable) return;

        const status = document.getElementById('filter-status').value;
        const cliente = document.getElementById('filter-cliente').value.toLowerCase();
        const prestador = document.getElementById('filter-prestador').value.toLowerCase();
        const servico = document.getElementById('filter-servico').value.toLowerCase();
        const data = document.getElementById('filter-data').value;

        this.dataTable.filter((item) => {
            // Filtro por status
            if (status && item.status !== status) return false;

            // Filtro por cliente
            if (cliente && (!item.cliente || !item.cliente.nome.toLowerCase().includes(cliente))) {
                return false;
            }

            // Filtro por prestador
            if (prestador && (!item.prestador || !item.prestador.nome.toLowerCase().includes(prestador))) {
                return false;
            }

            // Filtro por serviço
            if (servico && (!item.servico || !item.servico.nome.toLowerCase().includes(servico))) {
                return false;
            }

            // Filtro por data
            if (data && item.dataHora) {
                const itemDate = new Date(item.dataHora).toISOString().split('T')[0];
                if (itemDate !== data) return false;
            }

            return true;
        });
    }

    clearFilters() {
        document.getElementById('filter-status').value = '';
        document.getElementById('filter-cliente').value = '';
        document.getElementById('filter-prestador').value = '';
        document.getElementById('filter-servico').value = '';
        document.getElementById('filter-data').value = '';
        
        if (this.dataTable) {
            this.dataTable.clearFilter();
        }
    }

    async openFormModal(agendamento = null) {
        const isEdit = !!agendamento;
        const title = isEdit ? 'Editar Agendamento' : 'Novo Agendamento';

        try {
            // Carregar dados necessários para o formulário
            const [clientes, prestadores, servicos] = await Promise.all([
                this.apiClient.list('clientes'),
                this.apiClient.list('prestadores'),
                this.apiClient.list('servicos')
            ]);

            const fields = [
                {
                    name: 'clienteId',
                    label: 'Cliente',
                    type: 'select',
                    required: true,
                    options: [
                        { value: '', label: 'Selecione um cliente' },
                        ...clientes.map(c => ({ value: c.id, label: c.nome }))
                    ],
                    value: agendamento?.clienteId || ''
                },
                {
                    name: 'prestadorId',
                    label: 'Prestador',
                    type: 'select',
                    required: true,
                    options: [
                        { value: '', label: 'Selecione um prestador' },
                        ...prestadores.map(p => ({ value: p.id, label: p.nome }))
                    ],
                    value: agendamento?.prestadorId || ''
                },
                {
                    name: 'servicoId',
                    label: 'Serviço',
                    type: 'select',
                    required: true,
                    options: [
                        { value: '', label: 'Selecione um serviço' },
                        ...servicos.map(s => ({ value: s.id, label: `${s.nome} - R$ ${parseFloat(s.preco || 0).toFixed(2)}` }))
                    ],
                    value: agendamento?.servicoId || ''
                },
                {
                    name: 'dataHora',
                    label: 'Data e Hora',
                    type: 'datetime-local',
                    required: true,
                    value: agendamento?.dataHora ? this.formatDateTimeForInput(agendamento.dataHora) : ''
                },
                {
                    name: 'observacoes',
                    label: 'Observações',
                    type: 'textarea',
                    rows: 3,
                    value: agendamento?.observacoes || ''
                }
            ];

            // Adicionar campo de status apenas na edição
            if (isEdit) {
                fields.push({
                    name: 'status',
                    label: 'Status',
                    type: 'select',
                    required: true,
                    options: [
                        { value: 'PENDENTE', label: 'Pendente' },
                        { value: 'CONFIRMADO', label: 'Confirmado' },
                        { value: 'CONCLUIDO', label: 'Concluído' },
                        { value: 'CANCELADO', label: 'Cancelado' }
                    ],
                    value: agendamento?.status || 'PENDENTE'
                });
            }

            const form = new DynamicForm({
                fields: fields,
                onSubmit: async (formData) => {
                    await this.saveAgendamento(formData, isEdit ? agendamento.id : null);
                    modal.close();
                }
            });

            const modal = new Modal({
                title: title,
                content: form.render(),
                size: 'lg',
                onOpen: () => {
                    form.bindEvents();
                    this.setupPrestadorServiceFilter(form);
                }
            });

            modal.open();

        } catch (error) {
            console.error('Erro ao carregar dados para formulário:', error);
            showToast('Erro ao carregar dados do formulário', 'error');
        }
    }

    setupPrestadorServiceFilter(form) {
        // Quando o prestador for alterado, filtrar os serviços
        const prestadorSelect = form.container.querySelector('[name="prestadorId"]');
        const servicoSelect = form.container.querySelector('[name="servicoId"]');
        
        if (prestadorSelect && servicoSelect) {
            prestadorSelect.addEventListener('change', async () => {
                const prestadorId = prestadorSelect.value;
                
                if (!prestadorId) {
                    // Se não há prestador selecionado, mostrar todos os serviços
                    const servicos = await this.apiClient.list('servicos');
                    this.updateServiceOptions(servicoSelect, servicos);
                    return;
                }

                try {
                    // Carregar serviços do prestador
                    const servicos = await this.apiClient.list(`prestadores/${prestadorId}/servicos`);
                    this.updateServiceOptions(servicoSelect, servicos);
                } catch (error) {
                    console.error('Erro ao carregar serviços do prestador:', error);
                    // Em caso de erro, mostrar todos os serviços
                    const allServicos = await this.apiClient.list('servicos');
                    this.updateServiceOptions(servicoSelect, allServicos);
                }
            });
        }
    }

    updateServiceOptions(servicoSelect, servicos) {
        servicoSelect.innerHTML = '<option value="">Selecione um serviço</option>';
        
        servicos.forEach(servico => {
            const option = document.createElement('option');
            option.value = servico.id;
            option.textContent = `${servico.nome} - R$ ${parseFloat(servico.preco || 0).toFixed(2)}`;
            servicoSelect.appendChild(option);
        });
    }

    formatDateTimeForInput(dateTimeString) {
        if (!dateTimeString) return '';
        
        const date = new Date(dateTimeString);
        return date.toISOString().slice(0, 16);
    }

    async saveAgendamento(formData, id = null) {
        try {
            const agendamentoData = {
                clienteId: parseInt(formData.clienteId),
                prestadorId: parseInt(formData.prestadorId),
                servicoId: parseInt(formData.servicoId),
                dataHora: formData.dataHora,
                observacoes: formData.observacoes || null,
                status: formData.status || 'PENDENTE'
            };

            if (id) {
                await this.apiClient.update('agendamentos', id, agendamentoData);
                showToast('Agendamento atualizado com sucesso!', 'success');
            } else {
                await this.apiClient.create('agendamentos', agendamentoData);
                showToast('Agendamento criado com sucesso!', 'success');
            }

            await this.loadData();
        } catch (error) {
            console.error('Erro ao salvar agendamento:', error);
            showToast('Erro ao salvar agendamento', 'error');
        }
    }

    async editAgendamento(agendamento) {
        await this.openFormModal(agendamento);
    }

    async updateStatus(agendamento, novoStatus) {
        const statusLabels = {
            'CONFIRMADO': 'confirmar',
            'CONCLUIDO': 'concluir',
            'CANCELADO': 'cancelar'
        };

        const actionLabel = statusLabels[novoStatus];
        
        const modal = new Modal({
            title: 'Confirmar Ação',
            content: `<p>Tem certeza que deseja ${actionLabel} este agendamento?</p>`,
            actions: [
                {
                    label: 'Cancelar',
                    className: 'bg-gray-300 hover:bg-gray-400 text-gray-700',
                    onClick: (modal) => modal.close()
                },
                {
                    label: 'Confirmar',
                    className: 'bg-blue-600 hover:bg-blue-700 text-white',
                    onClick: async (modal) => {
                        try {
                            await this.apiClient.update('agendamentos', agendamento.id, {
                                ...agendamento,
                                status: novoStatus
                            });
                            
                            showToast(`Agendamento ${statusLabels[novoStatus]}do com sucesso!`, 'success');
                            await this.loadData();
                            modal.close();
                        } catch (error) {
                            console.error('Erro ao atualizar status:', error);
                            showToast('Erro ao atualizar status do agendamento', 'error');
                        }
                    }
                }
            ]
        });

        modal.open();
    }

    async deleteAgendamento(agendamento) {
        const modal = new Modal({
            title: 'Confirmar Exclusão',
            content: `<p>Tem certeza que deseja excluir este agendamento?</p><p class="text-sm text-gray-600 mt-2">Esta ação não pode ser desfeita.</p>`,
            actions: [
                {
                    label: 'Cancelar',
                    className: 'bg-gray-300 hover:bg-gray-400 text-gray-700',
                    onClick: (modal) => modal.close()
                },
                {
                    label: 'Excluir',
                    className: 'bg-red-600 hover:bg-red-700 text-white',
                    onClick: async (modal) => {
                        try {
                            await this.apiClient.delete('agendamentos', agendamento.id);
                            showToast('Agendamento excluído com sucesso!', 'success');
                            await this.loadData();
                            modal.close();
                        } catch (error) {
                            console.error('Erro ao excluir agendamento:', error);
                            showToast('Erro ao excluir agendamento', 'error');
                        }
                    }
                }
            ]
        });

        modal.open();
    }
}

// Inicializar página quando carregada
document.addEventListener('DOMContentLoaded', () => {
    new AgendamentosPage();
});