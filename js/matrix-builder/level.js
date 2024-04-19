export default async function getSortedLevels() {
    let levels = await fetch("../res/levelData.json").then(j => j.json());
    levels.forEach(e => {
        e.difficulty = Object.values(e.allowedProperties).filter(v => v).length;
    });
    levels = levels.sort(v => v.difficulty);
    levels.reverse();

    return levels;
}