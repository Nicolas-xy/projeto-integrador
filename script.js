let isEditing = false;
let currentEditIndex = null;

const form = document.getElementById('expense-form');
const descriptionInput = document.getElementById('description');
const amountInput = document.getElementById('amount');
const dateInput = document.getElementById('date');
const categoryInput = document.getElementById('category');
const expenseList = document.getElementById('expense-list');
const totalDisplay = document.getElementById('total');
const filterText = document.getElementById('filterText');
const startDate = document.getElementById('startDate');
const endDate = document.getElementById('endDate');
const themeToggleButton = document.getElementById('toggle-theme');

let expenseChart = null;
let expenses = JSON.parse(localStorage.getItem('expenses')) || [];

function saveExpenses() {
    localStorage.setItem('expenses', JSON.stringify(expenses));
}

function loadExpenses() {
    const saved = localStorage.getItem('expenses');
    if (saved) {
        expenses = JSON.parse(saved);
    }
}

function formatCurrency(value) {
    return new Intl.NumberFormat('pt-BR', {
        style: 'currency',
        currency: 'BRL'
    }).format(value);
}

function renderExpenses(filteredExpenses = expenses) {
    expenseList.innerHTML = '';

    filteredExpenses.forEach((expense, index) => {
        const li = document.createElement('li');
        li.innerHTML = `
      ${expense.date} - ${expense.description} - ${expense.category} - ${formatCurrency(expense.amount)}
      <div>
        <button onclick="editExpense(${index})"><i class="fa-solid fa-pen"></i></button>
        <button onclick="removeExpense(${index})"><i class="fa-solid fa-trash"></i></button>
      </div>
    `;
        expenseList.appendChild(li);
    });

    const total = filteredExpenses.reduce((sum, e) => sum + parseFloat(e.amount), 0);
    totalDisplay.textContent = formatCurrency(total);
}

function editExpense(index) {
    const expense = expenses[index];
    descriptionInput.value = expense.description;
    amountInput.value = expense.amount;
    dateInput.value = expense.date;
    categoryInput.value = expense.category;

    isEditing = true;
    currentEditIndex = index;

    form.querySelector('button[type="submit"]').textContent = "Atualizar";
}

function removeExpense(index) {
    expenses.splice(index, 1);
    showMessage("Despesa removida!", "red");
    saveExpenses();
    renderExpenses();
    updateChart();
}

function applyFilters() {
    const text = filterText.value.toLowerCase();
    const start = startDate.value;
    const end = endDate.value;

    const filtered = expenses.filter(expense => {
        const matchesText = expense.description.toLowerCase().includes(text);
        const inDateRange =
            (!start || expense.date >= start) &&
            (!end || expense.date <= end);

        return matchesText && inDateRange;
    });

    renderExpenses(filtered);
}

function clearFilters() {
    filterText.value = '';
    startDate.value = '';
    endDate.value = '';
    renderExpenses();
    updateChart();
}

function updateChart() {
    const grouped = {};

    expenses.forEach(expense => {
        const key = expense.category || 'Sem Categoria';
        if (!grouped[key]) {
            grouped[key] = 0;
        }
        grouped[key] += parseFloat(expense.amount);
    });

    const labels = Object.keys(grouped);
    const data = Object.values(grouped);

    const ctx = document.getElementById('expenseChart').getContext('2d');

    if (expenseChart) {
        expenseChart.destroy();
    }

    expenseChart = new Chart(ctx, {
        type: 'pie',
        data: {
            labels: labels,
            datasets: [{
                label: 'Gastos por Categoria',
                data: data,
                backgroundColor: labels.map(() =>
                    '#' + Math.floor(Math.random() * 16777215).toString(16)
                ),
                borderWidth: 1
            }]
        },
        options: {
            responsive: true
        }
    });
}

form.addEventListener('submit', (e) => {
    e.preventDefault();

    const description = descriptionInput.value.trim();
    const amount = amountInput.value;
    const date = dateInput.value;
    const category = categoryInput.value;

    if (!description || !amount || !date || !category) return;

    if (parseFloat(amount) <= 0) {
        showMessage("O valor deve ser maior que zero.", "red");
        return;
    }

    if (isEditing) {
        expenses[currentEditIndex] = { description, amount, date, category };
        showMessage("Despesa atualizada!");
        isEditing = false;
        currentEditIndex = null;
        form.querySelector('button[type="submit"]').textContent = "Adicionar";
    } else {
        expenses.push({ description, amount, date, category });
        showMessage("Despesa adicionada!");
    }

    saveExpenses();
    renderExpenses();
    updateChart();

    descriptionInput.value = '';
    amountInput.value = '';
    dateInput.value = '';
    categoryInput.value = '';
});

function exportToCSV() {
    if (expenses.length === 0) {
        alert("Não há despesas para exportar.");
        return;
    }

    const header = ["Descrição", "Valor", "Data", "Categoria"];
    const rows = expenses.map(e => [
        e.description,
        formatCurrency(e.amount),
        e.date,
        e.category
    ]);

    let csvContent = "data:text/csv;charset=utf-8,"
        + header.join(";") + "\n"
        + rows.map(r => r.join(";")).join("\n");

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "minhas_despesas.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}

function showMessage(text, color = 'green') {
    const message = document.getElementById('message');
    message.textContent = text;
    message.style.color = color;
    message.style.fontWeight = 'bold';

    setTimeout(() => {
        message.textContent = '';
    }, 2500);
}

// Tema escuro
const savedTheme = localStorage.getItem('theme');
if (savedTheme === 'dark') {
    document.body.classList.add('dark');
    themeToggleButton.textContent = '☀️ Tema Claro';
}

themeToggleButton.addEventListener('click', () => {
    document.body.classList.toggle('dark');

    if (document.body.classList.contains('dark')) {
        themeToggleButton.textContent = '☀️ Tema Claro';
        localStorage.setItem('theme', 'dark');
    } else {
        themeToggleButton.textContent = '🌙 Tema Escuro';
        localStorage.setItem('theme', 'light');
    }
});

// Inicializa
loadExpenses();
renderExpenses();
updateChart();
