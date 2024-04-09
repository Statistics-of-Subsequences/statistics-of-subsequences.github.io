/* -- Carousel Navigation -- */
const animationTime = 600;
let handleLeftClick = () => {};
let handleRightClick = () => {};

document.addEventListener("DOMContentLoaded", () => {
    let activeIndex = 0;
    const slides = document.getElementsByTagName("main");
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