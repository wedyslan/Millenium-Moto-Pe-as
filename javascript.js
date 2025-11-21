document.addEventListener("DOMContentLoaded", () => {
    const form = document.getElementById("formAgendamento");

    if (!form) return;

    form.addEventListener("submit", function (e) {
        e.preventDefault();

        // Captura os valores preenchidos pelo usuário
        const nome = form.querySelector("input[name='nome']").value.trim();
        const servico = form.querySelector("select[name='servico']").value.trim();
        const data = form.querySelector("input[name='data']").value.trim();
        const obs = form.querySelector("textarea[name='obs']").value.trim();

        // Validação simples
        if (!nome || !data) {
            alert("Por favor, preencha Nome e Data.");
            return;
        }

        // Número de WhatsApp da empresa (formato internacional)
        const telefone = "558296116499";

        // Montagem da mensagem FINAL que será enviada
        const mensagem = 
`Olá! Gostaria de fazer um agendamento.

*Nome:* ${nome}
*Serviço:* ${servico}
*Data:* ${data}
*Observações:* ${obs || "-"}

Aguardo confirmação. Obrigado!`;

        // Codificação correta para URL
        const mensagemCodificada = encodeURIComponent(mensagem);

        // Link final para abrir o WhatsApp
        const url = `https://wa.me/${telefone}?text=${mensagemCodificada}`;

        // Abre o WhatsApp (compatível com celulares)
        window.location.href = url;
    });
});

