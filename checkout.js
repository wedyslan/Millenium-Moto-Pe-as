/* checkout.js 
   Lógica do checkout: lê produto da query string, ViaCEP, valida CEPs permitidos,
   calcula frete, bloqueia compra se fora da área, envia pedido para WhatsApp e EmailJS.
*/

/* ========== CONFIGURAÇÕES ========== */
const WHATS_NUMBER = "5582996116499"; 
const EMAIL_TO = "wedyslanoliveira123@gmail.com"; 

const FRETES_POR_CEP = {
  "57275000": 5.00,
  "57270000": 8.00,
  "57301100": 15.00,
  "57275971": 0.00,
  "57279000": 0.00
};

/* EmailJS */
const EMAILJS_SERVICE = "service_xxx";
const EMAILJS_TEMPLATE = "template_xxx";
const EMAILJS_PUBLIC_KEY = "SEU_PUBLIC_KEY_AQUI";

if (window.emailjs) {
  try { emailjs.init(EMAILJS_PUBLIC_KEY); } catch(e){}
}

/* Helpers */
function qs(name){ return new URLSearchParams(location.search).get(name); }
function formatMoney(v){ return Number(v).toFixed(2).replace(".", ","); }

/* DOM refs */
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
const inputNumero = document.getElementById("numero");

const tipoEntrega = document.getElementById("tipoEntrega");

/* NOVO: Seleção dos containers dos campos */
const campoCep = document.getElementById("campo-cep");
const campoRua = document.getElementById("campo-rua");
const campoNumero = document.getElementById("campo-numero");
const campoBairro = document.getElementById("campo-bairro");
const campoCidade = document.getElementById("campo-cidade");

let produtoSelecionado = { name: "—", price: 0 };
let freteAtual = 0;

/* ================= MOSTRAR / ESCONDER CAMPOS DE ENDEREÇO ================= */
function atualizarVisibilidadeCampos() {
  if (tipoEntrega.value === "retirada") {
    campoCep.style.display = "none";
    campoRua.style.display = "none";
    campoNumero.style.display = "none";
    campoBairro.style.display = "none";
    campoCidade.style.display = "none";

    showMessage("Retirada selecionada — endereço não é necessário.", false);
    desbloqueiaCheckout();
    freteAtual = 0;
    resFrete.textContent = formatMoney(0);
    resTotal.textContent = formatMoney(produtoSelecionado.price);

  } else {
    campoCep.style.display = "block";
    campoRua.style.display = "block";
    campoNumero.style.display = "block";
    campoBairro.style.display = "block";
    campoCidade.style.display = "block";

    btnEnviar.disabled = true;
    showMessage("Informe o CEP para calcular o frete.", false);
  }
}

/* ========== inicialização ========= */
(function init(){
  const name = qs("product") || "Produto não especificado";
  const price = parseFloat(qs("price") || "0");

  produtoSelecionado.name = decodeURIComponent(name);
  produtoSelecionado.price = price;

  resNome.textContent = produtoSelecionado.name;
  resPreco.textContent = formatMoney(produtoSelecionado.price);
  resFrete.textContent = formatMoney(0);
  resTotal.textContent = formatMoney(produtoSelecionado.price);

  tipoEntrega.addEventListener("change", atualizarVisibilidadeCampos);
  atualizarVisibilidadeCampos();

  btnBuscaCep.addEventListener("click", handleBuscarCep);
  btnEnviar.addEventListener("click", handleEnviarPedido);
})();

/* ========= buscar CEP ========= */
function handleBuscarCep() {
  if (tipoEntrega.value === "retirada") {
    showMessage("Retirada selecionada — CEP não é necessário.", false);
    return;
  }

  const cep = (inputCep.value || "").replace(/\D/g, "");

  if (cep.length !== 8){
    showMessage("Informe um CEP válido com 8 dígitos.", true);
    return;
  }

  showMessage("Buscando CEP...", false);

  fetch(`https://viacep.com.br/ws/${cep}/json/`)
    .then(r => r.json())
    .then(d => {
      if (d.erro){
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
      showMessage("Erro ao buscar CEP.", true);
      bloqueiaCheckout();
    });
}

/* ========= validação CEP ========= */
function validarCepPermitido(cep){
  if (!(cep in FRETES_POR_CEP)){
    showMessage("Não entregamos nesse CEP.", true);
    bloqueiaCheckout();
    return;
  }

  freteAtual = FRETES_POR_CEP[cep];
  resFrete.textContent = formatMoney(freteAtual);

  const total = produtoSelecionado.price + freteAtual;
  resTotal.textContent = formatMoney(total);

  desbloqueiaCheckout();
  showMessage("CEP aceito. Pode finalizar o pedido.", false);
}

/* ========= bloqueio / desbloqueio ========= */
function bloqueiaCheckout(){ btnEnviar.disabled = true; }
function desbloqueiaCheckout(){ btnEnviar.disabled = false; }

/* ========= mensagens ========= */
function showMessage(text, isError=false){
  msg.style.display = "block";
  msg.textContent = text;
  msg.style.color = isError ? "#c0392b" : "#2d8659";
}

/* ========= enviar pedido ========= */
function handleEnviarPedido(){
  const nome = document.getElementById("nome").value.trim();
  const telefone = document.getElementById("telefone").value.trim();

  if (!nome || !telefone){
    showMessage("Preencha nome e telefone.", true);
    return;
  }

  let enderecoTexto = "Cliente irá retirar na loja.";
  let formaRecebimento = "Retirada na Loja";

  if (tipoEntrega.value === "entrega"){
    const cep = (inputCep.value || "").replace(/\D/g,"");
    const rua = inputRua.value.trim();
    const numero = inputNumero.value.trim();
    const bairro = inputBairro.value.trim();
    const cidade = inputCidade.value.trim();

    if (!cep || !rua || !numero || !bairro || !cidade){
      showMessage("Preencha todos os dados de entrega.", true);
      return;
    }

    formaRecebimento = "Entrega no Endereço";
    enderecoTexto = `${rua}, ${numero} - ${bairro} - ${cidade} (CEP: ${cep})`;
  }

  const total = (produtoSelecionado.price + freteAtual).toFixed(2).replace(".", ",");
  const precoStr = produtoSelecionado.price.toFixed(2).replace(".", ",");
  const freteStr = freteAtual.toFixed(2).replace(".", ",");

  const msgTexto =
`📦 *NOVO PEDIDO*%0A
*Produto:* ${produtoSelecionado.name}%0A
*Preço:* R$ ${precoStr}%0A
*Frete:* R$ ${freteStr}%0A
*Total:* R$ ${total}%0A
*Forma:* ${formaRecebimento}%0A
*Nome:* ${nome}%0A
*Telefone:* ${telefone}%0A
*Endereço:* ${enderecoTexto}`;

  window.open(`https://wa.me/${WHATS_NUMBER}?text=${msgTexto}`, "_blank");

  if (window.emailjs){
    emailjs.send(EMAILJS_SERVICE, EMAILJS_TEMPLATE, {
      to_email: EMAIL_TO,
      produto: produtoSelecionado.name,
      preco: precoStr,
      frete: freteStr,
      total: total,
      forma: formaRecebimento,
      nome: nome,
      telefone: telefone,
      endereco: enderecoTexto
    });
  }

  showMessage("Pedido enviado com sucesso!", false);
}

