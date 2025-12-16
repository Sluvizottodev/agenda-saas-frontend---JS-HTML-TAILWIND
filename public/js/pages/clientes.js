import { DataTable } from '../components/dataTable.js';
import { DynamicForm } from '../components/dynamicForm.js';
import { Modal, confirm, alert } from '../components/modal.js';
import { showToast } from '../utils/toast.js';
import authManager from '../utils/auth.js';
import router from '../utils/router.js';
import apiClient from '../api/api.js';
import { loadHeaderFooter } from '../components-loader.js';

class ClientesPage {
    constructor() {
        this.dataTable = null;
        this.clientes = [];
        this.init();
    }

    async init() {
        // Verificar autenticação
        if (!authManager.isAuthenticated()) {
            router.redirectToLogin();
            return;
        }

        // Carregar componentes da página
        await loadHeaderFooter();
        
        // Configurar tabela
        this.setupDataTable();
        
        // Configurar event listeners
        this.setupEventListeners();
        
        // Carregar dados
        await this.loadClientes();
        
        // Carregar estatísticas
        await this.loadStats();
    }

    async loadComponents() {
        try {
            await loadHeaderFooter();
        } catch (error) {
            console.error('Erro ao carregar componentes:', error);
        }
    }

    setupDataTable() {
        const config = {
            columns: [
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
                    key: 'email',
                    label: 'Email'
                },
                {
                    key: 'cpf',
                    label: 'CPF',
                    render: (item) => this.formatCPF(item.cpf)
                },
                {
                    key: 'dataCriacao',
                    label: 'Data de Cadastro',
                    type: 'date'
                }
            ],
            actions: [
                {
                    label: 'Editar',
                    class: 'bg-blue-500 text-white hover:bg-blue-600',
                    callback: (item) => this.editCliente(item)
                },
                {
                    label: 'Excluir',
                    class: 'bg-red-500 text-white hover:bg-red-600',
                    callback: (item) => this.deleteCliente(item)
                }
            ],
            pageSize: 10,
            emptyMessage: 'Nenhum cliente encontrado'
        };

