// This file loads items.json and draws the list on screen.

const LIST_URL = "items.json";

// ---------- Light / dark mode ----------
const root = document.documentElement;
try {
  const saved = localStorage.getItem("theme");
  if (saved) root.dataset.theme = saved;
  else if (matchMedia("(prefers-color-scheme: dark)").matches) root.dataset.theme = "dark";
} catch (e) {}

document.getElementById("theme").addEventListener("click", () => {
  const next = root.dataset.theme === "dark" ? "light" : "dark";
  root.dataset.theme = next;
  try { localStorage.setItem("theme", next); } catch (e) {}
});

// ---------- Helpers ----------
function groupByCategory(items) {
  const groups = {};
  items.forEach(item => {
    const cat = item.category || "Other";
    (groups[cat] = groups[cat] || []).push(item);
  });
  return groups;
}

function makeItem(item) {
  const row = document.createElement("div");
  row.className = "item";
  const emoji = document.createElement("span");
  emoji.className = "emoji";
  emoji.textContent = item.emoji || "🛒";
  const name = document.createElement("span");
  name.textContent = item.name;
  row.append(emoji, name);
  return row;
}

function drawGroups(container, items) {
  container.innerHTML = "";
  const groups = groupByCategory(items);
  Object.keys(groups).forEach(cat => {
    const heading = document.createElement("h2");
    heading.className = "category";
    heading.textContent = cat;
    container.appendChild(heading);
    groups[cat].forEach(item => container.appendChild(makeItem(item)));
  });
}

function formatUpdated(dateString) {
  if (!dateString) return "";
  const d = new Date(dateString);
  if (isNaN(d)) return "";
  return "Last updated " + d.toLocaleString("en-IE", {
    weekday: "short", day: "numeric", month: "short", hour: "2-digit", minute: "2-digit"
  });
}

// ---------- Main ----------
async function loadList() {
  try {
    // "no-cache" asks for the freshest copy each time
    const response = await fetch(LIST_URL, { cache: "no-cache" });
    if (!response.ok) throw new Error("Bad response");
    const data = await response.json();
    const items = data.items || [];

    const needed = items.filter(i => i.need);
    const have = items.filter(i => !i.need);

    document.getElementById("count").textContent = needed.length;
    document.getElementById("count-label").textContent =
      needed.length === 0 ? "Nothing needed!" :
      needed.length === 1 ? "item needed" : "items needed";

    const needBox = document.getElementById("need");
    if (needed.length === 0) {
      needBox.innerHTML = '<p class="all-done">🎉 You can skip the shop.</p>';
    } else {
      drawGroups(needBox, needed);
    }

    drawGroups(document.getElementById("have"), have);
    document.getElementById("have-count").textContent = "(" + have.length + ")";

    document.getElementById("updated").textContent =
      formatUpdated(response.headers.get("Last-Modified"));
  } catch (error) {
    document.getElementById("count").textContent = "!";
    document.getElementById("count-label").textContent = "Couldn't load the list";
    const msg = document.getElementById("message");
    msg.hidden = false;
    msg.textContent = "Check your signal and reopen the app.";
  }
}

loadList();

// Reload the list whenever the app is brought back to the screen
document.addEventListener("visibilitychange", () => {
  if (document.visibilityState === "visible") loadList();
});

// ---------- Make it installable / work offline ----------
if ("serviceWorker" in navigator) {
  navigator.serviceWorker.register("sw.js");
}
