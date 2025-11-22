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
        const cards = document.querySelectorAll('#product-grid .card'); // Procura os cards pelo ID corrigido no HTML

        cards.forEach(card => {
            const productName = card.getAttribute('data-product').toLowerCase();
            const productPrice = parseFloat(card.getAttribute('data-price'));

            // 2. Filtro de Texto
            const matchesText = productName.includes(searchText);

            // 3. Filtro de Preço
            const matchesPrice = (maxPrice === 0 || productPrice <= maxPrice);

            // 4. Aplica a visibilidade
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

    // Liga a função de filtro aos inputs
    if (searchInput) {
        searchInput.addEventListener('input', filterProducts);
    }
    if (priceFilter) {
        priceFilter.addEventListener('change', filterProducts);
    }

    // ============================
    // LÓGICA DE COMPRA (Funcionalidade de redirecionamento)
    // ============================
    document.querySelectorAll(".card .buy-btn").forEach(btn => {
        btn.addEventListener("click", (e) => {
            const card = e.target.closest(".card");
            const product = card.getAttribute("data-product");
            const price = card.getAttribute("data-price");
            const params = new URLSearchParams({ product, price });
            
            window.location.href = `checkout.html?${params.toString()}`;
        });
    });
});
