const SHEET_WEB_APP_URL = "https://script.google.com/macros/s/AKfycbywrxkRD8_bVOFzQNvHuviDDWtwnI0_JJrE6mAsLFdd1fPNrm66fpt_YGgh-JfovBxqSg/exec";
const screens = [
  "screen-intro",
  "screen-usage",
  "screen-purpose",
  "screen-product",
  "screen-psychology",
  "screen-experience",
  "screen-features",
  "screen-finish"
];

const totalSteps = 5;

const psychologyItems = [
  {
    key: "relief",
    text: "お気に入りに入れると、あとで見返せる安心感がある"
  },
  {
    key: "noNeedNow",
    text: "お気に入りに入れると、今すぐ購入しなくてもよいと感じる"
  },
  {
    key: "postpone",
    text: "お気に入りに入れると、購入判断を先延ばしにしやすくなる"
  },
  {
    key: "purchaseIntention",
    text: "お気に入りに入れると、購入意欲が高まる"
  }
];

const scaleLabels = [
  "まったく思わない",
  "あまり思わない",
  "どちらともいえない",
  "やや思う",
  "とても思う"
];

let responseData = createInitialResponseData();
let productStartTime = null;

window.addEventListener("DOMContentLoaded", () => {
  createPsychologyQuestions();
  setupCondition();
  updateProgress(0);
});

function createInitialResponseData() {
  return {
    participantId: createParticipantId(),
    condition: decideCondition(),
    startedAt: "",
    finishedAt: "",
    usageFrequency: "",
    purposes: [],
    favoriteClicked: false,
    productAction: "",
    productViewSeconds: 0,
    psychology: {},
    notPurchasedExperience: "",
    purchaseFeatures: []
  };
}

function createParticipantId() {
  const dateText = new Date().toISOString().replace(/[-:.TZ]/g, "");
  const randomText = Math.random().toString(36).slice(2, 8);
  return "P-" + dateText + "-" + randomText;
}

function decideCondition() {
  const urlParams = new URLSearchParams(window.location.search);
  const conditionFromUrl = urlParams.get("condition");

  if (conditionFromUrl === "favorite") {
    return "お気に入りボタンあり";
  }

  if (conditionFromUrl === "noFavorite") {
    return "お気に入りボタンなし";
  }

  return Math.random() < 0.5 ? "お気に入りボタンあり" : "お気に入りボタンなし";
}

function setupCondition() {
  const favoriteArea = document.getElementById("favoriteArea");

  if (responseData.condition === "お気に入りボタンなし") {
    favoriteArea.classList.add("hidden");
  } else {
    favoriteArea.classList.remove("hidden");
  }
}

function startSurvey() {
  responseData.startedAt = new Date().toISOString();
  showScreen("screen-usage");
}

function saveUsage() {
  const selected = getRadioValue("usageFrequency");

  if (!selected) {
    showError("screen-usage", "Q1を選択してください。");
    return;
  }

  responseData.usageFrequency = selected;
  showScreen("screen-purpose");
}

function savePurpose() {
  const selected = getCheckboxValues("purpose");

  if (selected.length === 0) {
    showError("screen-purpose", "少なくとも1つ選択してください。");
    return;
  }

  responseData.purposes = selected;
  productStartTime = Date.now();
  showScreen("screen-product");
}

function addFavorite() {
  responseData.favoriteClicked = true;

  const favoriteButton = document.getElementById("favoriteButton");
  const favoriteMessage = document.getElementById("favoriteMessage");

  favoriteButton.textContent = "♥ お気に入り登録済み";
  favoriteButton.classList.add("active");
  favoriteMessage.textContent = "お気に入りに登録しました。あとで見返すことができます。";
}

function chooseAction(actionText) {
  responseData.productAction = actionText;

  if (productStartTime) {
    responseData.productViewSeconds = Math.round((Date.now() - productStartTime) / 1000);
  }

  showScreen("screen-psychology");
}

