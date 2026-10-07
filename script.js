let records = JSON.parse(localStorage.getItem("shopBookRecords")) || [];
let currentPeriod = "daily";

function saveRecords() {
    localStorage.setItem("shopBookRecords", JSON.stringify(records));
}

function getToday() {
    const date = new Date();

    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

function parseLocalDate(dateString) {
    const parts = dateString.split("-");

    return new Date(
        Number(parts[0]),
        Number(parts[1]) - 1,
        Number(parts[2])
    );
}

document.addEventListener("DOMContentLoaded", function () {
    const dateInput = document.getElementById("date");

    if (dateInput) {
        dateInput.value = getToday();
    }

    createDownloadButton();
    setupPeriodButtons();
    setPeriod("daily");
});

function addRecord() {
    const date = document.getElementById("date").value;
    const description = document.getElementById("description").value.trim();
    const type = document.getElementById("type").value;
    const amount = Number(document.getElementById("amount").value);

    if (!date) {
        alert("Please select a date.");
        return;
    }

    if (!description) {
        alert("Please enter a description.");
        return;
    }

    if (!type) {
        alert("Please select a record type.");
        return;
    }

    if (!amount || amount <= 0) {
        alert("Please enter a valid amount.");
        return;
    }

    records.push({
        id: Date.now(),
        date: date,
        description: description,
        type: type,
        amount: amount
    });

    saveRecords();

    document.getElementById("description").value = "";
    document.getElementById("amount").value = "";
    document.getElementById("date").value = getToday();
    document.getElementById("type").value = "sale";

    displayRecords();
    updateDashboard();
}

