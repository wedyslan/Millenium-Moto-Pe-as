// Seletores
const tipoEntrega = document.getElementById("tipoEntrega");
const camposEndereco = document.getElementById("campos-endereco");

// Função para mostrar/ocultar campos conforme a escolha
function atualizarCamposEntrega() {
    if (tipoEntrega.value === "retirada") {
        camposEndereco.style.display = "none"; // Esconde campos
    } else {
        camposEndereco.style.display = "block"; // Mostra campos
    }
}

// Evento quando o usuário troca a opção
tipoEntrega.addEventListener("change", atualizarCamposEntrega);

// Rodar ao carregar a página também
atualizarCamposEntrega();

document.getElementById("checkoutForm").addEventListener("submit", function (event) {
    event.preventDefault();

    const cep = document.getElementById("cep").value;
    const rua = document.getElementById("rua").value;
    const numero = document.getElementById("numero").value;
    const bairro = document.getElementById("bairro").value;
    const cidade = document.getElementById("cidade").value;

    const formaRecebimento = 
        tipoEntrega.value === "retirada" 
        ? "Retirada na Loja" 
        : "Entrega no Endereço";

    // Endereço somente quando for entrega
    let enderecoTexto = "";

    if (tipoEntrega.value === "entrega") {
        enderecoTexto = `
Endereço:
CEP: ${cep}
Rua: ${rua}
Número: ${numero}
Bairro: ${bairro}
Cidade: ${cidade}
`;
    }

    const mensagemFinal = `
Forma de Recebimento: ${formaRecebimento}
${enderecoTexto}
`;

    console.log("MENSAGEM FINAL:");
    console.log(mensagemFinal);

    alert("Pedido enviado!");
});
