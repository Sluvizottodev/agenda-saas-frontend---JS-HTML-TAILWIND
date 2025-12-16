import { DataTable } from '../components/dataTable.js';
import { DynamicForm } from '../components/dynamicForm.js';
import { Modal, confirm, alert } from '../components/modal.js';
import { showToast } from '../utils/toast.js';
import authManager from '../utils/auth.js';
import router from '../utils/router.js';
import apiClient from '../api/api.js';
import { loadHeaderFooter } from '../components-loader.js';

class PrestadoresPage {
    constructor() {
        this.dataTable = null;
        this.prestadores = [];
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
        await this.loadPrestadores();
        
        // Carregar estatísticas
        await this.loadStats();
    }

    async loadPageComponents() {
        try {
            // Carregar header
            const headerResponse = await fetch('/components/header.html');
            const headerHtml = await headerResponse.text();
            document.getElementById('header-placeholder').innerHTML = headerHtml;
            
            // Carregar footer
            const footerResponse = await fetch('/components/footer.html');
            const footerHtml = await footerResponse.text();
            document.getElementById('footer-placeholder').innerHTML = footerHtml;
            
            // Inicializar header
            if (window.initHeader) {
                window.initHeader();
            }
        } catch (error) {
            console.error('Erro ao carregar componentes da página:', error);
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
                    key: 'cnpj',
                    label: 'CNPJ',
                    render: (item) => this.formatCNPJ(item.cnpj)
                },
                {
                    key: 'telefone',
                    label: 'Telefone',
                    render: (item) => this.formatTelefone(item.telefone)
                },
                {
                    key: 'especializacao',
                    label: 'Especialização'
                },
                {
                    key: 'dataCriacao',
                    label: 'Data de Cadastro',
                    type: 'date'
                }
            ],
            actions: [
                {
                    label: 'Serviços',
                    class: 'bg-green-500 text-white hover:bg-green-600',
                    callback: (item) => this.viewServicos(item)
                },
                {
                    label: 'Editar',
                    class: 'bg-blue-500 text-white hover:bg-blue-600',
                    callback: (item) => this.editPrestador(item)
                },
                {
                    label: 'Excluir',
                    class: 'bg-red-500 text-white hover:bg-red-600',
                    callback: (item) => this.deletePrestador(item)
                }
            ],
            pageSize: 10,
            emptyMessage: 'Nenhum prestador encontrado'
        };

        this.dataTable = new DataTable('#prestadores-table-container', config);
    }

    setupEventListeners() {
        // Botão novo prestador
        document.getElementById('add-prestador-btn').addEventListener('click', () => {
            this.showPrestadorForm();
        });

        // Filtros de busca
        const searchInputs = ['search-nome', 'search-email', 'search-cnpj', 'search-especializacao'];
        searchInputs.forEach(inputId => {
            const input = document.getElementById(inputId);
            input.addEventListener('input', () => this.applyFilters());
        });

        // Botão limpar filtros
        document.getElementById('clear-filters-btn').addEventListener('click', () => {
            this.clearFilters();
        });
    }

    async loadPrestadores() {
        try {
            this.prestadores = await apiClient.list('prestadores');
            this.dataTable.setData(this.prestadores);
            
            showToast('Prestadores carregados com sucesso', 'success');
        } catch (error) {
            console.error('Erro ao carregar prestadores:', error);
            showToast('Erro ao carregar prestadores: ' + error.message, 'error');
            this.prestadores = [];
            this.dataTable.setData([]);
        }
    }

    async loadStats() {
        try {
            const totalPrestadores = this.prestadores.length;
            
            // Estatísticas simples baseadas nos dados carregados
            const prestadoresAtivos = this.prestadores.filter(p => p.ativo !== false).length;
            
            // Especialiações únicas
            const especializacoes = new Set(
                this.prestadores
                    .filter(p => p.especializacao)
                    .map(p => p.especializacao.toLowerCase())
            );
            
            // Prestadores novos no último mês
            const umMesAtras = new Date();
            umMesAtras.setMonth(umMesAtras.getMonth() - 1);
            
            const novosNoMes = this.prestadores.filter(prestador => {
                if (prestador.dataCriacao) {
                    const dataCriacao = new Date(prestador.dataCriacao);
                    return dataCriacao >= umMesAtras;
                }
                return false;
            }).length;

            // Atualizar UI
            document.getElementById('total-prestadores').textContent = totalPrestadores;
            document.getElementById('prestadores-ativos').textContent = prestadoresAtivos;
            document.getElementById('total-especializacoes').textContent = especializacoes.size;
            document.getElementById('novos-mes').textContent = novosNoMes;
        } catch (error) {
            console.error('Erro ao calcular estatísticas:', error);
        }
    }

    showPrestadorForm(prestador = null) {
        const isEdit = !!prestador;
        const formConfig = {
            title: isEdit ? 'Editar Prestador' : 'Novo Prestador',
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
                    name: 'cnpj',
                    label: 'CNPJ',
                    type: 'text',
                    required: true,
                    placeholder: '00.000.000/0000-00',
                    maxlength: 18
                },
                {
                    name: 'telefone',
                    label: 'Telefone',
                    type: 'tel',
                    required: false,
                    placeholder: '(00) 00000-0000'
                },
                {
                    name: 'especializacao',
                    label: 'Especialização',
                    type: 'text',
                    required: false,
                    placeholder: 'Ex: Cabelereiro, Manicure, Massagista'
                }
            ],
            validationRules: {
                email: (value) => {
                    if (value && !this.isValidEmail(value)) {
                        return 'Email inválido';
                    }
                },
                cnpj: (value) => {
                    if (value && !this.isValidCNPJ(value.replace(/\D/g, ''))) {
                        return 'CNPJ inválido';
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
                    // Formatar campos antes de enviar
                    data.cnpj = data.cnpj.replace(/\D/g, '');
                    if (data.telefone) {
                        data.telefone = data.telefone.replace(/\D/g, '');
                    }
                    
                    if (isEdit) {
                        // Se senha estiver vazia, remover do objeto
                        if (!data.senha) {
                            delete data.senha;
                        }
                        await this.updatePrestador(prestador.id, data);
                    } else {
                        await this.createPrestador(data);
                    }
                } catch (error) {
                    showToast('Erro ao salvar prestador: ' + error.message, 'error');
                }
            }
        };

        const modal = new Modal({
            title: formConfig.title,
            content: '<div id="prestador-form-container"></div>',
            size: 'large',
            closeOnBackdropClick: false,
            onOpen: (modal) => {
                const formContainer = modal.element.querySelector('#prestador-form-container');
                const form = new DynamicForm(formContainer, formConfig);
                
                if (isEdit && prestador) {
                    // Formatar campos para exibição
                    const prestadorFormatted = {
                        ...prestador,
                        cnpj: this.formatCNPJ(prestador.cnpj),
                        telefone: this.formatTelefone(prestador.telefone)
                    };
                    form.setData(prestadorFormatted);
                }
            }
        });

        modal.open();
    }

    async createPrestador(data) {
        try {
            const novoPrestador = await apiClient.create('prestadores', data);
            this.prestadores.push(novoPrestador);
            this.dataTable.addRow(novoPrestador);
            await this.loadStats();
            
            showToast('Prestador criado com sucesso!', 'success');
        } catch (error) {
            throw error;
        }
    }

    async updatePrestador(id, data) {
        try {
            const prestadorAtualizado = await apiClient.update('prestadores', id, data);
            
            // Atualizar na lista local
            const index = this.prestadores.findIndex(p => p.id === id);
            if (index !== -1) {
                this.prestadores[index] = prestadorAtualizado;
                this.dataTable.updateRow(id, prestadorAtualizado);
            }
            
            await this.loadStats();
            showToast('Prestador atualizado com sucesso!', 'success');
        } catch (error) {
            throw error;
        }
    }

    async editPrestador(prestador) {
        this.showPrestadorForm(prestador);
    }

    async deletePrestador(prestador) {
        const confirmed = await confirm(
            `Tem certeza que deseja excluir o prestador "${prestador.nome}"? Esta ação não pode ser desfeita.`,
            {
                title: 'Confirmar Exclusão',
                confirmText: 'Excluir',
                cancelText: 'Cancelar',
                confirmClass: 'bg-red-600 text-white hover:bg-red-700'
            }
        );

        if (confirmed) {
            try {
                await apiClient.delete('prestadores', prestador.id);
                
                // Remover da lista local
                this.prestadores = this.prestadores.filter(p => p.id !== prestador.id);
                this.dataTable.removeRow(prestador.id);
                
                await this.loadStats();
                showToast('Prestador excluído com sucesso!', 'success');
            } catch (error) {
                showToast('Erro ao excluir prestador: ' + error.message, 'error');
            }
        }
    }

    async viewServicos(prestador) {
        // Navegar para página de serviços do prestador
        router.navigateToWithParams('servicos', { prestador: prestador.id });
    }

    applyFilters() {
        const nomeFilter = document.getElementById('search-nome').value.toLowerCase();
        const emailFilter = document.getElementById('search-email').value.toLowerCase();
        const cnpjFilter = document.getElementById('search-cnpj').value.replace(/\D/g, '');
        const especializacaoFilter = document.getElementById('search-especializacao').value.toLowerCase();

        const filteredPrestadores = this.prestadores.filter(prestador => {
            const nomeMatch = !nomeFilter || prestador.nome.toLowerCase().includes(nomeFilter);
            const emailMatch = !emailFilter || prestador.email.toLowerCase().includes(emailFilter);
            const cnpjMatch = !cnpjFilter || prestador.cnpj.includes(cnpjFilter);
            const especializacaoMatch = !especializacaoFilter || 
                (prestador.especializacao && prestador.especializacao.toLowerCase().includes(especializacaoFilter));

            return nomeMatch && emailMatch && cnpjMatch && especializacaoMatch;
        });

        this.dataTable.setData(filteredPrestadores);
    }

    clearFilters() {
        document.getElementById('search-nome').value = '';
        document.getElementById('search-email').value = '';
        document.getElementById('search-cnpj').value = '';
        document.getElementById('search-especializacao').value = '';
        this.dataTable.setData(this.prestadores);
    }

    // Utility methods
    formatCNPJ(cnpj) {
        if (!cnpj) return '';
        const cleanCNPJ = cnpj.replace(/\D/g, '');
        return cleanCNPJ.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, '$1.$2.$3/$4-$5');
    }

    formatTelefone(telefone) {
        if (!telefone) return '';
        const cleanTel = telefone.replace(/\D/g, '');
        if (cleanTel.length === 11) {
            return cleanTel.replace(/(\d{2})(\d{5})(\d{4})/, '($1) $2-$3');
        } else if (cleanTel.length === 10) {
            return cleanTel.replace(/(\d{2})(\d{4})(\d{4})/, '($1) $2-$3');
        }
        return telefone;
    }

    isValidEmail(email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    }

    isValidCNPJ(cnpj) {
        if (!cnpj || cnpj.length !== 14) return false;
        
        // Verificar se todos os dígitos são iguais
        if (/^(\d)\1{13}$/.test(cnpj)) return false;
        
        // Validação do algoritmo do CNPJ
        let tamanho = cnpj.length - 2;
        let numeros = cnpj.substring(0, tamanho);
        let digitos = cnpj.substring(tamanho);
        let soma = 0;
        let pos = tamanho - 7;
        
        for (let i = tamanho; i >= 1; i--) {
            soma += numeros.charAt(tamanho - i) * pos--;
            if (pos < 2) pos = 9;
        }
        
        let resultado = soma % 11 < 2 ? 0 : 11 - soma % 11;
        if (resultado != digitos.charAt(0)) return false;
        
        tamanho = tamanho + 1;
        numeros = cnpj.substring(0, tamanho);
        soma = 0;
        pos = tamanho - 7;
        
        for (let i = tamanho; i >= 1; i--) {
            soma += numeros.charAt(tamanho - i) * pos--;
            if (pos < 2) pos = 9;
        }
        
        resultado = soma % 11 < 2 ? 0 : 11 - soma % 11;
        if (resultado != digitos.charAt(1)) return false;
        
        return true;
    }
}

// Inicializar quando o DOM estiver carregado
document.addEventListener('DOMContentLoaded', () => {
    new PrestadoresPage();
});