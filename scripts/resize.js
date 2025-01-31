//resize
const resizeElement = (target, hook) => {
    const page = document.querySelector(`main`);
    let initialWidth;
    let initialHeight;

    const initializeResizing = (event) => {
        event.stopPropagation();
        event.preventDefault();

        getStartingMouseCoordinates(event);
        initialWidth = target.width;
        initialHeight = target.height;

        page.addEventListener("mousemove", resize);
        page.addEventListener("mouseup", stopResize);
        hook.addEventListener("mouseup", stopResize);
    }

    const resize = (event) => {
        getMouseCoordinates(event);
        let newWidth;
        let newHeight;

        //if (event.shiftKey) {  //for img, try to keep ratio even no shift key pressed
        if ( target instanceof PhotobookImage ) {
            const ratioWidth = mouseX - mouseX0 + initialWidth;
            const resizeRatio = ratioWidth / initialWidth;
            newWidth = initialWidth * resizeRatio;
            newHeight = initialHeight * resizeRatio;

            target.width = initialWidth * resizeRatio;
            if (target instanceof TextBox) {
                if (newHeight >= target.fontSize + 20) {
                    target.height = newHeight;
                }
            }
            else {
                target.height = newHeight;
            }
        }
        else {
            newWidth = mouseX - mouseX0 + initialWidth;
            newHeight = mouseY - mouseY0 + initialHeight;

            target.width = newWidth;
            if (target instanceof TextBox) {
                if (newHeight >= target.fontSize + 20) {
                    target.height = newHeight;
                }
            }
            else {
                target.height = newHeight;
            }
        }
    }

    const stopResize = () => {
        page.removeEventListener("mousemove", resize);
        page.removeEventListener("mouseup", stopResize);
    }

    hook.addEventListener("mousedown", initializeResizing);
}