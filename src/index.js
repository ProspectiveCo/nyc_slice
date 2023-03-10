import perspective from "@finos/perspective/dist/umd/perspective.js";

import "@finos/perspective-workspace/dist/umd/perspective-workspace.js";
import "@finos/perspective-viewer-datagrid/dist/umd/perspective-viewer-datagrid.js";
import "@finos/perspective-viewer-d3fc/dist/umd/perspective-viewer-d3fc.js";
import "@finos/perspective-viewer-openlayers/dist/umd/perspective-viewer-openlayers.js";

import dark_theme from "@finos/perspective-workspace/dist/css/material-dark.css";
import light_theme from "@finos/perspective-workspace/dist/css/material.css";

import index from "./index.css";
import light from "./light.css";
import dark from "./dark.css";

import layouts from "./layout.json";

const core_style_node = document.createElement("style");
core_style_node.textContent = `${index}\n${light}\n${dark}`;
document.head.appendChild(core_style_node);

let LAYOUTS = localStorage.getItem("layouts")
    ? JSON.parse(localStorage.getItem("layouts"))
    : layouts;

const worker = perspective.worker();

const theme_style_node = document.createElement("style");
document.head.appendChild(theme_style_node);

function toggle_theme() {
    if (theme_style_node.dataset.theme === "light") {
        console.log(dark_theme);
        theme_style_node.textContent = dark_theme;
        theme_style_node.dataset.theme = "dark";
        document.body.classList.add("dark");
        window.theme.textContent = "Light Theme";
        for (const view of document.querySelectorAll("perspective-viewer")) {
            view.setAttribute("theme", "Material Dark");
            view.restyleElement();
        }
    } else {
        theme_style_node.textContent = light_theme;
        theme_style_node.dataset.theme = "light";
        document.body.classList.remove("dark");
        window.theme.textContent = "Dark Theme";
        for (const view of document.querySelectorAll("perspective-viewer")) {
            view.setAttribute("theme", "Material Light");
            view.restyleElement();
        }
    }

    // document.querySelector("perspective-workspace").restyle();
}

window.addEventListener("load", async () => {
    document.body.innerHTML = `
        <style>

        </style>
        <div id='buttons'>
            <span id="message"></span>
            <select id="layouts"></select>
            <button id="save_as">Save As</button>
            <input id="name_input" style="display: none"></input>
            <button id="save" style="display: none">Save</button>
            <button id="cancel" style="display: none">Cancel</button>
            <button id="theme" style="float: right">Light Theme</button>
            <button id="copy" style="float: right">Debug to Clipboard</button>
            <button id="reset" style="float: right">Reset LocalStorage</button>
            <a href="https://elkue.com/nyc-slice/">NYC Slice Data by Liam Quigley</a>
            <a href="https://github.com/finos/perspective">Built With Perspective</a>
        </div>
        <perspective-workspace id='workspace'>
        </perspective-workspace>
    `.trim();

    toggle_theme();

    window.workspace.addTable(
        "nyc_slice",
        (async () => {
            const req = await fetch(
                "https://gist.githubusercontent.com/sinistersnare/2c3213d512dddff772a124d99fd62cc8/raw/0b71b842b7ccc1f20a501fc845a4515e8328d165/slices.csv"
            );
            const csv = await req.text();
            const table = worker.table(csv);
            return table;
        })()
    );

    const layout_names = Object.keys(LAYOUTS);
    let selected_layout = LAYOUTS[layout_names[0]];
    await window.workspace.restore(selected_layout);

    function set_layout_options() {
        const layout_names = Object.keys(LAYOUTS);
        window.layouts.innerHTML = "";
        console.log(layout_names);
        for (const layout of layout_names) {
            window.layouts.innerHTML += `<option${
                layout === selected_layout ? " selected='true'" : ""
            }>${layout}</option>`;
        }
    }

    set_layout_options();
    window.name_input.value = layout_names[0];
    window.layouts.addEventListener("change", async () => {
        if (window.layouts.value.trim().length === 0) {
            return;
        }
        window.workspace.innerHTML = "";
        await window.workspace.restore(LAYOUTS[window.layouts.value]);
        window.name_input.value = window.layouts.value;
    });

    window.save_as.addEventListener("click", async () => {
        window.save_as.style.display = "none";
        window.save.style.display = "inline-block";
        window.cancel.style.display = "inline-block";
        window.name_input.style.display = "inline-block";
        window.copy.style.display = "none";
        window.layouts.style.display = "none";
    });

    function cancel() {
        window.save_as.style.display = "inline-block";
        window.save.style.display = "none";
        window.cancel.style.display = "none";
        window.name_input.style.display = "none";
        window.copy.style.display = "inline-block";
        window.layouts.style.display = "inline-block";
    }

    window.cancel.addEventListener("click", cancel);

    window.reset.addEventListener("click", () => {
        localStorage.clear();
        window.reset.innerText = "Reset!";
        setTimeout(() => {
            window.reset.innerText = "Reset LocalStorage";
        }, 1000);
    });

    window.save.addEventListener("click", async () => {
        const token = await window.workspace.save();
        const new_name = window.name_input.value;
        LAYOUTS[new_name] = token;
        set_layout_options();
        window.layouts.value = new_name;
        window.save_as.innerText = "Saved!";
        setTimeout(() => {
            window.save_as.innerText = "Save As";
        }, 1000);
        localStorage.setItem("layouts", JSON.stringify(LAYOUTS));
        cancel();
    });

    window.copy.addEventListener("click", async () => {
        await navigator.clipboard.writeText(JSON.stringify(LAYOUTS));
        window.copy.innerText = "Copied!";
        setTimeout(() => {
            window.copy.innerText = "Debug to Clipboard";
        }, 1000);
    });

    window.theme.addEventListener("click", toggle_theme);
});