        this.dataTable = new DataTable('#clientes-table-container', config);
    }

    setupEventListeners() {
        // Botão novo cliente
        document.getElementById('add-cliente-btn').addEventListener('click', () => {
            this.showClienteForm();
        });

        // Filtros de busca
        const searchInputs = ['search-nome', 'search-email', 'search-cpf'];
        searchInputs.forEach(inputId => {
            const input = document.getElementById(inputId);
            input.addEventListener('input', () => this.applyFilters());
        });

        // Botão limpar filtros
        document.getElementById('clear-filters-btn').addEventListener('click', () => {
            this.clearFilters();
        });
    }

    async loadClientes() {
        try {
            this.clientes = await apiClient.list('clientes');
            this.dataTable.setData(this.clientes);
            
            showToast('Clientes carregados com sucesso', 'success');
        } catch (error) {
            console.error('Erro ao carregar clientes:', error);
            showToast('Erro ao carregar clientes: ' + error.message, 'error');
            this.clientes = [];
            this.dataTable.setData([]);
        }
    }

    async loadStats() {
        try {
            const totalClientes = this.clientes.length;
            
            // Estatísticas simples baseadas nos dados carregados
            const clientesAtivos = this.clientes.filter(c => c.ativo !== false).length;
            
            // Clientes novos no último mês
            const umMesAtras = new Date();
            umMesAtras.setMonth(umMesAtras.getMonth() - 1);
            
            const novosNoMes = this.clientes.filter(cliente => {
                if (cliente.dataCriacao) {
                    const dataCriacao = new Date(cliente.dataCriacao);
                    return dataCriacao >= umMesAtras;
                }
                return false;
            }).length;

            // Atualizar UI
            document.getElementById('total-clientes').textContent = totalClientes;
            document.getElementById('clientes-ativos').textContent = clientesAtivos;
            document.getElementById('novos-mes').textContent = novosNoMes;
        } catch (error) {
            console.error('Erro ao calcular estatísticas:', error);
        }
    }

    showClienteForm(cliente = null) {
        const isEdit = !!cliente;
        const formConfig = {
            title: isEdit ? 'Editar Cliente' : 'Novo Cliente',
            fields: [
                {
                    name: 'nome',
                    label: 'Nome completo',
                    type: 'text',
                    required: true,
                    placeholder: 'Digite o nome completo'
                },
                {
                    name: 'email',
                    label: 'Email',
                    type: 'email',
                    required: true,
                    placeholder: 'Digite o email'
                },
                {
                    name: 'senha',
                    label: 'Senha',
                    type: 'password',
                    required: !isEdit,
                    placeholder: isEdit ? 'Deixe em branco para não alterar' : 'Digite a senha',
                    help: isEdit ? 'Deixe em branco para manter a senha atual' : undefined
                },
                {
                    name: 'cpf',
                    label: 'CPF',
                    type: 'text',
                    required: true,
                    placeholder: '000.000.000-00',
                    maxlength: 14
                }
            ],
            validationRules: {
                email: (value) => {
                    if (value && !this.isValidEmail(value)) {
                        return 'Email inválido';
                    }
                },
                cpf: (value) => {
                    if (value && !this.isValidCPF(value.replace(/\D/g, ''))) {
                        return 'CPF inválido';
                    }
                },
                senha: (value, data) => {
                    if (!isEdit && (!value || value.length < 6)) {
                        return 'Senha deve ter pelo menos 6 caracteres';
                    }
                }
            },
            onSubmit: async (data) => {
                try {
                    // Formatar CPF antes de enviar
                    data.cpf = data.cpf.replace(/\D/g, '');
                    
                    if (isEdit) {
                        // Se senha estiver vazia, remover do objeto
                        if (!data.senha) {
                            delete data.senha;
                        }
                        await this.updateCliente(cliente.id, data);
                    } else {
                        await this.createCliente(data);
                    }
                } catch (error) {
                    showToast('Erro ao salvar cliente: ' + error.message, 'error');
                }
            }
        };

        const modal = new Modal({
            title: formConfig.title,
            content: '<div id="cliente-form-container"></div>',
            size: 'large',
            closeOnBackdropClick: false,
            onOpen: (modal) => {
                const formContainer = modal.element.querySelector('#cliente-form-container');
                const form = new DynamicForm(formContainer, formConfig);
                
                if (isEdit && cliente) {
                    // Formatar CPF para exibição
                    const clienteFormatted = {
                        ...cliente,
                        cpf: this.formatCPF(cliente.cpf)
                    };
                    form.setData(clienteFormatted);
                }
            }
        });

        modal.open();
    }

    async createCliente(data) {
        try {
            const novoCliente = await apiClient.create('clientes', data);
            this.clientes.push(novoCliente);
            this.dataTable.addRow(novoCliente);
            await this.loadStats();
            
            showToast('Cliente criado com sucesso!', 'success');
        } catch (error) {
            throw error;
        }
    }

    async updateCliente(id, data) {
        try {
            const clienteAtualizado = await apiClient.update('clientes', id, data);
            
            // Atualizar na lista local
            const index = this.clientes.findIndex(c => c.id === id);
            if (index !== -1) {
                this.clientes[index] = clienteAtualizado;
                this.dataTable.updateRow(id, clienteAtualizado);
            }
            
            await this.loadStats();
            showToast('Cliente atualizado com sucesso!', 'success');
        } catch (error) {
            throw error;
        }
    }

    async editCliente(cliente) {
        this.showClienteForm(cliente);
    }

    async deleteCliente(cliente) {
        const confirmed = await confirm(
            `Tem certeza que deseja excluir o cliente "${cliente.nome}"? Esta ação não pode ser desfeita.`,
            {
                title: 'Confirmar Exclusão',
                confirmText: 'Excluir',
                cancelText: 'Cancelar',
                confirmClass: 'bg-red-600 text-white hover:bg-red-700'
            }
        );

        if (confirmed) {
            try {
                await apiClient.delete('clientes', cliente.id);
                
                // Remover da lista local
                this.clientes = this.clientes.filter(c => c.id !== cliente.id);
                this.dataTable.removeRow(cliente.id);
                
                await this.loadStats();
                showToast('Cliente excluído com sucesso!', 'success');
            } catch (error) {
                showToast('Erro ao excluir cliente: ' + error.message, 'error');
            }
        }
    }

    applyFilters() {
        const nomeFilter = document.getElementById('search-nome').value.toLowerCase();
        const emailFilter = document.getElementById('search-email').value.toLowerCase();
        const cpfFilter = document.getElementById('search-cpf').value.replace(/\D/g, '');

        const filteredClientes = this.clientes.filter(cliente => {
            const nomeMatch = !nomeFilter || cliente.nome.toLowerCase().includes(nomeFilter);
            const emailMatch = !emailFilter || cliente.email.toLowerCase().includes(emailFilter);
            const cpfMatch = !cpfFilter || cliente.cpf.includes(cpfFilter);

            return nomeMatch && emailMatch && cpfMatch;
        });

        this.dataTable.setData(filteredClientes);
    }

    clearFilters() {
        document.getElementById('search-nome').value = '';
        document.getElementById('search-email').value = '';
        document.getElementById('search-cpf').value = '';
        this.dataTable.setData(this.clientes);
    }

    // Utility methods
    formatCPF(cpf) {
        if (!cpf) return '';
        const cleanCPF = cpf.replace(/\D/g, '');
        return cleanCPF.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
    }

    isValidEmail(email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    }

    isValidCPF(cpf) {
        if (!cpf || cpf.length !== 11) return false;
        
        // Verificar se todos os dígitos são iguais
        if (/^(\d)\1{10}$/.test(cpf)) return false;
        
        // Validação do algoritmo do CPF
        let soma = 0;
        let resto;

        for (let i = 1; i <= 9; i++) {
            soma = soma + parseInt(cpf.substring(i - 1, i)) * (11 - i);
        }

        resto = (soma * 10) % 11;
        if (resto === 10 || resto === 11) resto = 0;
        if (resto !== parseInt(cpf.substring(9, 10))) return false;

        soma = 0;
        for (let i = 1; i <= 10; i++) {
            soma = soma + parseInt(cpf.substring(i - 1, i)) * (12 - i);
        }

        resto = (soma * 10) % 11;
        if (resto === 10 || resto === 11) resto = 0;
        if (resto !== parseInt(cpf.substring(10, 11))) return false;

        return true;
    }
}

// Inicializar quando o DOM estiver carregado
document.addEventListener('DOMContentLoaded', () => {
    new ClientesPage();
});