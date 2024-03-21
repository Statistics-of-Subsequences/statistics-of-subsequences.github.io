/* -- Carousel Navigation -- */

let activeIndex = 0;

const slides = document.getElementsByTagName("content");

function setup() {
    // if the device is portrait mode, rotate the screen
    if (window.innerHeight > window.innerWidth) {
        // document.body.style.transform = "rotate(90deg)";
        //send popup message
        alert("Please rotate your device to landscape mode to view this page");
    }

    // lock the screen orientation
    screen.orientation.lock("landscape-primary");
}

window.addEventListener("resize", setup);


const handleLeftClick = () => {
    const nextIndex = activeIndex - 1 >= 0 ? activeIndex - 1 : slides.length - 1;

    const currentSlide = document.querySelector(`[data-index="${activeIndex}"]`),
        nextSlide = document.querySelector(`[data-index="${nextIndex}"]`);

    currentSlide.dataset.status = "after";

    nextSlide.dataset.status = "becoming-active-from-before";

    setTimeout(() => {
        nextSlide.dataset.status = "active";
        activeIndex = nextIndex;
    });
}

const handleRightClick = () => {
    const nextIndex = activeIndex + 1 <= slides.length - 1 ? activeIndex + 1 : 0;

    const currentSlide = document.querySelector(`[data-index="${activeIndex}"]`),
        nextSlide = document.querySelector(`[data-index="${nextIndex}"]`);

    currentSlide.dataset.status = "before";

    nextSlide.dataset.status = "becoming-active-from-after";

    setTimeout(() => {
        nextSlide.dataset.status = "active";
        activeIndex = nextIndex;
    });
}
