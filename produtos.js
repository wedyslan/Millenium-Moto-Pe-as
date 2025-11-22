// Arquivo: produtos.js

document.addEventListener("DOMContentLoaded", () => {
    
    // ============================
    // LÓGICA DE FILTRAGEM DE PRODUTOS (por Nome e Preço)
    // ============================
    function filterProducts() {
        // 1. Captura os valores dos filtros
        const searchText = document.getElementById('search-input').value.toLowerCase();
        // Converte o valor do select para float; 0 significa 'Qualquer Valor'
        const maxPrice = parseFloat(document.getElementById('price-filter').value);
        const cards = document.querySelectorAll('#product-grid .card');

        cards.forEach(card => {
            const productName = card.getAttribute('data-product').toLowerCase();
            // O preço é armazenado como string, convertemos para float para comparação numérica.
            const productPrice = parseFloat(card.getAttribute('data-price'));

            // 2. Filtro de Texto: verifica se o nome do produto inclui o texto digitado
            const matchesText = productName.includes(searchText);

            // 3. Filtro de Preço: verifica se o preço está dentro do limite ou se o filtro está desativado (maxPrice === 0)
            const matchesPrice = (maxPrice === 0 || productPrice <= maxPrice);

            // 4. Aplica a visibilidade: o card só é mostrado se AMBAS as condições forem verdadeiras
            if (matchesText && matchesPrice) {
                card.style.display = 'block';
            } else {
                card.style.display = 'none';
            }
        });
    }

    // Atribuição dos Eventos de Filtro
    const searchInput = document.getElementById('search-input');
    const priceFilter = document.getElementById('price-filter');

    // Dispara a filtragem a cada digitação no campo de busca
    if (searchInput) {
        searchInput.addEventListener('input', filterProducts);
    }
    // Dispara a filtragem ao selecionar nova opção de preço
    if (priceFilter) {
        priceFilter.addEventListener('change', filterProducts);
    }

    // ============================
    // LÓGICA DE COMPRA (Do seu código original)
    // ============================
    document.querySelectorAll(".card .buy-btn").forEach(btn => {
        btn.addEventListener("click", (e) => {
            const card = e.target.closest(".card");
            const product = card.getAttribute("data-product");
            const price = card.getAttribute("data-price");
            const params = new URLSearchParams({ product, price });
            
            // Redireciona para o checkout com as informações do produto
            window.location.href = `checkout.html?${params.toString()}`;
        });
    });
});