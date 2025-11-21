/* checkout.js
   Lógica do checkout: lê produto da query string, ViaCEP, valida CEPs permitidos,
   calcula frete, bloqueia compra se fora da área, envia pedido para WhatsApp e EmailJS.
*/

/* ========== CONFIGURAÇÕES ========== */
const WHATS_NUMBER = "5582996116499"; // SEU NÚMERO confirmado
const EMAIL_TO = "wedyslanoliveira123@gmail.com"; // SEU E-MAIL confirmado

// MAPA DE FRETES por CEP (use CEPs sem traço)
const FRETES_POR_CEP = {
  "57275000": 5.00,
  "57270000": 8.00,
  "57301100": 15.00,
  "57275971": 0.00,
  "57279000": 0.00
};

/* EmailJS - substitua pelos seus IDs (não funciona até configurar no emailjs.com) */
const EMAILJS_SERVICE = "service_xxx";
const EMAILJS_TEMPLATE = "template_xxx";
const EMAILJS_PUBLIC_KEY = "SEU_PUBLIC_KEY_AQUI";

/* inicializa EmailJS (necessário colocar sua public key real) */
if (window.emailjs) {
  try { emailjs.init(EMAILJS_PUBLIC_KEY); } catch(e){ /* ignore */ }
}

/* ========= helpers ========= */
function qs(name) {
  return new URLSearchParams(location.search).get(name);
}

function formatMoney(v) {
  return Number(v).toFixed(2).replace(".", ",");
}

/* ========= DOM refs ========= */
const resNome = document.getElementById("resNome");
const resPreco = document.getElementById("resPreco");
const resFrete = document.getElementById("resFrete");
const resTotal = document.getElementById("resTotal");

const btnBuscaCep = document.getElementById("btnBuscaCep");
const btnEnviar = document.getElementById("btnEnviar");
const msg = document.getElementById("msg");

const inputCep = document.getElementById("cep");
const inputRua = document.getElementById("rua");
const inputBairro = document.getElementById("bairro");
const inputCidade = document.getElementById("cidade");

let produtoSelecionado = { name: "—", price: 0 };
let freteAtual = 0;

/* ========= inicialização: obtém produto da URL ========= */
(function init() {
  const name = qs("product") || "Produto não especificado";
  const price = parseFloat(qs("price") || "0");

  produtoSelecionado.name = decodeURIComponent(name);
  produtoSelecionado.price = price;

  resNome.textContent = produtoSelecionado.name;
  resPreco.textContent = formatMoney(produtoSelecionado.price);
  resFrete.textContent = formatMoney(0);
  resTotal.textContent = formatMoney(produtoSelecionado.price);

  // eventos
  btnBuscaCep.addEventListener("click", handleBuscarCep);
  btnEnviar.addEventListener("click", handleEnviarPedido);
})();

/* ========= função buscar CEP via ViaCEP ========= */
function handleBuscarCep() {
  const cepRaw = inputCep.value || "";
  const cep = cepRaw.replace(/\D/g,"");

  if (cep.length !== 8) {
    showMessage("Informe um CEP válido (8 dígitos).", true);
    return;
  }

  showMessage("Buscando CEP...", false);
  fetch(`https://viacep.com.br/ws/${cep}/json/`)
    .then(r => r.json())
    .then(d => {
      if (d.erro) {
        showMessage("CEP não encontrado.", true);
        bloqueiaCheckout();
        return;
      }

      inputRua.value = d.logradouro || "";
      inputBairro.value = d.bairro || "";
      inputCidade.value = d.localidade || "";

      validarCepPermitido(cep);
    })
    .catch(() => {
      showMessage("Erro ao buscar CEP. Verifique sua conexão.", true);
      bloqueiaCheckout();
    });
}

/* ========= validação do CEP contra lista permitida ========= */
function validarCepPermitido(cep) {
  if (!(cep in FRETES_POR_CEP)) {
    showMessage("Desculpe — não entregamos nesse CEP.", true);
    bloqueiaCheckout();
    return;
  }

  freteAtual = FRETES_POR_CEP[cep];
  resFrete.textContent = formatMoney(freteAtual);
  const total = produtoSelecionado.price + freteAtual;
  resTotal.textContent = formatMoney(total);

  desbloqueiaCheckout();
  showMessage("CEP aceito. Você pode finalizar o pedido.", false);
}

/* ========= bloqueio / desbloqueio do botão ========= */
function bloqueiaCheckout() {
  btnEnviar.disabled = true;
  msg.style.color = "#c0392b";
}

function desbloqueiaCheckout() {
  btnEnviar.disabled = false;
  msg.style.color = "#2d8659";
}

/* ========= mostrar mensagem de status ========= */
function showMessage(text, isError=false) {
  msg.style.display = "block";
  msg.textContent = text;
  msg.style.color = isError ? "#c0392b" : "#2d8659";
}

/* ========= enviar pedido: WhatsApp + EmailJS ========= */
function handleEnviarPedido() {
  // validações simples
  const nome = document.getElementById("nome").value.trim();
  const telefone = document.getElementById("telefone").value.trim();
  const cep = (document.getElementById("cep").value || "").replace(/\D/g,"");
  const rua = inputRua.value.trim();
  const numero = document.getElementById("numero").value.trim();
  const bairro = inputBairro.value.trim();
  const cidade = inputCidade.value.trim();

  if (!nome || !telefone || !cep || !rua || !numero) {
    showMessage("Preencha todos os campos obrigatórios.", true);
    return;
  }

  // monta mensagem
  const total = (produtoSelecionado.price + freteAtual).toFixed(2).replace(".", ",");
  const precoStr = produtoSelecionado.price.toFixed(2).replace(".", ",");
  const freteStr = freteAtual.toFixed(2).replace(".", ",");

  const mensagem = 
`📦 *NOVO PEDIDO*%0A
*Produto:* ${produtoSelecionado.name}%0A
*Preço:* R$ ${precoStr}%0A
*Frete:* R$ ${freteStr}%0A
*Total:* R$ ${total}%0A
*Nome:* ${nome}%0A
*Telefone:* ${telefone}%0A
*CEP:* ${cep}%0A
*Endereço:* ${rua}, ${numero} - ${bairro} - ${cidade}`;

  // abre WhatsApp (em nova aba)
  const urlWhats = `https://wa.me/${WHATS_NUMBER}?text=${mensagem}`;
  window.open(urlWhats, "_blank");

  // envia email via EmailJS (se configurado)
  if (window.emailjs) {
    const templateParams = {
      to_email: EMAIL_TO,
      produto: produtoSelecionado.name,
      preco: precoStr,
      frete: freteStr,
      total: total,
      nome: nome,
      telefone: telefone,
      cep: cep,
      endereco: `${rua}, ${numero}`,
      bairro: bairro,
      cidade: cidade
    };

    emailjs.send(EMAILJS_SERVICE, EMAILJS_TEMPLATE, templateParams)
      .then(() => {
        showMessage("Pedido enviado por e-mail e WhatsApp. Obrigado!", false);
      }, (err) => {
        console.error("EmailJS error:", err);
        showMessage("Pedido enviado ao WhatsApp. Erro no envio do email.", true);
      });
  } else {
    showMessage("Pedido enviado ao WhatsApp. (Configure EmailJS para envio por email.)", false);
  }

  // opcional: limpar campos ou redirecionar
  // document.getElementById("checkoutForm").reset();
}