function createPsychologyQuestions() {
  const area = document.getElementById("psychologyQuestions");
  area.innerHTML = "";

  psychologyItems.forEach((item) => {
    const wrapper = document.createElement("div");
    wrapper.className = "matrix-question";

    const title = document.createElement("p");
    title.textContent = item.text;
    wrapper.appendChild(title);

    const scaleRow = document.createElement("div");
    scaleRow.className = "scale-row";

    scaleLabels.forEach((label, index) => {
      const labelElement = document.createElement("label");
      const value = index + 1;

      labelElement.innerHTML = `
        <input type="radio" name="${item.key}" value="${value}">
        ${value}<br>${label}
      `;

      scaleRow.appendChild(labelElement);
    });

    wrapper.appendChild(scaleRow);
    area.appendChild(wrapper);
  });
}

function savePsychology() {
  const answers = {};

  for (const item of psychologyItems) {
    const selected = getRadioValue(item.key);

    if (!selected) {
      showError("screen-psychology", "すべての項目を選択してください。");
      return;
    }

    answers[item.key] = Number(selected);
  }

  responseData.psychology = answers;
  showScreen("screen-experience");
}

function saveExperience() {
  const experience = getRadioValue("notPurchasedExperience");

  if (!experience) {
    showError("screen-experience", "Q4を選択してください。");
    return;
  }

  responseData.notPurchasedExperience = experience;
  showScreen("screen-features");
}

function finishSurvey() {
  const features = getCheckboxValues("purchaseFeature");

  if (features.length === 0) {
    showError("screen-features", "少なくとも1つ選択してください。");
    return;
  }

  responseData.purchaseFeatures = features;
  responseData.finishedAt = new Date().toISOString();

  saveToLocalStorage(responseData);

  document.getElementById("finishMessage").textContent =
    "回答が完了しました。回答ID：" + responseData.participantId;

  showScreen("screen-finish");
}

function saveToLocalStorage(data) {
  const key = "favoriteSurveyTestResponses";
  const currentData = JSON.parse(localStorage.getItem(key) || "[]");

  currentData.push(data);
  localStorage.setItem(key, JSON.stringify(currentData));

  console.log("回答データ", data);
}

function restartSurvey() {
  responseData = createInitialResponseData();
  productStartTime = null;

  resetInputs();
  setupCondition();
  showScreen("screen-intro");
}

function resetInputs() {
  document.querySelectorAll("input").forEach((input) => {
    input.checked = false;
  });

  const favoriteButton = document.getElementById("favoriteButton");
  const favoriteMessage = document.getElementById("favoriteMessage");

  favoriteButton.textContent = "♡ お気に入りに登録";
  favoriteButton.classList.remove("active");
  favoriteMessage.textContent = "まだお気に入りに登録していません";
}

function showScreen(screenId) {
  clearErrors();

  screens.forEach((id) => {
    const screen = document.getElementById(id);

    if (screen) {
      screen.classList.remove("active");
    }
  });

  const targetScreen = document.getElementById(screenId);
  targetScreen.classList.add("active");

  updateProgress(getStepNumber(screenId));

  window.scrollTo({
    top: 0,
    behavior: "smooth"
  });
}

function getStepNumber(screenId) {
  if (screenId === "screen-intro") return 0;
  if (screenId === "screen-usage") return 1;
  if (screenId === "screen-purpose") return 2;
  if (screenId === "screen-product") return 2;
  if (screenId === "screen-psychology") return 3;
  if (screenId === "screen-experience") return 4;
  if (screenId === "screen-features") return 5;
  if (screenId === "screen-finish") return 5;

  return 0;
}

function goBack(screenId) {
  showScreen(screenId);
}

function updateProgress(currentStep) {
  const stepText = document.getElementById("stepText");
  const progressFill = document.getElementById("progressFill");

  const percent = (currentStep / totalSteps) * 100;

  stepText.textContent = "Step " + currentStep + " / " + totalSteps;
  progressFill.style.width = percent + "%";
}

function getRadioValue(name) {
  const selected = document.querySelector(`input[name="${name}"]:checked`);
  return selected ? selected.value : "";
}

function getCheckboxValues(name) {
  const selected = document.querySelectorAll(`input[name="${name}"]:checked`);
  return Array.from(selected).map((input) => input.value);
}

function showError(screenId, message) {
  clearErrors();

  const screen = document.getElementById(screenId);
  const error = document.createElement("div");

  error.className = "error-message";
  error.textContent = message;

  const card = screen.querySelector(".card") || screen;
  card.appendChild(error);
}

function clearErrors() {
  document.querySelectorAll(".error-message").forEach((error) => {
    error.remove();
  });
}