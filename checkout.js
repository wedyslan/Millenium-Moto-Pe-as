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

/* EmailJS - substitua pelos seus IDs */
const EMAILJS_SERVICE = "service_xxx";
const EMAILJS_TEMPLATE = "template_xxx";
const EMAILJS_PUBLIC_KEY = "SEU_PUBLIC_KEY_AQUI";

/* inicializa EmailJS */
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

// IMPORTANTE: novo seletor
const tipoEntrega = document.getElementById("tipoEntrega");

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

  btnBuscaCep.addEventListener("click", handleBuscarCep);
  btnEnviar.addEventListener("click", handleEnviarPedido);

  tipoEntrega.addEventListener("change", atualizarRetirada);
})();

/* ========= lógica da retirada ========= */
function atualizarRetirada() {
  if (tipoEntrega.value === "retirada") {
    freteAtual = 0;
    resFrete.textContent = formatMoney(0);

    const total = produtoSelecionado.price + freteAtual;
    resTotal.textContent = formatMoney(total);

    desbloqueiaCheckout(); 
    showMessage("Modo retirada selecionado. Endereço não é necessário.", false);
  } else {
    freteAtual = 0;
    resFrete.textContent = formatMoney(0);
    const total = produtoSelecionado.price + freteAtual;
    resTotal.textContent = formatMoney(total);

    showMessage("Informe o CEP para calcular o frete.", false);
    btnEnviar.disabled = true;
  }
}

/* ========= buscar CEP via ViaCEP ========= */
function handleBuscarCep() {
  if (tipoEntrega.value === "retirada") {
    showMessage("Retirada selecionada — CEP não é necessário.", false);
    return;
  }

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

/* ========= validação do CEP ========= */
function validarCepPermitido(cep) {
  if (tipoEntrega.value === "retirada") {
    // ignorar completamente validação
    desbloqueiaCheckout();
    return;
  }

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

/* ========= bloqueio / desbloqueio ========= */
function bloqueiaCheckout() {
  btnEnviar.disabled = true;
  msg.style.color = "#c0392b";
}

function desbloqueiaCheckout() {
  btnEnviar.disabled = false;
  msg.style.color = "#2d8659";
}

/* ========= mostrar mensagens ========= */
function showMessage(text, isError=false) {
  msg.style.display = "block";
  msg.textContent = text;
  msg.style.color = isError ? "#c0392b" : "#2d8659";
}

/* ========= enviar pedido: WhatsApp + EmailJS ========= */
function handleEnviarPedido() {
  const nome = document.getElementById("nome").value.trim();
  const telefone = document.getElementById("telefone").value.trim();
  const numero = document.getElementById("numero").value.trim();
  const cep = (document.getElementById("cep").value || "").replace(/\D/g,"");

  const rua = inputRua.value.trim();
  const bairro = inputBairro.value.trim();
  const cidade = inputCidade.value.trim();

  /* ======== Validação inteligente ======== */
  if (!nome || !telefone) {
    showMessage("Preencha nome e telefone.", true);
    return;
  }

  // caso ENTREGA → validar endereço
  if (tipoEntrega.value === "entrega") {
    if (!cep || !rua || !numero || !bairro || !cidade) {
      showMessage("Preencha todos os dados de entrega.", true);
      return;
    }
  }

  /* ======== Preparação do texto ======== */
  let formaRecebimento = 
    tipoEntrega.value === "retirada" 
    ? "Retirada na Loja"
    : "Entrega no endereço";

  let enderecoTexto =
    tipoEntrega.value === "retirada"
      ? "Cliente irá retirar na loja."
      : `${rua}, ${numero} - ${bairro} - ${cidade} (CEP: ${cep})`;

  const total = (produtoSelecionado.price + freteAtual).toFixed(2).replace(".", ",");
  const precoStr = produtoSelecionado.price.toFixed(2).replace(".", ",");
  const freteStr = freteAtual.toFixed(2).replace(".", ",");

  const mensagem =
`📦 *NOVO PEDIDO*%0A
*Produto:* ${produtoSelecionado.name}%0A
*Preço:* R$ ${precoStr}%0A
*Frete:* R$ ${freteStr}%0A
*Total:* R$ ${total}%0A
*Forma de recebimento:* ${formaRecebimento}%0A
*Nome:* ${nome}%0A
*Telefone:* ${telefone}%0A
*Endereço:* ${enderecoTexto}`;

  /* ======== WhatsApp ======== */
  const urlWhats = `https://wa.me/${WHATS_NUMBER}?text=${mensagem}`;
  window.open(urlWhats, "_blank");

  /* ======== EmailJS ======== */
  if (window.emailjs) {
    const templateParams = {
      to_email: EMAIL_TO,
      produto: produtoSelecionado.name,
      preco: precoStr,
      frete: freteStr,
      total: total,
      forma: formaRecebimento,
      nome: nome,
      telefone: telefone,
      endereco: enderecoTexto
    };

    emailjs.send(EMAILJS_SERVICE, EMAILJS_TEMPLATE, templateParams)
      .then(() => {
        showMessage("Pedido enviado com sucesso!", false);
      })
      .catch(err => {
        console.error(err);
        showMessage("WhatsApp enviado. Falha no email.", true);
      });
  } else {
    showMessage("Pedido enviado ao WhatsApp. (EmailJS não configurado)", false);
  }
}
