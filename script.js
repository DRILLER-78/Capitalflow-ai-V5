"use strict";

const STORAGE_KEY = "shopBookRecords";
const SNAPSHOT_KEY = "shopBookSavedResults";

let records = loadData(STORAGE_KEY);
let savedResults = loadData(SNAPSHOT_KEY);
let currentPeriod = "daily";

function loadData(key) {
    try {
        const data = JSON.parse(localStorage.getItem(key));
        return Array.isArray(data) ? data : [];
    } catch {
        return [];
    }
}

function saveRecords() {
    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(records));
        return true;
    } catch {
        alert("Unable to save records. Check your device storage.");
        return false;
    }
}

function saveSnapshots() {
    try {
        localStorage.setItem(SNAPSHOT_KEY, JSON.stringify(savedResults));
        return true;
    } catch {
        alert("Unable to save results. Check your device storage.");
        return false;
    }
}

function getToday() {
    const date = new Date();

    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

function parseLocalDate(dateString) {
    if (!dateString || !/^\d{4}-\d{2}-\d{2}$/.test(dateString)) {
        return null;
    }

    const parts = dateString.split("-").map(Number);
    const date = new Date(parts[0], parts[1] - 1, parts[2]);

    if (
        date.getFullYear() !== parts[0] ||
        date.getMonth() !== parts[1] - 1 ||
        date.getDate() !== parts[2]
    ) {
        return null;
    }

    date.setHours(0, 0, 0, 0);
    return date;
}

function formatMoney(amount) {
    return new Intl.NumberFormat("en-NG", {
        style: "currency",
        currency: "NGN",
        maximumFractionDigits: 2
    }).format(Number(amount) || 0);
}

function formatDate(dateString) {
    const date = parseLocalDate(dateString);

    if (!date) return dateString || "";

    return date.toLocaleDateString("en-GB");
}

function getTypeName(type) {
    const names = {
        sale: "Sale",
        expense: "Expense",
        credit: "Credit Given",
        credit_payment: "Credit Payment"
    };

    return names[type] || type;
}

function escapeHTML(value) {
    return String(value ?? "").replace(/[&<>"']/g, character => {
        const entities = {
            "&": "&amp;",
            "<": "&lt;",
            ">": "&gt;",
            '"': "&quot;",
            "'": "&#39;"
        };

        return entities[character];
    });
}

function getStartOfWeek(date) {
    const start = new Date(date);
    const day = start.getDay();
    const difference = day === 0 ? -6 : 1 - day;

    start.setDate(start.getDate() + difference);
    start.setHours(0, 0, 0, 0);

    return start;
}

function filterByPeriod(record) {
return record.period === currentPeriod;
}

function getFilteredRecords(source = records) {
const searchInput = document.getElementById("search");

const query = searchInput
    ? searchInput.value.trim().toLowerCase()
    : "";

return source.filter(record => {
    if (record.period !== currentPeriod) {
        return false;
    }
    
    const searchableText = [
        record.description,
        record.date,
        formatDate(record.date),
        getTypeName(record.type),
        record.amount
    ]
        .join(" ")
        .toLowerCase();

    return searchableText.includes(query);
});

}

function setupPeriodButtons() {
    const periods = ["daily", "weekly", "monthly", "yearly"];

    periods.forEach(period => {
        const button = document.getElementById(`${period}Btn`);

        if (button) {
            button.addEventListener("click", () => setPeriod(period));
        }
    });
}

function setPeriod(period) {
    if (!["daily", "weekly", "monthly", "yearly"].includes(period)) {
        return;
    }

    currentPeriod = period;

    ["daily", "weekly", "monthly", "yearly"].forEach(name => {
        const button = document.getElementById(`${name}Btn`);

        if (button) {
            button.classList.toggle("active", name === period);
            button.setAttribute("aria-pressed", String(name === period));
        }
    });

    const title = document.getElementById("recordTitle");

    if (title) {
        title.textContent =
            period.charAt(0).toUpperCase() + period.slice(1) + " Records";
    }

    displayRecords();
    updateDashboard();
}

function addRecord() {
    const dateInput = document.getElementById("date");
    const descriptionInput = document.getElementById("description");
    const typeInput = document.getElementById("type");
    const amountInput = document.getElementById("amount");

    if (!dateInput || !descriptionInput || !typeInput || !amountInput) {
        alert("Some form fields are missing from your HTML.");
        return;
    }

    const date = dateInput.value;
    const description = descriptionInput.value.trim();
    const type = typeInput.value;
    const amountText = amountInput.value.trim();
    const amount = Number(amountText);

    if (!parseLocalDate(date)) {
        alert("Please select a valid date.");
        return;
    }

    if (!description) {
        alert("Please enter a description.");
        descriptionInput.focus();
        return;
    }

    if (!["sale", "expense", "credit", "credit_payment"].includes(type)) {
        alert("Please select a valid record type.");
        return;
    }

    if (amountText === "" || !Number.isFinite(amount) || amount <= 0) {
        alert("Please enter an amount greater than zero.");
        amountInput.focus();
        return;
    }

    const record = {
    id: "${Date.now()}-${Math.random().toString(36).slice(2)}",
    date,
    description,
    type,
    amount,
    period: currentPeriod
    };

    records.push(record);

    if (!saveRecords()) {
        records.pop();
        return;
    }

    descriptionInput.value = "";
    amountInput.value = "";
    dateInput.value = getToday();
    typeInput.value = "sale";

    displayRecords();
    updateDashboard();
}

function displayRecords() {
    const table = document.getElementById("recordTable");

    if (!table) return;

    const filteredRecords = getFilteredRecords();

    table.replaceChildren();

    if (filteredRecords.length === 0) {
        const row = document.createElement("tr");
        const cell = document.createElement("td");

        cell.colSpan = 5;
        cell.textContent = "No records found for this period.";
        row.appendChild(cell);
        table.appendChild(row);

        return;
    }

    filteredRecords.slice().reverse().forEach(record => {
        const row = document.createElement("tr");

        const values = [
            formatDate(record.date),
            record.description,
            getTypeName(record.type),
            formatMoney(record.amount)
        ];

        values.forEach(value => {
            const cell = document.createElement("td");
            cell.textContent = value;
            row.appendChild(cell);
        });

        const actionCell = document.createElement("td");
        const deleteButton = document.createElement("button");

        deleteButton.type = "button";
        deleteButton.textContent = "Delete";
        deleteButton.addEventListener("click", () => deleteRecord(record.id));

        actionCell.appendChild(deleteButton);
        row.appendChild(actionCell);
        table.appendChild(row);
    });
}

function deleteRecord(id) {
    const index = records.findIndex(record => record.id === id);

    if (index === -1) return;

    const deletedRecord = records[index];

    if (!confirm("Are you sure you want to delete this record?")) {
        return;
    }

    records.splice(index, 1);

    if (!saveRecords()) {
        records.splice(index, 0, deletedRecord);
        return;
    }

    displayRecords();
    updateDashboard();
}

function updateDashboard(source = records) {
    const filteredRecords = source.filter(filterByPeriod);

    let totalSales = 0;
    let totalExpenses = 0;
    let totalCredit = 0;
    let totalCreditPayments = 0;

    filteredRecords.forEach(record => {
        const amount = Number(record.amount) || 0;

        if (record.type === "sale") {
            totalSales += amount;
        } else if (record.type === "expense") {
            totalExpenses += amount;
        } else if (record.type === "credit") {
            totalCredit += amount;
        } else if (record.type === "credit_payment") {
            totalCreditPayments += amount;
        }
    });

    const values = {
        totalSales: totalSales + totalCredit,
        totalExpenses,
        totalProfit: totalSales + totalCredit - totalExpenses,
        totalCredit: Math.max(0, totalCredit - totalCreditPayments)
    };

    Object.entries(values).forEach(([id, value]) => {
        const element = document.getElementById(id);

        if (element) {
            element.textContent = formatMoney(value);
        }
    });
}

function saveResult() {
    const filteredRecords = getFilteredRecords();

    if (filteredRecords.length === 0) {
        alert("There are no records to save for this period.");
        return;
    }

    const snapshot = {
        id: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
        savedAt: new Date().toISOString(),
        period: currentPeriod,
        records: JSON.parse(JSON.stringify(filteredRecords))
    };

    savedResults.unshift(snapshot);

    if (!saveSnapshots()) {
        savedResults.shift();
        return;
    }

    renderSavedResults();
    alert("Your results have been saved.");
}

function renderSavedResults() {
    let section = document.getElementById("savedResultsSection");

    if (!section) {
        section = document.createElement("section");
        section.id = "savedResultsSection";

        const table = document.getElementById("recordTable");

        if (table && table.closest("section")) {
            table.closest("section").insertAdjacentElement("afterend", section);
        } else if (table && table.parentElement) {
            table.parentElement.insertAdjacentElement("afterend", section);
        } else {
            document.body.appendChild(section);
        }
    }

    section.replaceChildren();

    const heading = document.createElement("h2");
    heading.textContent = "Saved Results";
    section.appendChild(heading);

    if (savedResults.length === 0) {
        const message = document.createElement("p");
        message.textContent = "No saved results yet.";
        section.appendChild(message);
        return;
    }

    savedResults.forEach(snapshot => {
        const card = document.createElement("div");
        card.className = "saved-result-card";

        const title = document.createElement("h3");
        title.textContent =
            `${snapshot.period.charAt(0).toUpperCase() + snapshot.period.slice(1)} result`;

        const date = document.createElement("p");
        date.textContent = `Saved: ${new Date(snapshot.savedAt).toLocaleString()}`;

        const count = document.createElement("p");
        count.textContent = `Records: ${snapshot.records.length}`;

        const viewButton = document.createElement("button");
        viewButton.type = "button";
        viewButton.textContent = "Restore Result";
        viewButton.addEventListener("click", () => viewSavedResult(snapshot.id));

        const csvButton = document.createElement("button");
        csvButton.type = "button";
        csvButton.textContent = "Download CSV";
        csvButton.addEventListener("click", () => {
            downloadCSV(
                snapshot.records,
                `Shop-Book-Saved-${snapshot.period}`
            );
        });

        const deleteButton = document.createElement("button");
        deleteButton.type = "button";
        deleteButton.textContent = "Delete Saved Result";
        deleteButton.addEventListener("click", () => deleteSavedResult(snapshot.id));

        card.append(title, date, count, viewButton, csvButton, deleteButton);
        section.appendChild(card);
    });
}

function viewSavedResult(id) {
    const snapshot = savedResults.find(item => item.id === id);

    if (!snapshot) {
        alert("Saved result not found.");
        return;
    }

    if (!confirm("Restore this saved result? Your current working records will be replaced.")) {
        return;
    }

    const previousRecords = records;
    const restoredRecords = JSON.parse(JSON.stringify(snapshot.records));

    records = restoredRecords;

    if (!saveRecords()) {
        records = previousRecords;
        return;
    }

    currentPeriod = snapshot.period;
    setPeriod(snapshot.period);

    alert("Saved result restored. Your saved copy remains available.");
}

function deleteSavedResult(id) {
    if (!confirm("Delete this saved result permanently?")) {
        return;
    }

    const previousResults = savedResults;
    savedResults = savedResults.filter(item => item.id !== id);

    if (!saveSnapshots()) {
        savedResults = previousResults;
        return;
    }

    renderSavedResults();
}

function clearAll() {
    if (records.length === 0) {
        alert("There are no current records to clear.");
        return;
    }

    if (!confirm("Clear all current records? Your saved results will remain available.")) {
        return;
    }

    const previousRecords = records;
    records = [];

    if (!saveRecords()) {
        records = previousRecords;
        return;
    }

    displayRecords();
    updateDashboard();

    alert("Current records cleared. Your saved results have been kept.");
}

function downloadCSV(list = getFilteredRecords(), filename = "Shop-Book") {
    const headings = ["Date", "Description", "Type", "Amount"];

    const rows = list.map(record => [
        record.date,
        record.description,
        getTypeName(record.type),
        record.amount
    ]);

    const escapeCSV = value =>
        `"${String(value ?? "").replace(/"/g, '""')}"`;

    const csv = [
        headings.map(escapeCSV).join(","),
        ...rows.map(row => row.map(escapeCSV).join(","))
    ].join("\r\n");

    const blob = new Blob(["\uFEFF", csv], {
        type: "text/csv;charset=utf-8;"
    });

    downloadBlob(blob, `${filename}.csv`);
}

function downloadRecords() {
    downloadCSV();
}

function downloadPDF() {
    if (!window.jspdf || !window.jspdf.jsPDF) {
        alert("PDF support is missing. Add the jsPDF library to your HTML first.");
        return;
    }

    const list = getFilteredRecords();

    if (list.length === 0) {
        alert("There are no records to download for this period.");
        return;
    }

    const { jsPDF } = window.jspdf;
    const pdf = new jsPDF();

    pdf.setFontSize(16);
    pdf.text("Shop-Book Record", 14, 18);

    pdf.setFontSize(11);
    pdf.text(`Period: ${currentPeriod}`, 14, 27);
    pdf.text(`Generated: ${new Date().toLocaleDateString()}`, 14, 34);

    let y = 45;

    pdf.setFontSize(9);
    pdf.text("Date", 14, y);
    pdf.text("Description", 42, y);
    pdf.text("Type", 112, y);
    pdf.text("Amount (NGN)", 150, y);

    y += 7;

    list.forEach(record => {
        if (y > 275) {
            pdf.addPage();
            y = 20;
        }

        const description = pdf.splitTextToSize(
            String(record.description),
            65
        );

        pdf.text(formatDate(record.date), 14, y);
        pdf.text(description, 42, y);
        pdf.text(getTypeName(record.type), 112, y);
        pdf.text(Number(record.amount).toLocaleString("en-NG"), 150, y);

        y += Math.max(7, description.length * 4);
    });

    pdf.save(`Shop-Book-${currentPeriod}.pdf`);
}

function downloadBlob(blob, filename) {
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");

    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    link.remove();

    setTimeout(() => URL.revokeObjectURL(url), 1000);
}

document.addEventListener("DOMContentLoaded", function () {
const dateInput = document.getElementById("date");

if (dateInput && !dateInput.value) {
    dateInput.value = getToday();
}

const searchInput = document.getElementById("search");

if (searchInput) {
    searchInput.addEventListener("input", function () {
        displayRecords();
        updateDashboard();
    });
} else {
    console.warn(
        'ShopBook: Search input with id="search" was not found.'
    );
}

setupPeriodButtons();
renderSavedResults();
setPeriod("daily");

});