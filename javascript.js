document.addEventListener("DOMContentLoaded", () => { 
    const form = document.getElementById("formAgendamento");

    if (form) {

        form.addEventListener("submit", function(e) {
            e.preventDefault();

            const nome = form.querySelector("input[name='nome']").value;
            const servico = form.querySelector("select[name='servico']").value;
            const data = form.querySelector("input[name='data']").value;
            const obs = form.querySelector("textarea[name='obs']").value;

            // Número de destino (Millenium Moto Peças)
            const telefone = "558296116499";

            const mensagem =
                `Olá! Gostaria de fazer um agendamento.%0A%0A` +
                `*Nome:* ${nome}%0A` +
                `*Serviço:* ${servico}%0A` +
                `*Data:* ${data}%0A` +
                `*Observações:* ${obs}`;

            const url = `https://wa.me/${telefone}?text=${mensagem}`;

            window.open(url, "_blank");
        });

    }
});
