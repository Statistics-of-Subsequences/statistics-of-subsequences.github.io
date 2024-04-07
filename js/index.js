/* -- Carousel Navigation -- */

let handleLeftClick = () => {};
let handleRightClick = () => {};

document.addEventListener("DOMContentLoaded", () => {
    let activeIndex = 0;
    const slides = document.getElementsByTagName("main");

    handleLeftClick = () => {
        const nextIndex = activeIndex === 0 ? slides.length - 1 : activeIndex - 1;

        slides[nextIndex].classList.remove("hidden");
        slides[activeIndex].classList.add("hidden");
        activeIndex = nextIndex;
    }

    handleRightClick = () => {
        const nextIndex = activeIndex === slides.length - 1 ? 0 : activeIndex + 1;

        slides[nextIndex].classList.remove("hidden");
        slides[activeIndex].classList.add("hidden");
        activeIndex = nextIndex;
    }
});