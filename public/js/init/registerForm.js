import api from '../api/api.js';
import { required, isEmail, isPasswordStrong } from '../utils/validators/index.js';
import { toast } from '../components/toast.js';

function $(sel, root = document) { return root.querySelector(sel); }

function showFieldError(el, msg){
  if(!el) return;
  const box = document.getElementById('err-' + el.name) || null;
  if(box) box.textContent = msg || '';
  if(msg){ el.setAttribute('aria-invalid','true'); }
  else { el.removeAttribute('aria-invalid'); }
}

export function initRegisterForm(){
  const form = document.getElementById('formRegister'); if(!form) return;
  const nameEl = $('#reg-name', form);
  const emailEl = $('#reg-email', form);
  const passEl = $('#reg-password', form);
  const confirmEl = $('#reg-confirm', form);
  const toggleBtn = $('#toggle-pass', form);
  const submitBtn = $('#reg-submit', form);
  const submitText = $('#reg-submit-text', form);
  const strengthBar = $('#pass-strength-bar', form);

  function validateName(){
    const v = required(nameEl.value.trim());
    showFieldError(nameEl, v.valid ? '' : v.message);
    return v.valid;
  }

  function validateEmail(){
    const r = required(emailEl.value.trim());
    if(!r.valid){ showFieldError(emailEl, r.message); return false; }
    const e = isEmail(emailEl.value.trim());
    showFieldError(emailEl, e.valid ? '' : e.message);
    return e.valid;
  }

  function updateStrength(){
    const v = passEl.value || '';
    const score = Math.min(100, Math.floor((v.length / 12) * 100));
    strengthBar.style.width = score + '%';
    if(score < 40) strengthBar.className = 'h-full bg-red-400 w-0 transition-width';
    else if(score < 80) strengthBar.className = 'h-full bg-yellow-400 w-0 transition-width';
    else strengthBar.className = 'h-full bg-green-400 w-0 transition-width';
  }

  function validatePassword(){
    const v = isPasswordStrong(passEl.value, { minLength: 6 });
    showFieldError(passEl, v.valid ? '' : v.message);
    updateStrength();
    return v.valid;
  }

  function validateConfirm(){
    const ok = passEl.value === confirmEl.value;
    showFieldError(confirmEl, ok ? '' : 'As senhas não coincidem');
    return ok;
  }

  // events
  if(nameEl) nameEl.addEventListener('input', validateName);
  if(emailEl) emailEl.addEventListener('input', validateEmail);
  if(passEl){ passEl.addEventListener('input', ()=>{ validatePassword(); validateConfirm(); }); }
  if(confirmEl) confirmEl.addEventListener('input', validateConfirm);
  if(toggleBtn){ toggleBtn.addEventListener('click', ()=>{
    const t = passEl.type === 'password' ? 'text' : 'password'; passEl.type = t; confirmEl.type = t; toggleBtn.textContent = t === 'password' ? 'Mostrar' : 'Ocultar';
  }); }

  form.addEventListener('submit', async (ev) => {
    ev.preventDefault();
    // run validations
    const okName = validateName();
    const okEmail = validateEmail();
    const okPass = validatePassword();
    const okConfirm = validateConfirm();
    if(!(okName && okEmail && okPass && okConfirm)){
      toast('Corrija os campos em destaque', 'error'); return;
    }

    // build payload
    const fd = new FormData(form);
    const role = String(fd.get('role') || 'cliente');
    const payload = {
      nome: String(fd.get('name') || '').trim(),
      email: String(fd.get('email') || '').trim(),
      senha: String(fd.get('password') || ''),
      role: role
    };

    // Adicionar campos específicos baseado no tipo
    if (role === 'cliente') {
      payload.cpf = '000.000.000-00'; // CPF temporário para teste
    } else {
      payload.cnpj = '00.000.000/0001-00'; // CNPJ temporário para teste
      payload.especializacao = 'Serviços gerais';
    }

    // disable submit and show busy
    submitBtn.disabled = true; submitBtn.setAttribute('aria-busy','true'); submitText.textContent = 'Criando...';

    try{
      await api.register(payload);
      toast('Conta criada com sucesso!', 'success');
      form.reset();
      // Redirecionar para login após sucesso
      setTimeout(() => {
        globalThis.location.href = 'login.html';
      }, 1500);
    }catch(e){ 
      console.error(e); 
      const errorMsg = e.message || e.error || 'Erro ao criar conta';
      toast(errorMsg, 'error'); 
    }
    finally{ submitBtn.disabled = false; submitBtn.removeAttribute('aria-busy'); submitText.textContent = 'Criar conta'; }
  });
}
