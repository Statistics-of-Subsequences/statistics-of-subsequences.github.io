/* -- Carousel Navigation -- */
const animationTime = 600;
let handleLeftClick = () => {};
let handleRightClick = () => {};

document.addEventListener("DOMContentLoaded", () => {
    let potentialPage = document.cookie.split(";").map(c => c.trim()).filter(c => c.startsWith("page="))[0];

    let activeIndex = 0;
    
    const slides = document.getElementsByTagName("main");
    if(potentialPage) {
        potentialPage = parseInt(potentialPage.replace("page=", ""));
        if(potentialPage) {
            activeIndex = Math.max(0, Math.min(slides.length, potentialPage));
            const rightIndex = activeIndex === slides.length - 1 ? 0 : activeIndex + 1;
            const leftIndex = activeIndex === 0 ? slides.length - 1 : activeIndex - 1;
            const oppositeIndex = leftIndex === 0 ? slides.length - 1 : leftIndex - 1;

            slides[activeIndex].classList.remove("left");
            slides[activeIndex].classList.remove("right");
            slides[activeIndex].classList.remove("hidden");
            slides[leftIndex].classList.add("left");
            slides[leftIndex].classList.remove("right");
            slides[leftIndex].classList.remove("hidden");
            slides[rightIndex].classList.remove("left");
            slides[rightIndex].classList.add("right");
            slides[rightIndex].classList.remove("hidden");
            slides[oppositeIndex].classList.remove("left");
            slides[oppositeIndex].classList.remove("right");
            slides[oppositeIndex].classList.add("hidden");
        }
    }
    let canRun = true;

    const lrTransition = document.createElement("style");
    lrTransition.textContent = `
    .content-label { 
        transition: ${animationTime}ms ease-in-out transform;
    }

    .content-title>h2 {
        transition: ${animationTime}ms ease-in-out transform;
    }
    `;
    document.head.appendChild(lrTransition);

    handleLeftClick = () => {
        if(canRun) {
            canRun = false;
            const rightIndex = activeIndex === slides.length - 1 ? 0 : activeIndex + 1;
            const leftIndex = activeIndex === 0 ? slides.length - 1 : activeIndex - 1;
            const oppositeIndex = leftIndex === 0 ? slides.length - 1 : leftIndex - 1;

            slides[rightIndex].classList.add("hidden");
            slides[rightIndex].classList.remove("right");

            slides[activeIndex].classList.add("right");
            slides[leftIndex].classList.remove("left");
            slides[oppositeIndex].classList.add("left");
            slides[oppositeIndex].classList.remove("hidden");

            activeIndex = leftIndex;
            setTimeout(() => canRun = true, animationTime + 10);
        }
    }

    handleRightClick = () => {
        if(canRun) {
            canRun = false;
            const rightIndex = activeIndex === slides.length - 1 ? 0 : activeIndex + 1;
            const leftIndex = activeIndex === 0 ? slides.length - 1 : activeIndex - 1;
            const oppositeIndex = leftIndex === 0 ? slides.length - 1 : leftIndex - 1;

            slides[leftIndex].classList.add("hidden");
            slides[leftIndex].classList.remove("left");

            slides[activeIndex].classList.add("left");
            slides[rightIndex].classList.remove("right");
            slides[oppositeIndex].classList.add("right");
            slides[oppositeIndex].classList.remove("hidden");

            activeIndex = rightIndex;
            setTimeout(() => canRun = true, animationTime + 10);
        }
    }
});