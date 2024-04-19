import getSortedLevels from "./level.js";

window.addEventListener("DOMContentLoaded", async () => {
    document.cookie = "page=2;";
    
    document.querySelector("#back-button").onclick = () => {
        window.open("./matrix-builder.html", "_self");
    };

    let levelData = await getSortedLevels();

    const difficultyColumns = document.querySelectorAll(".level-column");
    
    for(let i = 0; i < levelData.length; i++) {
        const button = document.createElement("button");
        button.classList.add("fancy-button");
        button.innerText = `Level ${i + 1}`;

        button.onclick = () => {
            window.open(`../../matrix-builder-game.html?id=${i}`, "_self");
        };

        const column = Math.max(1, Math.min(5, levelData[i].difficulty)) - 1;
        difficultyColumns[column].appendChild(button);
        difficultyColumns[column].classList.remove("hidden");
    }
});